import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeForOrg } from "@/lib/stripe";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { getOrCreatePaidBookingAttempt } from "@/lib/scheduling/paid-booking";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  isBodyTooLarge,
  isValidNotes,
  isValidTimezone,
  isValidUuid,
} from "@/lib/validation";
import { getPublicBaseUrl } from "@/lib/public-url";

type MeetingMode = "google_meet" | "zoom" | "phone" | "in_person";

type Body = {
  orgId?: string;
  meetingTypeId: string;
  mode: MeetingMode;
  startLocal: string;
  meetingTitle?: string;
  tz?: string;
  staffUserId?: string;
  notes?: string;
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
  const tz = cleanString(body.tz);
  const staffUserId = cleanString(body.staffUserId);
  const notes = cleanString(body.notes);

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

  if (notes && !isValidNotes(notes, 0, 1000)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let attempt;
  try {
    attempt = await getOrCreatePaidBookingAttempt({
      orgId: orgId || null,
      userId: who.userId,
      meetingTypeId,
      mode,
      startLocal,
      tz: tz || null,
      staffUserId: staffUserId || null,
      notes: notes || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment setup failed.";
    const status = message === "Meeting type not found" ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }

  const origin = getPublicBaseUrl(req);
  const statusUrl = `${origin}/scheduling/payment/success?attempt_id=${attempt.attemptId}`;
  if (
    attempt.status === "payment_processing" ||
    attempt.status === "paid" ||
    attempt.status === "booking_confirmed" ||
    attempt.status === "booking_failed"
  ) {
    return NextResponse.json({
      bookingAttemptId: attempt.attemptId,
      sessionId: attempt.stripeCheckoutSessionId,
      url: statusUrl,
    });
  }

  const stripe = await getStripeForOrg(attempt.orgId);
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured for this organization." },
      { status: 409 }
    );
  }

  const successUrl = `${statusUrl}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/scheduling/payment/cancel?attempt_id=${attempt.attemptId}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: attempt.currency.toLowerCase(),
            unit_amount: attempt.priceCents,
            product_data: {
              name: "Lux AI Session",
              description: "Booking payment",
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: {
          bookingAttemptId: attempt.attemptId,
          orgId: attempt.orgId,
          meetingTypeId,
          mode: attempt.mode,
          startLocal: attempt.startLocal,
          tz: attempt.requestedTimezone,
          staffUserId: attempt.staffUserId || "",
          userId: who.userId,
        },
      },
      metadata: {
        bookingAttemptId: attempt.attemptId,
        orgId: attempt.orgId,
        meetingTypeId,
        mode: attempt.mode,
        startLocal: attempt.startLocal,
        tz: attempt.requestedTimezone,
        staffUserId: attempt.staffUserId || "",
        userId: who.userId,
      },
    },
    {
      idempotencyKey: `booking_attempt:${attempt.attemptId}`,
    }
  );

  await prisma.paymentRecord.update({
    where: { id: attempt.paymentId },
    data: {
      stripeCheckoutSessionId: session.id,
      metadata: {
        orgId: attempt.orgId,
        meetingTypeId,
        mode: attempt.mode,
        startLocal: attempt.startLocal,
        tz: attempt.requestedTimezone,
        staffUserId: attempt.staffUserId || "",
        userId: who.userId,
      },
    },
  });

  return NextResponse.json({
    bookingAttemptId: attempt.attemptId,
    sessionId: session.id,
    url: session.url,
  });
}
