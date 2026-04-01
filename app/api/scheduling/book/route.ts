// app/api/scheduling/book/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/scheduling/audit";
import { sendBookingEmails } from "@/lib/scheduling/notify";
import { getOrgPolicies } from "@/lib/scheduling/policy";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { getMeetingLink } from "@/lib/scheduling/meeting-link";
import { pickStaffForSlot } from "@/lib/scheduling/auto-assignment";
import { getMinBookableUtc } from "@/lib/scheduling/lead-time";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";
import {
  isBodyTooLarge,
  isValidNotes,
  isValidTimezone,
  isValidUuid,
} from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

type MeetingMode = "google_meet" | "zoom" | "phone" | "in_person";
type Status = "pending" | "confirmed" | "declined" | "canceled" | "completed";
type PaymentPolicy = "FREE" | "PAID";

const BUSY_STATUSES: Status[] = ["pending", "confirmed", "completed"];

// Buffer policy (MVP)
const DEFAULT_BUFFER_MIN = 0;
const MAX_BUFFER_MIN = 0;

function clampBuffer(n: number) {
  return Math.min(MAX_BUFFER_MIN, Math.max(0, n));
}

type WorkingHours = {
  bufferMin?: number;
  slotStepMin?: number;
  timezone?: string;
};

function parseWorkingHours(raw: unknown): WorkingHours {
  if (!raw) return {};
  try {
    return typeof raw === "string"
      ? (JSON.parse(raw) as WorkingHours)
      : (raw as WorkingHours);
  } catch {
    return {};
  }
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type Body = {
  orgId: string;
  staffUserId?: string; // optional
  meetingTypeId: string;
  mode: MeetingMode;

  startLocal: string;
  tz?: string;
  notes?: string;
};

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 4096)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let orgId = cleanString(body.orgId);
  let meetingTypeId = cleanString(body.meetingTypeId);
  let mode = cleanString(body.mode) as MeetingMode;
  let startLocalRaw = cleanString(body.startLocal);
  let tz = cleanString(body.tz);
  const notes = cleanString(body.notes);
  const allowedModes: MeetingMode[] = [
    "google_meet",
    "zoom",
    "phone",
    "in_person",
  ];

  if (notes && !isValidNotes(notes, 0, 1000)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });
  const userId = who.userId;

  if (!orgId) {
    orgId = await resolveOrgIdForRequest({
      orgId,
      userId,
      allowPublic: true,
    });
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 },
    );
  }

  if (!meetingTypeId || !mode || !startLocalRaw) {
    return NextResponse.json(
      { error: "Missing meetingTypeId, mode, startLocal" },
      { status: 400 },
    );
  }

  if (!allowedModes.includes(mode)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isValidUuid(orgId) || !isValidUuid(meetingTypeId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (startLocalRaw.length > 40) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const policies = await getOrgPolicies(orgId);
  const resolvedTz = tz || policies.defaultTz || "Europe/Luxembourg";
  if (!isValidTimezone(resolvedTz)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const profileRow = await prisma.bookingProfile.findFirst({
    where: { userId },
    select: { timezone: true },
  });
  const profileTz = cleanString(profileRow?.timezone);
  const limitTz = isValidTimezone(profileTz || "") ? profileTz! : resolvedTz;

  // 1) duration (+ payment info for notes)
  const mt = await prisma.meetingType.findFirst({
    where: { id: meetingTypeId, orgId, isActive: true },
    include: {
      modes: { select: { mode: true, details: true } },
    },
  });

  if (!mt) {
    return NextResponse.json(
      { error: "Meeting type not found" },
      { status: 404 },
    );
  }

  const allowedMtModes = mt.modes.map((m) => m.mode);
  if (!allowedMtModes.includes(mode)) {
    return NextResponse.json(
      { error: "Selected mode is not available for this meeting type." },
      { status: 409 },
    );
  }

  const durationMin = Math.max(15, Math.min(240, mt.durationMin || 60));

  const effectivePaymentPolicy: PaymentPolicy =
    mt.paymentPolicy === "FREE"
      ? "FREE"
      : mt.paymentPolicy
      ? "PAID"
      : policies.paymentPolicy;
  const paymentRequiredByPolicy = effectivePaymentPolicy !== "FREE";

  // Enforce payment policy at booking time
  const resolvedPriceCents =
    mt.priceCents ?? policies.defaultPaymentCents ?? null;
  const resolvedCurrency = mt.currency ?? policies.defaultCurrency ?? null;
  let paymentStatus: "not_required" | "unpaid" | "paid" = "not_required";
  if (paymentRequiredByPolicy) {
    return NextResponse.json(
      {
        error:
          "Paid bookings are confirmed only after Stripe webhook processing. Start from checkout instead of the booking endpoint.",
      },
      { status: 409 },
    );
  }

  // 2) local -> utc
  const startLocal = DateTime.fromISO(startLocalRaw, { zone: resolvedTz });
  if (!startLocal.isValid) {
    return NextResponse.json(
      { error: "Invalid startLocal. Use ISO like 2026-01-08T10:00:00" },
      { status: 400 },
    );
  }

  const startUtc = startLocal.toUTC();
  const endUtc = startUtc.plus({ minutes: durationMin });

  const minBookable = getMinBookableUtc();
  if (startUtc < minBookable) {
    return NextResponse.json(
      { error: "Please choose a later time." },
      { status: 400 },
    );
  }

  const maxDailyBookings =
    typeof policies.maxDailyBookings === "number" &&
    policies.maxDailyBookings > 0
      ? policies.maxDailyBookings
      : 5;
  // Limit each customer to N bookings per local day (based on booking creation day).
  const dayStartUtc = DateTime.now().setZone(limitTz).startOf("day").toUTC();
  const dayEndUtc = DateTime.now().setZone(limitTz).endOf("day").toUTC();
  const userDaily = await prisma.appointment.findMany({
    where: {
      orgId,
      userId,
      status: { in: BUSY_STATUSES },
      createdAt: {
        gte: dayStartUtc.toJSDate(),
        lte: dayEndUtc.toJSDate(),
      },
    },
    select: { id: true },
    take: maxDailyBookings + 1,
  });

  if (userDaily.length >= maxDailyBookings) {
    return NextResponse.json(
      { error: "Daily booking limit reached. Please choose another day." },
      { status: 409 },
    );
  }

  // Prevent the same user from double-booking overlapping times (any staff).
  const userOverlap = await prisma.appointment.findFirst({
    where: {
      orgId,
      userId,
      status: { in: BUSY_STATUSES },
      startAtUtc: { lt: endUtc.toJSDate() },
      endAtUtc: { gt: startUtc.toJSDate() },
    },
    select: { id: true },
  });

  if (userOverlap) {
    return NextResponse.json(
      { error: "You already have a booking in this time slot." },
      { status: 409 },
    );
  }

  // 3) staff selection (and buffer source)
  let staffUserId = cleanString(body.staffUserId) || null;
  let workingHours: unknown = null;
  let usingOrgDefaults = false;

  if (!staffUserId) {
    const auto = await pickStaffForSlot({
      orgId,
      startUtc: startUtc.toJSDate(),
      endUtc: endUtc.toJSDate(),
      bookingTz: resolvedTz,
    });
    staffUserId = auto.staffUserId;
    workingHours = auto.workingHours;
    usingOrgDefaults = auto.usingOrgDefaults;

    if (auto.noStaffAvailable) {
      return NextResponse.json(
        { error: "No available staff for this time slot." },
        { status: 409 },
      );
    }
  } else {
    if (!isValidUuid(staffUserId)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const staff = await prisma.staffCalendar.findFirst({
      where: { orgId, staffUserId },
      select: { workingHours: true },
    });

    workingHours = staff?.workingHours ?? null;
  }

  if (!staffUserId && !usingOrgDefaults) {
    return NextResponse.json(
      { error: "No active staff calendars configured yet" },
      { status: 409 },
    );
  }

  // ✅ bufferMin comes from staff working hours (same source as availability),
  // fallback to DEFAULT_BUFFER_MIN
  const wh = parseWorkingHours(workingHours);
  const bufferMin = clampBuffer(wh.bufferMin ?? DEFAULT_BUFFER_MIN);

  // Expand new booking window by buffer:
  const startWithBuffer = startUtc.minus({ minutes: bufferMin });
  const endWithBuffer = endUtc.plus({ minutes: bufferMin });

  // 4) overlap check (strict overlap) + buffer
  const conflicts = await prisma.appointment.findFirst({
    where: {
      orgId,
      status: { in: BUSY_STATUSES },
      startAtUtc: { lt: endWithBuffer.toJSDate() },
      endAtUtc: { gt: startWithBuffer.toJSDate() },
      ...(staffUserId ? { staffUserId } : {}),
    },
    select: { id: true },
  });

  if (conflicts) {
    return NextResponse.json(
      { error: `Slot already booked (includes ${bufferMin}min buffer)` },
      { status: 409 },
    );
  }

  // 5) status by approval policy
  const status: Status =
    policies.approvalPolicy === "AUTO_APPROVE" ? "confirmed" : "pending";

  // 6) payment policy note
  const paymentNote =
    effectivePaymentPolicy === "FREE"
      ? null
      : `payment_policy=${effectivePaymentPolicy}; requires_payment=${paymentRequiredByPolicy}; price_cents=${resolvedPriceCents ?? "n/a"}; currency=${resolvedCurrency ?? "n/a"}`;

  const bufferNote = bufferMin ? `buffer_min=${bufferMin}` : null;

  try {
    // 7) ✅ global booking profile: query by userId only (orgId is nullable / not part of key)
    const profile = await prisma.bookingProfile.findFirst({
      where: { userId },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Missing booking profile" },
        { status: 409 },
      );
    }

    // 8) ensure org membership (still org-scoped)
    const member = await prisma.orgMember.findFirst({
      where: { orgId, userId },
      select: { id: true },
    });

    if (!member) {
      await prisma.orgMember.create({
        data: {
          id: crypto.randomUUID(),
          orgId,
          userId,
          role: "customer",
        },
      });
    }

    const timezoneNotice =
      profile.timezone && profile.timezone !== resolvedTz
        ? `Booked in ${resolvedTz}. Your profile timezone is ${profile.timezone}.`
        : null;
    const appointmentPriceCents = paymentRequiredByPolicy
      ? resolvedPriceCents
      : null;
    const appointmentCurrency = paymentRequiredByPolicy
      ? resolvedCurrency
      : null;

    // 9) create appointment (still org-scoped)
    const appointmentId = crypto.randomUUID();
    const modeDetails = mt.modes.find((m) => m.mode === mode)?.details as
      | { link?: string }
      | null
      | undefined;
    const joinLink = getMeetingLink({
      appointmentId,
      mode,
      overrideLink: modeDetails?.link ?? null,
    });
    const appt = await prisma.appointment.create({
      data: {
        id: appointmentId,
        orgId,
        userId,
        staffUserId: staffUserId ?? null,
        meetingTypeId,
        status,
        mode,
        joinLink,
        paymentPolicy: effectivePaymentPolicy,
        paymentStatus,
        requiresPayment: paymentRequiredByPolicy,
        priceCents: appointmentPriceCents,
        currency: appointmentCurrency,
        startAtUtc: startUtc.toJSDate(),
        endAtUtc: endUtc.toJSDate(),
        notes:
          [
            notes || null,
            paymentNote,
            bufferNote,
          ]
            .filter(Boolean)
            .concat(
              `booker_name=${profile.fullName}`,
              `booker_phone=${profile.phone}`,
              profile.company ? `booker_company=${profile.company}` : null,
              profile.companyRole
                ? `booker_company_role=${profile.companyRole}`
                : null,
              `booker_tz=${resolvedTz}`,
              profile.timezone && profile.timezone !== resolvedTz
                ? `profile_tz=${profile.timezone}`
                : null,
              profile.notes ? `booker_notes=${profile.notes}` : null,
            )
            .filter(Boolean)
            .join("\n") || null,
      },
    });

    await writeAudit({
      orgId,
      actorUserId: userId,
      entityType: "appointment",
      entityId: appt.id,
      action: "create",
      before: null,
      after: appt,
    });

    let emailError: string | null = null;
    try {
      await sendBookingEmails({ appointmentId: appt.id });
    } catch (err: unknown) {
      emailError =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : null;
      console.error("sendBookingEmails failed", emailError);
    }
    const meetingLink =
      appt.status === "confirmed" ? (appt.joinLink ?? null) : null;

    return NextResponse.json(
      {
        appointment: {
          ...appt,
          startAtUtc: startUtc.toISO(),
          endAtUtc: endUtc.toISO(),
        },
        meetingLink,
        policies: {
          approvalPolicy: policies.approvalPolicy,
          paymentPolicy: effectivePaymentPolicy,
        },
        payment: {
          status: appt.paymentStatus ?? paymentStatus,
          priceCents:
            appt.priceCents ?? appointmentPriceCents ?? null,
          currency: appt.currency ?? appointmentCurrency ?? null,
        },
        timezoneNotice,
        emailError,
        buffer: {
          bufferMin,
          rule: "conflict if existing.start < (newEnd+buffer) AND existing.end > (newStart-buffer)",
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const details =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);

    console.error("Booking failed", details);
    return NextResponse.json(
      { error: "Booking failed", details },
      { status: 500 },
    );
  }
}
