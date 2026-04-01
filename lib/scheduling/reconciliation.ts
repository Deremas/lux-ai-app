import { prisma } from "@/lib/prisma";
import {
  markBookingAttemptPaid,
  markBookingAttemptPaymentFailed,
} from "@/lib/scheduling/paid-booking";

const RESERVATION_TIMEOUT_REASON = "reservation_timeout";
const PAID_RECONCILE_LIMIT = 25;
const STUCK_EVENT_LIMIT = 25;
const STUCK_EVENT_MINUTES = 5;

type JsonRecord = Record<string, unknown>;

export type SchedulingCleanupSummary = {
  expiredReservations: number;
  expiredAttempts: number;
  reconciledPaidAttempts: number;
  failedPaidAttempts: number;
  repairedStripeEvents: number;
  failedStripeEvents: number;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getNestedString(value: unknown, ...path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function getNestedNumber(value: unknown, ...path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : null;
}

async function markAttemptExpired(attemptId: string, now: Date) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.bookingAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!attempt) {
      return { expiredReservation: 0, expiredAttempt: 0 };
    }

    const reservationResult = await tx.slotReservation.updateMany({
      where: {
        bookingAttemptId: attemptId,
        status: "active",
      },
      data: {
        status: "expired",
      },
    });

    if (
      attempt.status !== "payment_pending" &&
      attempt.status !== "payment_processing"
    ) {
      return {
        expiredReservation: reservationResult.count,
        expiredAttempt: 0,
      };
    }

    const attemptResult = await tx.bookingAttempt.updateMany({
      where: {
        id: attemptId,
        status: { in: ["payment_pending", "payment_processing"] },
      },
      data: {
        status: "expired",
        reservedUntil: now,
        failureReason: RESERVATION_TIMEOUT_REASON,
        ...(attempt.paymentStatus !== "paid" ? { paymentStatus: "unpaid" } : {}),
      },
    });

    return {
      expiredReservation: reservationResult.count,
      expiredAttempt: attemptResult.count,
    };
  });
}

export async function expireStaleReservations(now = new Date()) {
  const staleReservations = await prisma.slotReservation.findMany({
    where: {
      status: "active",
      reservedUntil: { lt: now },
    },
    select: {
      bookingAttemptId: true,
      bookingAttempt: {
        select: {
          status: true,
        },
      },
    },
  });

  let expiredReservations = 0;
  let expiredAttempts = 0;

  for (const reservation of staleReservations) {
    if (reservation.bookingAttempt.status === "booking_confirmed") {
      continue;
    }

    const result = await markAttemptExpired(reservation.bookingAttemptId, now);
    expiredReservations += result.expiredReservation;
    expiredAttempts += result.expiredAttempt;
  }

  return { expiredReservations, expiredAttempts };
}

export async function expireStaleAttempts(now = new Date()) {
  const staleAttempts = await prisma.bookingAttempt.findMany({
    where: {
      status: { in: ["payment_pending", "payment_processing"] },
      reservedUntil: { lt: now },
      paymentStatus: { not: "paid" },
    },
    select: { id: true },
  });

  let expiredReservations = 0;
  let expiredAttempts = 0;

  for (const attempt of staleAttempts) {
    const result = await markAttemptExpired(attempt.id, now);
    expiredReservations += result.expiredReservation;
    expiredAttempts += result.expiredAttempt;
  }

  return { expiredReservations, expiredAttempts };
}

