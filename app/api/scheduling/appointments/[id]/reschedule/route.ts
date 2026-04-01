import { NextResponse } from "next/server";
import { DateTime } from "luxon";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { getMinBookableUtc } from "@/lib/scheduling/lead-time";
import { isBodyTooLarge, isValidTimezone, isValidUuid } from "@/lib/validation";

const BUSY_STATUSES = ["pending", "confirmed", "completed"] as const;

type Body = {
  startUtc?: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (isBodyTooLarge(req, 4096)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const appointmentId = cleanString(params.id);
  const startUtcRaw = cleanString(body.startUtc);

  if (!appointmentId || !isValidUuid(appointmentId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const startUtc = DateTime.fromISO(startUtcRaw, { zone: "utc" });
  if (!startUtc.isValid) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  const current = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    include: { meetingType: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const orgId = current.orgId;
  if (current.userId !== who.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["pending", "confirmed"].includes(String(current.status))) {
    return NextResponse.json(
      { error: "Only pending or confirmed bookings can be rescheduled." },
      { status: 400 }
    );
  }

  const createdAtUtc = DateTime.fromJSDate(
    current.createdAt instanceof Date
      ? current.createdAt
      : new Date(current.createdAt)
  ).toUTC();
  const rescheduleWindowEnds = createdAtUtc.plus({ hours: 1 });
  if (DateTime.utc() > rescheduleWindowEnds) {
    return NextResponse.json(
      {
        error:
          "Reschedule window expired. Please request a reschedule from admin.",
      },
      { status: 403 }
    );
  }

  const minBookable = getMinBookableUtc();
  if (startUtc < minBookable) {
    return NextResponse.json(
      { error: "Selected time is too soon. Please choose a later slot." },
      { status: 400 }
    );
  }

  const durationMin = Number(current.meetingType?.durationMin) || 60;
  const endUtc = startUtc.plus({ minutes: durationMin });

  // Blocked time checks
  const blocked = await prisma.blockedTime.findFirst({
    where: {
      orgId,
      startAtUtc: { lt: endUtc.toJSDate() },
      endAtUtc: { gte: startUtc.toJSDate() },
    },
    select: { id: true },
  });
  if (blocked) {
    return NextResponse.json(
      { error: "Selected time is blocked." },
      { status: 409 }
    );
  }

  // Appointment overlap checks
  const conflicts = await prisma.appointment.findFirst({
    where: {
      orgId,
      status: { in: [...BUSY_STATUSES] },
      startAtUtc: { lt: endUtc.toJSDate() },
      endAtUtc: { gte: startUtc.toJSDate() },
      id: { not: appointmentId },
    },
    select: { id: true },
  });
  if (conflicts) {
    return NextResponse.json(
      { error: "Selected time is no longer available." },
      { status: 409 }
    );
  }

  // Per-user daily limit, excluding current appointment.
  // Use the user's profile timezone when available; count bookings created today.
  const profile = await prisma.bookingProfile.findFirst({
    where: { userId: who.userId },
    select: { timezone: true },
  });
  const profileTz = profile?.timezone;
  const limitTz =
    profileTz && isValidTimezone(profileTz) ? profileTz : "UTC";
  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { maxDailyBookings: true },
  });
  const maxDailyBookings =
    typeof settings?.maxDailyBookings === "number" && settings.maxDailyBookings > 0
      ? settings.maxDailyBookings
      : 5;
  const dayStart = DateTime.now().setZone(limitTz).startOf("day").toUTC();
  const dayEnd = DateTime.now().setZone(limitTz).endOf("day").toUTC();
  const dayCount = await prisma.appointment.findMany({
    where: {
      orgId,
      userId: who.userId,
      status: { in: ["pending", "confirmed"] },
      createdAt: { gte: dayStart.toJSDate(), lte: dayEnd.toJSDate() },
      id: { not: appointmentId },
    },
    select: { id: true },
    take: maxDailyBookings + 1,
  });
  if (dayCount.length >= maxDailyBookings) {
    return NextResponse.json(
      { error: "Daily booking limit reached. Please choose another day." },
      { status: 409 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      startAtUtc: startUtc.toJSDate(),
      endAtUtc: endUtc.toJSDate(),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ item: updated });
}
