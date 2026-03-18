import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { getStripeForOrg } from "@/lib/stripe";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { isBodyTooLarge, isValidTimezone, isValidUuid } from "@/lib/validation";
import { getPublicBaseUrl } from "@/lib/public-url";

type MeetingMode = "google_meet" | "zoom" | "phone" | "in_person";
const BUSY_STATUSES = ["pending", "confirmed", "completed"] as const;

type Body = {
  orgId?: string;
  meetingTypeId: string;
  mode: MeetingMode;
  startLocal: string;
  meetingTitle?: string;
  tz?: string;
  staffUserId?: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
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

  let orgId = cleanString(body.orgId);
  const meetingTypeId = cleanString(body.meetingTypeId);
  const mode = cleanString(body.mode) as MeetingMode;
  const startLocal = cleanString(body.startLocal);
  const meetingTitle = cleanString(body.meetingTitle);
  const tz = cleanString(body.tz);
  const staffUserId = cleanString(body.staffUserId);

  if (!meetingTypeId || !mode || !startLocal) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }
  if (orgId && !isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!isValidUuid(meetingTypeId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (tz && !isValidTimezone(tz)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (staffUserId && !isValidUuid(staffUserId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const resolvedTz = tz && isValidTimezone(tz) ? tz : "UTC";
  const startLocalDt = DateTime.fromISO(startLocal, { zone: resolvedTz });
  if (!startLocalDt.isValid) {
    return NextResponse.json(
      { error: "Invalid startLocal. Use ISO like 2026-01-08T10:00:00" },
      { status: 400 }
    );
  }

  const mt = await prisma.meetingType.findFirst({
    where: { id: meetingTypeId, ...(orgId ? { orgId } : {}), isActive: true },
    include: { modes: { select: { mode: true } } },
  });

  if (!mt) {
    return NextResponse.json(
      { error: "Meeting type not found" },
      { status: 404 }
    );
  }

  orgId = orgId || mt.orgId;

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: {
      paymentPolicy: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
      maxDailyBookings: true,
    },
  });
  const fallbackPaymentCents = Number(
    process.env.DEFAULT_PAYMENT_CENTS ?? "15000"
  );
  const fallbackCurrency = (process.env.DEFAULT_PAYMENT_CURRENCY ?? "EUR").trim();

  const allowedModes = mt.modes.map((m) => m.mode);
  if (!allowedModes.includes(mode)) {
    return NextResponse.json(
      { error: "Selected mode is not available for this meeting type." },
      { status: 409 }
    );
  }
  const effectivePaymentPolicy =
    mt.paymentPolicy === "FREE"
      ? "FREE"
      : mt.paymentPolicy
      ? "PAID"
      : settings?.paymentPolicy === "FREE"
      ? "FREE"
      : "PAID";
  if (effectivePaymentPolicy === "FREE") {
    return NextResponse.json(
      { error: "This meeting type does not require payment." },
      { status: 409 }
    );
  }

  const resolvedPriceCents =
    mt.priceCents ??
    (typeof settings?.defaultPaymentCents === "number"
      ? settings.defaultPaymentCents
      : Number.isFinite(fallbackPaymentCents)
        ? fallbackPaymentCents
        : null);
  const resolvedCurrency =
    mt.currency ?? settings?.defaultCurrency ?? (fallbackCurrency || null);

  if (!resolvedPriceCents || !resolvedCurrency) {
    return NextResponse.json(
      { error: "Payment is required but price or currency is missing." },
      { status: 409 }
    );
  }

  const profile = await prisma.bookingProfile.findFirst({
    where: { userId: who.userId },
    select: { timezone: true },
  });
  const limitTz = isValidTimezone(profile?.timezone || "")
    ? (profile?.timezone as string)
    : resolvedTz;
  const maxDailyBookings =
    typeof settings?.maxDailyBookings === "number" && settings.maxDailyBookings > 0
      ? settings.maxDailyBookings
      : 5;
  // Enforce daily booking limit before creating a payment session.
  const dayStartUtc = DateTime.now().setZone(limitTz).startOf("day").toUTC();
  const dayEndUtc = DateTime.now().setZone(limitTz).endOf("day").toUTC();
  const userDaily = await prisma.appointment.findMany({
    where: {
      orgId,
      userId: who.userId,
      status: { in: [...BUSY_STATUSES] },
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
      { status: 409 }
    );
  }

  const stripe = await getStripeForOrg(orgId);
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured for this organization." },
      { status: 409 }
    );
  }

  const origin = getPublicBaseUrl(req);
  const successUrl = `${origin}/scheduling/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/scheduling/payment/cancel`;

  const displayTitle = meetingTitle || mt.key;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: resolvedCurrency.toLowerCase(),
          unit_amount: resolvedPriceCents,
          product_data: {
            name: displayTitle,
            description: "Booking payment",
          },
        },
      },
    ],
    metadata: {
      orgId,
      meetingTypeId,
      mode,
      startLocal,
      tz: tz || "",
      staffUserId: staffUserId || "",
      userId: who.userId,
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    url: session.url,
  });
}