export async function reconcilePaidUnconfirmedAttempts(limit = PAID_RECONCILE_LIMIT) {
  const attempts = await prisma.bookingAttempt.findMany({
    where: {
      OR: [{ paymentStatus: "paid" }, { status: "paid" }],
      status: { not: "booking_confirmed" },
      appointment: null,
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    include: {
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  let reconciledPaidAttempts = 0;
  let failedPaidAttempts = 0;

  for (const attempt of attempts) {
    const payment = attempt.payments[0] ?? null;
    if (!payment) {
      await prisma.bookingAttempt.updateMany({
        where: {
          id: attempt.id,
          status: { not: "booking_confirmed" },
        },
        data: {
          status: "booking_failed",
          failureReason: "missing_payment_record",
        },
      });
      failedPaidAttempts += 1;
      continue;
    }

    const result = await markBookingAttemptPaid({
      attemptId: attempt.id,
      stripeEventId:
        payment.lastStripeEventId || `reconcile_paid_attempt:${attempt.id}`,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      amountCents: payment.amountCents,
      currency: payment.currency,
    });

    if (result.success) {
      reconciledPaidAttempts += 1;
    } else {
      failedPaidAttempts += 1;
    }
  }

  return { reconciledPaidAttempts, failedPaidAttempts };
}

export async function reconcileBookingAttemptById(attemptId: string) {
  const attempt = await prisma.bookingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      appointment: {
        select: { id: true },
      },
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attempt) {
    throw new Error("Booking attempt not found.");
  }

  if (attempt.appointment?.id || attempt.status === "booking_confirmed") {
    return {
      success: true,
      handled: false,
      status: "booking_confirmed" as const,
      reason: "already_confirmed",
    };
  }

  const payment = attempt.payments[0] ?? null;
  if (!payment) {
    throw new Error("Payment record not found for booking attempt.");
  }

  if (attempt.paymentStatus !== "paid" && attempt.status !== "paid") {
    throw new Error("Only paid, unconfirmed attempts can be retried.");
  }

  const result = await markBookingAttemptPaid({
    attemptId: attempt.id,
    stripeEventId: payment.lastStripeEventId || `manual_retry:${attempt.id}`,
    stripePaymentIntentId: payment.stripePaymentIntentId,
    stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
    amountCents: payment.amountCents,
    currency: payment.currency,
  });

  return {
    success: result.success,
    handled: true,
    status: result.success ? "booking_confirmed" : result.attemptStatus,
    reason: result.success ? null : result.error,
  };
}

async function markStripeEventProcessed(eventId: string) {
  await prisma.stripeEvent.updateMany({
    where: { eventId },
    data: {
      status: "processed",
      processedAt: new Date(),
      lastError: null,
    },
  });
}

async function markStripeEventFailed(eventId: string, error: string) {
  await prisma.stripeEvent.updateMany({
    where: { eventId },
    data: {
      status: "failed",
      lastError: error,
    },
  });
}

async function repairSingleStripeEvent(event: {
  eventId: string;
  eventType: string;
  payload: unknown;
}) {
  if (!isRecord(event.payload)) {
    throw new Error("missing_event_payload");
  }

  if (event.eventType === "payment_intent.succeeded") {
    const bookingAttemptId = getNestedString(
      event.payload,
      "data",
      "object",
      "metadata",
      "bookingAttemptId"
    );
    if (!bookingAttemptId) {
      throw new Error("missing_booking_attempt_id");
    }

    const amountCents =
      getNestedNumber(event.payload, "data", "object", "amount_received") ??
      getNestedNumber(event.payload, "data", "object", "amount");
    const currency =
      getNestedString(event.payload, "data", "object", "currency") ?? "";

    if (typeof amountCents !== "number" || !currency) {
      throw new Error("missing_payment_amount_or_currency");
    }

    await markBookingAttemptPaid({
      attemptId: bookingAttemptId,
      stripeEventId: event.eventId,
      stripePaymentIntentId: getNestedString(event.payload, "data", "object", "id"),
      stripeCheckoutSessionId: null,
      amountCents,
      currency,
    });
    return;
  }

  if (event.eventType === "payment_intent.payment_failed") {
    const bookingAttemptId = getNestedString(
      event.payload,
      "data",
      "object",
      "metadata",
      "bookingAttemptId"
    );
    if (!bookingAttemptId) {
      throw new Error("missing_booking_attempt_id");
    }

    await markBookingAttemptPaymentFailed({
      attemptId: bookingAttemptId,
      stripeEventId: event.eventId,
      stripePaymentIntentId: getNestedString(event.payload, "data", "object", "id"),
      stripeCheckoutSessionId: null,
    });
    return;
  }

  if (event.eventType === "checkout.session.completed") {
    const bookingAttemptId = getNestedString(
      event.payload,
      "data",
      "object",
      "metadata",
      "bookingAttemptId"
    );
    if (!bookingAttemptId) {
      throw new Error("missing_booking_attempt_id");
    }

    const sessionId = getNestedString(event.payload, "data", "object", "id");
    const paymentIntentId = getNestedString(
      event.payload,
      "data",
      "object",
      "payment_intent"
    );

    await prisma.paymentRecord.updateMany({
      where: {
        bookingAttemptId,
        provider: "stripe",
      },
      data: {
        stripeCheckoutSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        lastStripeEventId: event.eventId,
      },
    });

    await prisma.bookingAttempt.updateMany({
      where: {
        id: bookingAttemptId,
        status: "payment_pending",
      },
      data: {
        status: "payment_processing",
      },
    });
    return;
  }

  throw new Error("unsupported_event_type");
}

export async function repairStripeEventById(eventId: string) {
  const event = await prisma.stripeEvent.findUnique({
    where: { eventId },
    select: {
      eventId: true,
      eventType: true,
      payload: true,
    },
  });

  if (!event) {
    throw new Error("Stripe event not found.");
  }

  try {
    await repairSingleStripeEvent(event);
    await markStripeEventProcessed(eventId);
    return {
      success: true,
      status: "processed" as const,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_repair_error";
    await markStripeEventFailed(eventId, message);
    return {
      success: false,
      status: "failed" as const,
      error: message,
    };
  }
}

export async function repairStuckStripeEvents(
  limit = STUCK_EVENT_LIMIT,
  staleMinutes = STUCK_EVENT_MINUTES
) {
  const threshold = new Date(Date.now() - staleMinutes * 60_000);
  const stuckEvents = await prisma.stripeEvent.findMany({
    where: {
      status: "processing",
      updatedAt: { lt: threshold },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: {
      eventId: true,
      eventType: true,
      payload: true,
    },
  });

  let repairedStripeEvents = 0;
  let failedStripeEvents = 0;

  for (const event of stuckEvents) {
    try {
      await repairSingleStripeEvent({
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.payload,
      });
      await markStripeEventProcessed(event.eventId);
      repairedStripeEvents += 1;
    } catch (error) {
      await markStripeEventFailed(
        event.eventId,
        error instanceof Error ? error.message : "unknown_repair_error"
      );
      failedStripeEvents += 1;
    }
  }

  return { repairedStripeEvents, failedStripeEvents };
}

export async function runSchedulingCleanupJobs(): Promise<SchedulingCleanupSummary> {
  const now = new Date();
  const reservationResult = await expireStaleReservations(now);
  const attemptResult = await expireStaleAttempts(now);
  const paidResult = await reconcilePaidUnconfirmedAttempts();
  const stripeResult = await repairStuckStripeEvents();

  const summary = {
    expiredReservations:
      reservationResult.expiredReservations + attemptResult.expiredReservations,
    expiredAttempts:
      reservationResult.expiredAttempts + attemptResult.expiredAttempts,
    reconciledPaidAttempts: paidResult.reconciledPaidAttempts,
    failedPaidAttempts: paidResult.failedPaidAttempts,
    repairedStripeEvents: stripeResult.repairedStripeEvents,
    failedStripeEvents: stripeResult.failedStripeEvents,
  };

  console.info("scheduling.cleanup.summary", summary);
  return summary;
}
