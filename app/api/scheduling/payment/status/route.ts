import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { refreshPaidBookingAttemptState } from "@/lib/scheduling/paid-booking";
import { getPaymentReservationTimeoutMinutes } from "@/lib/scheduling/payment-reservation";
import { isValidUuid } from "@/lib/validation";

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const url = new URL(req.url);
  const attemptId = (url.searchParams.get("attemptId") ?? "").trim();
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
      meetingType: {
        select: {
          id: true,
          key: true,
          durationMin: true,
        },
      },
      appointment: {
        select: {
          id: true,
          status: true,
          startAtUtc: true,
          endAtUtc: true,
          mode: true,
          joinLink: true,
          paymentStatus: true,
          priceCents: true,
          currency: true,
        },
      },
      reservation: {
        select: {
          id: true,
          status: true,
          staffUserId: true,
          reservedUntil: true,
          startAtUtc: true,
          endAtUtc: true,
        },
      },
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          status: true,
          amountCents: true,
          currency: true,
          stripeCheckoutSessionId: true,
          stripePaymentIntentId: true,
          paidAt: true,
          failedAt: true,
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Booking attempt not found" }, { status: 404 });
  }

  const payment = attempt.payments[0] ?? null;
  return NextResponse.json({
    reservationHoldMinutes: getPaymentReservationTimeoutMinutes(),
    bookingAttempt: {
      id: attempt.id,
      status: attempt.status,
      paymentStatus: attempt.paymentStatus,
      mode: attempt.mode,
      startLocal: attempt.startLocal,
      requestedTimezone: attempt.requestedTimezone,
      startAtUtc: attempt.startAtUtc.toISOString(),
      endAtUtc: attempt.endAtUtc.toISOString(),
      priceCents: attempt.priceCents,
      currency: attempt.currency,
      reservedUntil: attempt.reservedUntil ? attempt.reservedUntil.toISOString() : null,
      failureReason: attempt.failureReason,
      canResumePayment:
        attempt.status === "payment_pending" &&
        !!attempt.reservation &&
        attempt.reservation.status === "active" &&
        attempt.reservation.reservedUntil > new Date(),
      notes: attempt.notes,
      meetingType: attempt.meetingType
        ? {
            id: attempt.meetingType.id,
            key: attempt.meetingType.key,
            durationMin: attempt.meetingType.durationMin,
        }
      : null,
      reservation: attempt.reservation
        ? {
            id: attempt.reservation.id,
            status: attempt.reservation.status,
            staffUserId: attempt.reservation.staffUserId,
            reservedUntil: attempt.reservation.reservedUntil.toISOString(),
            startAtUtc: attempt.reservation.startAtUtc.toISOString(),
            endAtUtc: attempt.reservation.endAtUtc.toISOString(),
          }
        : null,
    },
    payment: payment
      ? {
          status: payment.status,
          amountCents: payment.amountCents,
          currency: payment.currency,
          stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
          failedAt: payment.failedAt ? payment.failedAt.toISOString() : null,
        }
      : null,
    appointment: attempt.appointment
      ? {
          id: attempt.appointment.id,
          status: attempt.appointment.status,
          startAtUtc: attempt.appointment.startAtUtc.toISOString(),
          endAtUtc: attempt.appointment.endAtUtc.toISOString(),
          mode: attempt.appointment.mode,
          paymentStatus: attempt.appointment.paymentStatus,
          priceCents: attempt.appointment.priceCents,
          currency: attempt.appointment.currency,
          meetingLink:
            attempt.appointment.status === "confirmed"
              ? attempt.appointment.joinLink
              : null,
        }
      : null,
  });
}
