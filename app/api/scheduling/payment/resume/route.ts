import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPublicBaseUrl } from "@/lib/public-url";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { refreshPaidBookingAttemptState } from "@/lib/scheduling/paid-booking";
import { getStripeForOrg } from "@/lib/stripe";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 1024)) {
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

  const body = await req.json().catch(() => ({}));
  const attemptId =
    typeof body?.attemptId === "string" ? body.attemptId.trim() : "";
  if (!attemptId || !isValidUuid(attemptId)) {
    return NextResponse.json({ error: "Invalid attemptId" }, { status: 400 });
  }

  await refreshPaidBookingAttemptState(attemptId);

  const attempt = await prisma.bookingAttempt.findFirst({
    where: {
      id: attemptId,
      userId: who.userId,
    },
    include: {
      reservation: {
        select: {
          status: true,
          reservedUntil: true,
        },
      },
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          stripeCheckoutSessionId: true,
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Booking attempt not found" }, { status: 404 });
  }

  const reservationActive =
    attempt.status === "payment_pending" &&
    attempt.reservation?.status === "active" &&
    attempt.reservation.reservedUntil > new Date();
  if (!reservationActive) {
    return NextResponse.json(
      { error: "This payment attempt can no longer be resumed." },
      { status: 409 }
    );
  }

  const payment = attempt.payments[0] ?? null;
  if (!payment?.stripeCheckoutSessionId) {
    return NextResponse.json(
      { error: "No active Stripe session was found for this booking attempt." },
      { status: 409 }
    );
  }

  const stripe = await getStripeForOrg(attempt.orgId);
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured for this organization." },
      { status: 409 }
    );
  }

  const session = await stripe.checkout.sessions.retrieve(
    payment.stripeCheckoutSessionId
  );
  if (session.status !== "open" || !session.url) {
    return NextResponse.json(
      { error: "This Stripe session is no longer available. Please choose a slot again." },
      { status: 409 }
    );
  }

  const origin = getPublicBaseUrl(req);
  return NextResponse.json({
    bookingAttemptId: attempt.id,
    statusUrl: `${origin}/scheduling/payment/success?attempt_id=${attempt.id}`,
    url: session.url,
  });
}
