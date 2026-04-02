import crypto from "crypto";

import {
  Prisma,
  type AppointmentStatus,
  type BookingAttemptStatus,
  type MeetingMode,
  type SlotReservationStatus,
} from "@prisma/client";
import { DateTime } from "luxon";

import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/scheduling/audit";
import { getMinBookableUtc } from "@/lib/scheduling/lead-time";
import { getMeetingLink } from "@/lib/scheduling/meeting-link";
import { sendBookingEmails } from "@/lib/scheduling/notify";
import { pickStaffForSlot } from "@/lib/scheduling/auto-assignment";
import { getPaymentReservationTimeoutMinutes } from "@/lib/scheduling/payment-reservation";
import { getStripeForOrg } from "@/lib/stripe";
import { isValidTimezone } from "@/lib/validation";

const BUSY_STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed"];
const DEFAULT_BUFFER_MIN = 0;
const MAX_BUFFER_MIN = 0;
const EXPIRABLE_ATTEMPT_STATUSES: BookingAttemptStatus[] = [
  "payment_pending",
  "payment_processing",
];
const RESUMABLE_ATTEMPT_STATUSES: BookingAttemptStatus[] = [
  "payment_pending",
  "payment_processing",
];
const START_NEW_ATTEMPT_STATUSES: BookingAttemptStatus[] = [
  "payment_failed",
  "expired",
  "cancelled",
];
const TERMINAL_ATTEMPT_STATUSES = new Set<BookingAttemptStatus>([
  "booking_confirmed",
  "booking_failed",
  "payment_failed",
  "expired",
  "cancelled",
]);

type WorkingHours = {
  bufferMin?: number;
};

type Tx = Prisma.TransactionClient;

export type PaidBookingAttemptInput = {
  orgId?: string | null;
  userId: string;
  meetingTypeId: string;
  mode: MeetingMode;
  startLocal: string;
  tz?: string | null;
  staffUserId?: string | null;
  notes?: string | null;
};

export type PaidBookingAttemptResult = {
  attemptId: string;
  orgId: string;
  paymentId: string;
  status:
    | "payment_pending"
    | "payment_processing"
    | "paid"
    | "booking_confirmed"
    | "booking_failed"
    | "payment_failed"
    | "expired"
    | "cancelled";
  priceCents: number;
  currency: string;
  mode: MeetingMode;
  startLocal: string;
  requestedTimezone: string;
  staffUserId: string | null;
  stripeCheckoutSessionId: string | null;
  reservedUntil: string | null;
};

export type FinalizePaidBookingAttemptResult =
  | {
      handled: true;
      success: true;
      appointmentId: string;
      reused: boolean;
      emailError: string | null;
    }
  | {
      handled: true;
      success: false;
      attemptStatus: "booking_failed" | "payment_failed" | "expired" | "cancelled";
      error: string;
    };

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clampBuffer(n: number) {
  return Math.min(MAX_BUFFER_MIN, Math.max(0, n));
}

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

function buildCheckoutKey(args: {
  orgId: string;
  userId: string;
  meetingTypeId: string;
  mode: MeetingMode;
  startUtcIso: string;
  staffUserId?: string | null;
}) {
  return crypto
    .createHash("sha256")
    .update(
      [
        args.orgId,
        args.userId,
        args.meetingTypeId,
        args.mode,
        args.startUtcIso,
        args.staffUserId ?? "",
      ].join("|"),
      "utf8"
    )
    .digest("hex");
}

function getReservationDeadline(now = DateTime.utc()) {
  return now.plus({ minutes: getPaymentReservationTimeoutMinutes() });
}

function isAttemptTerminal(status: BookingAttemptStatus) {
  return TERMINAL_ATTEMPT_STATUSES.has(status);
}

function isReservationActive(args: {
  status: SlotReservationStatus | null | undefined;
  reservedUntil: Date | null | undefined;
  now?: DateTime;
}) {
  if (args.status !== "active") return false;
  if (!args.reservedUntil) return false;
  const now = args.now ?? DateTime.utc();
  return DateTime.fromJSDate(args.reservedUntil).toUTC() > now;
}

async function getOrgSettings(tx: Tx, orgId: string) {
  return tx.orgSettings.findFirst({
    where: { orgId },
    select: {
      approvalPolicy: true,
      paymentPolicy: true,
      defaultTz: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
      maxDailyBookings: true,
    },
  });
}

async function getAttemptForCheckout(tx: Tx, checkoutKey: string) {
  const attempt = await tx.bookingAttempt.findFirst({
    where: { checkoutKey },
    orderBy: { createdAt: "desc" },
    include: {
      appointment: {
        select: { id: true },
      },
      reservation: true,
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attempt) return null;
  const payment = attempt.payments[0] ?? null;
  return { attempt, payment };
}

async function expireAttemptsByIds(
  tx: Tx,
  attemptIds: string[],
  reason = "Reservation expired before payment was completed."
) {
  if (attemptIds.length === 0) return;

  await tx.slotReservation.updateMany({
    where: {
      bookingAttemptId: { in: attemptIds },
      status: "active",
    },
    data: {
      status: "expired",
    },
  });

  await tx.bookingAttempt.updateMany({
    where: {
      id: { in: attemptIds },
      status: { in: EXPIRABLE_ATTEMPT_STATUSES },
    },
    data: {
      status: "expired",
      reservedUntil: new Date(),
      failureReason: reason,
    },
  });
}

async function expireCheckoutAttemptsIfNeeded(tx: Tx, checkoutKey: string, now: DateTime) {
  const stale = await tx.bookingAttempt.findMany({
    where: {
      checkoutKey,
      status: { in: EXPIRABLE_ATTEMPT_STATUSES },
      reservedUntil: { lte: now.toJSDate() },
    },
    select: { id: true },
  });

  await expireAttemptsByIds(
    tx,
    stale.map((row) => row.id)
  );
}

async function expireAttemptIfNeeded(tx: Tx, attemptId: string, now = DateTime.utc()) {
  const attempt = await tx.bookingAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      status: true,
      reservedUntil: true,
    },
  });

  if (!attempt) return false;
  if (!EXPIRABLE_ATTEMPT_STATUSES.includes(attempt.status)) return false;
  if (!attempt.reservedUntil) return false;
  if (DateTime.fromJSDate(attempt.reservedUntil).toUTC() > now) return false;

  await expireAttemptsByIds(tx, [attemptId]);
  return true;
}

export async function refreshPaidBookingAttemptState(attemptId: string) {
  const expired = await prisma.$transaction(async (tx) =>
    expireAttemptIfNeeded(tx, attemptId)
  );

  const attempt = await prisma.bookingAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      orgId: true,
      status: true,
      paymentStatus: true,
      appointment: {
        select: { id: true },
      },
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          amountCents: true,
          currency: true,
          stripeCheckoutSessionId: true,
          stripePaymentIntentId: true,
          lastStripeEventId: true,
        },
      },
    },
  });

  if (!attempt || attempt.appointment?.id || isAttemptTerminal(attempt.status)) {
    return expired;
  }

  const payment = attempt.payments[0] ?? null;
  if (!payment) return expired;

  if (attempt.paymentStatus === "paid" || attempt.status === "paid") {
    const result = await markBookingAttemptPaid({
      attemptId: attempt.id,
      stripeEventId:
        payment.lastStripeEventId || `stripe_refresh:paid_attempt:${attempt.id}`,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      amountCents: payment.amountCents,
      currency: payment.currency,
    });
    return expired || result.handled;
  }

  const stripe = await getStripeForOrg(attempt.orgId);
  if (!stripe) return expired;

  let paymentIntentId = payment.stripePaymentIntentId;

  if (payment.stripeCheckoutSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId
      );
      const sessionPaymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      paymentIntentId = paymentIntentId ?? sessionPaymentIntentId;

      if (session.payment_status === "paid") {
        const result = await markBookingAttemptPaid({
          attemptId: attempt.id,
          stripeEventId: `stripe_refresh:checkout_session:${session.id}`,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: sessionPaymentIntentId,
          amountCents: session.amount_total ?? payment.amountCents,
          currency: session.currency ?? payment.currency,
        });
        return expired || result.handled;
      }

      if (session.status === "complete" && attempt.status === "payment_pending") {
        const updated = await prisma.bookingAttempt.updateMany({
          where: {
            id: attempt.id,
            status: "payment_pending",
          },
          data: {
            status: "payment_processing",
            failureReason: null,
          },
        });
        if (updated.count > 0) {
          return true;
        }
      }
    } catch (error) {
      console.error("refreshPaidBookingAttemptState checkout session lookup failed", {
        attemptId,
        sessionId: payment.stripeCheckoutSessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!paymentIntentId) return expired;

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status === "succeeded") {
      const result = await markBookingAttemptPaid({
        attemptId: attempt.id,
        stripeEventId: `stripe_refresh:payment_intent:${intent.id}`,
        stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
        stripePaymentIntentId: intent.id,
        amountCents: intent.amount_received ?? intent.amount ?? payment.amountCents,
        currency: intent.currency ?? payment.currency,
      });
      return expired || result.handled;
    }

    if (
      intent.status === "requires_payment_method" ||
      intent.status === "canceled"
    ) {
      const result = await markBookingAttemptPaymentFailed({
        attemptId: attempt.id,
        stripeEventId: `stripe_refresh:payment_intent:${intent.id}`,
        stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
        stripePaymentIntentId: intent.id,
      });
      return expired || result.handled;
    }

    if (
      (intent.status === "processing" || intent.status === "requires_capture") &&
      attempt.status === "payment_pending"
    ) {
      const updated = await prisma.bookingAttempt.updateMany({
        where: {
          id: attempt.id,
          status: "payment_pending",
        },
        data: {
          status: "payment_processing",
          failureReason: null,
        },
      });
      if (updated.count > 0) {
        return true;
      }
    }
  } catch (error) {
    console.error("refreshPaidBookingAttemptState payment intent lookup failed", {
      attemptId,
      paymentIntentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return expired;
}

async function ensureSlotCanBeReserved(tx: Tx, args: {
  orgId: string;
  bookingAttemptId?: string;
  staffUserId?: string | null;
  startAtUtc: Date;
  endAtUtc: Date;
}) {
  const reservationFilters = args.staffUserId
    ? {
        OR: [{ staffUserId: args.staffUserId }, { staffUserId: null }],
      }
    : {};
  const appointmentFilters = args.staffUserId
    ? {
        OR: [{ staffUserId: args.staffUserId }, { staffUserId: null }],
      }
    : {};
  const blockedFilters = args.staffUserId
    ? {
        OR: [{ staffUserId: args.staffUserId }, { staffUserId: null }],
      }
    : {};

  const [overlapAppointment, overlapBlocked, overlapReservation] = await Promise.all([
    tx.appointment.findFirst({
      where: {
        orgId: args.orgId,
        status: { in: BUSY_STATUSES },
        startAtUtc: { lt: args.endAtUtc },
        endAtUtc: { gt: args.startAtUtc },
        ...appointmentFilters,
      },
      select: { id: true },
    }),
    tx.blockedTime.findFirst({
      where: {
        orgId: args.orgId,
        startAtUtc: { lt: args.endAtUtc },
        endAtUtc: { gt: args.startAtUtc },
        ...blockedFilters,
      },
      select: { id: true },
    }),
    tx.slotReservation.findFirst({
      where: {
        orgId: args.orgId,
        status: "active",
        reservedUntil: { gt: new Date() },
        startAtUtc: { lt: args.endAtUtc },
        endAtUtc: { gt: args.startAtUtc },
        ...(args.bookingAttemptId
          ? { bookingAttemptId: { not: args.bookingAttemptId } }
          : {}),
        ...reservationFilters,
      },
      select: { id: true },
    }),
  ]);

  if (overlapAppointment || overlapBlocked || overlapReservation) {
    throw new Error("This slot is no longer available.");
  }
}

async function resolveAttemptStaff(tx: Tx, args: {
  orgId: string;
  requestedTimezone: string;
  startAtUtc: Date;
  endAtUtc: Date;
  staffUserId?: string | null;
}) {
  if (args.staffUserId) {
    const staff = await tx.staffCalendar.findFirst({
      where: {
        orgId: args.orgId,
        staffUserId: args.staffUserId,
        isActive: true,
      },
      select: { staffUserId: true },
    });

    if (!staff) {
      throw new Error("Selected staff member is not available.");
    }

    return args.staffUserId;
  }

  const auto = await pickStaffForSlot({
    orgId: args.orgId,
    startUtc: args.startAtUtc,
    endUtc: args.endAtUtc,
    bookingTz: args.requestedTimezone,
  });

  if (auto.noStaffCalendars) {
    throw new Error("No active staff calendars configured yet.");
  }

  if (auto.noStaffAvailable) {
    throw new Error("No available staff for this time slot.");
  }

  return auto.staffUserId ?? null;
}

export async function getOrCreatePaidBookingAttempt(
  params: PaidBookingAttemptInput
): Promise<PaidBookingAttemptResult> {
  const mt = await prisma.meetingType.findFirst({
    where: {
      id: params.meetingTypeId,
      ...(params.orgId ? { orgId: params.orgId } : {}),
      isActive: true,
    },
    include: { modes: { select: { mode: true } } },
  });

  if (!mt) {
    throw new Error("Meeting type not found");
  }

  const orgId = params.orgId || mt.orgId;
  const allowedModes = mt.modes.map((m) => m.mode);
  if (!allowedModes.includes(params.mode)) {
    throw new Error("Selected mode is not available for this meeting type.");
  }

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: {
      paymentPolicy: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
      maxDailyBookings: true,
    },
  });

  const effectivePaymentPolicy =
    mt.paymentPolicy === "FREE"
      ? "FREE"
      : mt.paymentPolicy
        ? "PAID"
        : settings?.paymentPolicy === "FREE"
          ? "FREE"
          : "PAID";

  if (effectivePaymentPolicy === "FREE") {
    throw new Error("This meeting type does not require payment.");
  }

  const fallbackPaymentCents = Number(process.env.DEFAULT_PAYMENT_CENTS ?? "15000");
  const fallbackCurrency = (process.env.DEFAULT_PAYMENT_CURRENCY ?? "EUR").trim();
  const priceCents =
    mt.priceCents ??
    (typeof settings?.defaultPaymentCents === "number"
      ? settings.defaultPaymentCents
      : Number.isFinite(fallbackPaymentCents)
        ? fallbackPaymentCents
        : null);
  const currency = mt.currency ?? settings?.defaultCurrency ?? (fallbackCurrency || null);

  if (!priceCents || !currency) {
    throw new Error("Payment is required but price or currency is missing.");
  }

  const resolvedTz =
    params.tz && isValidTimezone(params.tz) ? params.tz : "UTC";
  const startLocalDt = DateTime.fromISO(params.startLocal, { zone: resolvedTz });
  if (!startLocalDt.isValid) {
    throw new Error("Invalid startLocal. Use ISO like 2026-01-08T10:00:00");
  }

  const durationMin = Math.max(15, Math.min(240, mt.durationMin || 60));
  const startUtc = startLocalDt.toUTC();
  const endUtc = startUtc.plus({ minutes: durationMin });
  if (startUtc < getMinBookableUtc()) {
    throw new Error("Please choose a later time.");
  }

  const profile = await prisma.bookingProfile.findFirst({
    where: { userId: params.userId },
    select: { timezone: true },
  });
  const limitTz = isValidTimezone(profile?.timezone || "")
    ? (profile?.timezone as string)
    : resolvedTz;
  const maxDailyBookings =
    typeof settings?.maxDailyBookings === "number" && settings.maxDailyBookings > 0
      ? settings.maxDailyBookings
      : 5;
  const dayStartUtc = DateTime.now().setZone(limitTz).startOf("day").toUTC();
  const dayEndUtc = DateTime.now().setZone(limitTz).endOf("day").toUTC();
  const userDaily = await prisma.appointment.findMany({
    where: {
      orgId,
      userId: params.userId,
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
    throw new Error("Daily booking limit reached. Please choose another day.");
  }

  const checkoutKey = buildCheckoutKey({
    orgId,
    userId: params.userId,
    meetingTypeId: params.meetingTypeId,
    mode: params.mode,
    startUtcIso: startUtc.toISO() ?? startUtc.toJSDate().toISOString(),
    staffUserId: params.staffUserId ?? null,
  });

  const nextNotes = cleanString(params.notes) || null;

  const createAttempt = async () => {
    return prisma.$transaction(async (tx) => {
      const now = DateTime.utc();
      await expireCheckoutAttemptsIfNeeded(tx, checkoutKey, now);

      let existing = await getAttemptForCheckout(tx, checkoutKey);
      if (existing && START_NEW_ATTEMPT_STATUSES.includes(existing.attempt.status)) {
        await tx.slotReservation.updateMany({
          where: {
            bookingAttemptId: existing.attempt.id,
            status: "active",
          },
          data: {
            status:
              existing.attempt.status === "expired" ? "expired" : "released",
          },
        });
        existing = null;
      }

      if (existing) {
        if (
          existing.attempt.status !== "booking_confirmed" &&
          (existing.attempt.notes !== nextNotes ||
            existing.attempt.requestedTimezone !== resolvedTz)
        ) {
          await tx.bookingAttempt.update({
            where: { id: existing.attempt.id },
            data: {
              notes: nextNotes,
              requestedTimezone: resolvedTz,
            },
          });
        }

        const reservationIsActive = isReservationActive({
          status: existing.attempt.reservation?.status,
          reservedUntil: existing.attempt.reservation?.reservedUntil,
          now,
        });

        if (RESUMABLE_ATTEMPT_STATUSES.includes(existing.attempt.status)) {
          if (!reservationIsActive) {
            const resolvedStaffUserId = await resolveAttemptStaff(tx, {
              orgId,
              requestedTimezone: resolvedTz,
              startAtUtc: startUtc.toJSDate(),
              endAtUtc: endUtc.toJSDate(),
              staffUserId: params.staffUserId ?? existing.attempt.staffUserId ?? null,
            });

            await ensureSlotCanBeReserved(tx, {
              orgId,
              bookingAttemptId: existing.attempt.id,
              staffUserId: resolvedStaffUserId,
              startAtUtc: startUtc.toJSDate(),
              endAtUtc: endUtc.toJSDate(),
            });

            const nextReservedUntil = getReservationDeadline(now).toJSDate();

            await tx.bookingAttempt.update({
              where: { id: existing.attempt.id },
              data: {
                status: "payment_pending",
                paymentStatus: "unpaid",
                staffUserId: resolvedStaffUserId,
                reservedUntil: nextReservedUntil,
                failureReason: null,
              },
            });

            await tx.slotReservation.upsert({
              where: { bookingAttemptId: existing.attempt.id },
              update: {
                orgId,
                meetingTypeId: params.meetingTypeId,
                staffUserId: resolvedStaffUserId,
                startAtUtc: startUtc.toJSDate(),
                endAtUtc: endUtc.toJSDate(),
                reservedUntil: nextReservedUntil,
                status: "active",
              },
              create: {
                id: crypto.randomUUID(),
                orgId,
                bookingAttemptId: existing.attempt.id,
                meetingTypeId: params.meetingTypeId,
                staffUserId: resolvedStaffUserId,
                startAtUtc: startUtc.toJSDate(),
                endAtUtc: endUtc.toJSDate(),
                reservedUntil: nextReservedUntil,
                status: "active",
              },
            });
          }
        }

        const refreshed = await getAttemptForCheckout(tx, checkoutKey);
        if (!refreshed?.payment) {
          throw new Error("Existing booking attempt is missing a payment record.");
        }

        return {
          attempt: refreshed.attempt,
          payment: refreshed.payment,
        };
      }

      const resolvedStaffUserId = await resolveAttemptStaff(tx, {
        orgId,
        requestedTimezone: resolvedTz,
        startAtUtc: startUtc.toJSDate(),
        endAtUtc: endUtc.toJSDate(),
        staffUserId: params.staffUserId ?? null,
      });
      await ensureSlotCanBeReserved(tx, {
        orgId,
        staffUserId: resolvedStaffUserId,
        startAtUtc: startUtc.toJSDate(),
        endAtUtc: endUtc.toJSDate(),
      });

      const reservedUntil = getReservationDeadline(now).toJSDate();
      const attempt = await tx.bookingAttempt.create({
        data: {
          id: crypto.randomUUID(),
          orgId,
          userId: params.userId,
          staffUserId: resolvedStaffUserId,
          meetingTypeId: params.meetingTypeId,
          checkoutKey,
          mode: params.mode,
          status: "payment_pending",
          paymentStatus: "unpaid",
          paymentRequired: true,
          priceCents,
          currency,
          startLocal: params.startLocal,
          requestedTimezone: resolvedTz,
          startAtUtc: startUtc.toJSDate(),
          endAtUtc: endUtc.toJSDate(),
          reservedUntil,
          notes: nextNotes,
        },
      });

      await tx.slotReservation.create({
        data: {
          id: crypto.randomUUID(),
          orgId,
          bookingAttemptId: attempt.id,
          meetingTypeId: params.meetingTypeId,
          staffUserId: resolvedStaffUserId,
          startAtUtc: startUtc.toJSDate(),
          endAtUtc: endUtc.toJSDate(),
          reservedUntil,
          status: "active",
        },
      });

      const payment = await tx.paymentRecord.create({
        data: {
          id: crypto.randomUUID(),
          orgId,
          bookingAttemptId: attempt.id,
          provider: "stripe",
          status: "pending",
          amountCents: priceCents,
          currency,
          metadata: {
            mode: params.mode,
            startLocal: params.startLocal,
            requestedTimezone: resolvedTz,
            staffUserId: resolvedStaffUserId,
          },
        },
      });

      return { attempt, payment };
    });
  };

  try {
    const { attempt, payment } = await createAttempt();
    return {
      attemptId: attempt.id,
      orgId,
      paymentId: payment.id,
      status: attempt.status,
      priceCents: attempt.priceCents,
      currency: attempt.currency,
      mode: attempt.mode,
      startLocal: attempt.startLocal,
      requestedTimezone: attempt.requestedTimezone,
      staffUserId: attempt.staffUserId,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId ?? null,
      reservedUntil: attempt.reservedUntil ? attempt.reservedUntil.toISOString() : null,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2004")
    ) {
      const existing = await prisma.bookingAttempt.findFirst({
        where: { checkoutKey },
        orderBy: { createdAt: "desc" },
        include: {
          payments: {
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
      });

      const payment = existing?.payments[0] ?? null;
      if (!existing || !payment) {
        throw new Error("This slot is no longer available.");
      }

      return {
        attemptId: existing.id,
        orgId: existing.orgId,
        paymentId: payment.id,
        status: existing.status,
        priceCents: existing.priceCents,
        currency: existing.currency,
        mode: existing.mode,
        startLocal: existing.startLocal,
        requestedTimezone: existing.requestedTimezone,
        staffUserId: existing.staffUserId,
        stripeCheckoutSessionId: payment.stripeCheckoutSessionId ?? null,
        reservedUntil: existing.reservedUntil ? existing.reservedUntil.toISOString() : null,
      };
    }

    throw error;
  }
}

async function markAttemptFailure(tx: Tx, args: {
  attemptId: string;
  error: string;
  nextStatus: "booking_failed" | "payment_failed" | "expired" | "cancelled";
  paymentStatus?: "unpaid" | "paid";
  reservationStatus?: SlotReservationStatus;
}) {
  await tx.bookingAttempt.update({
    where: { id: args.attemptId },
    data: {
      status: args.nextStatus,
      paymentStatus:
        args.paymentStatus ??
        (args.nextStatus === "payment_failed" || args.nextStatus === "expired"
          ? "unpaid"
          : undefined),
      failureReason: args.error,
      ...(args.nextStatus === "expired" || args.nextStatus === "cancelled"
        ? { reservedUntil: new Date() }
        : {}),
    },
  });

  if (args.reservationStatus) {
    await tx.slotReservation.updateMany({
      where: {
        bookingAttemptId: args.attemptId,
        status: "active",
      },
      data: {
        status: args.reservationStatus,
      },
    });
  }

  return {
    handled: true as const,
    success: false as const,
    attemptStatus: args.nextStatus,
    error: args.error,
  };
}

async function updatePaymentFromStripe(tx: Tx, args: {
  attemptId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeEventId: string;
  status: "paid" | "failed";
  amountCents?: number | null;
  currency?: string | null;
}) {
  const existing = await tx.paymentRecord.findFirst({
    where: { bookingAttemptId: args.attemptId, provider: "stripe" },
    orderBy: { createdAt: "asc" },
  });

  if (!existing) {
    throw new Error("Payment record not found for booking attempt.");
  }

  return tx.paymentRecord.update({
    where: { id: existing.id },
    data: {
      status: args.status,
      stripeCheckoutSessionId:
        args.stripeCheckoutSessionId ?? existing.stripeCheckoutSessionId,
      stripePaymentIntentId:
        args.stripePaymentIntentId ?? existing.stripePaymentIntentId,
      lastStripeEventId: args.stripeEventId,
      amountCents:
        typeof args.amountCents === "number" ? args.amountCents : existing.amountCents,
      currency: args.currency ? args.currency.toUpperCase() : existing.currency,
      webhookConfirmedAt:
        args.status === "paid" ? new Date() : existing.webhookConfirmedAt,
      paidAt: args.status === "paid" ? new Date() : existing.paidAt,
      failedAt: args.status === "failed" ? new Date() : existing.failedAt,
    },
  });
}

async function createAppointmentForAttempt(tx: Tx, attemptId: string) {
  await tx.$queryRawUnsafe(
    'SELECT "id" FROM "booking_attempt" WHERE "id" = $1 FOR UPDATE',
    attemptId
  );

  await expireAttemptIfNeeded(tx, attemptId);

  const attempt = await tx.bookingAttempt.findUnique({
    where: { id: attemptId },
    include: {
      appointment: true,
      reservation: true,
    },
  });

  if (!attempt) {
    throw new Error("Booking attempt not found.");
  }

  if (attempt.appointment) {
    return {
      handled: true as const,
      success: true as const,
      appointmentId: attempt.appointment.id,
      reused: true,
      emailError: null,
    };
  }

  if (attempt.status === "payment_failed") {
    return {
      handled: true as const,
      success: false as const,
      attemptStatus: "payment_failed" as const,
      error: "Payment failed for this booking attempt.",
    };
  }

  if (attempt.status === "expired" || attempt.status === "cancelled") {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Reservation expired before booking could be finalized.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: attempt.status === "expired" ? "expired" : "released",
    });
  }

  if (attempt.status === "booking_failed") {
    return {
      handled: true as const,
      success: false as const,
      attemptStatus: "booking_failed" as const,
      error: attempt.failureReason || "Booking finalization previously failed.",
    };
  }

  if (attempt.paymentStatus !== "paid") {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Payment is not marked as paid for this booking attempt.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  const reservation = attempt.reservation;
  const now = DateTime.utc();
  if (
    !reservation ||
    !isReservationActive({
      status: reservation.status,
      reservedUntil: reservation.reservedUntil,
      now,
    })
  ) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Payment succeeded after the reservation was no longer active.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus:
        reservation?.status === "expired" ||
        (reservation?.reservedUntil &&
          DateTime.fromJSDate(reservation.reservedUntil).toUTC() <= now)
          ? "expired"
          : "released",
    });
  }

  const [settings, profile, mt] = await Promise.all([
    getOrgSettings(tx, attempt.orgId),
    tx.bookingProfile.findFirst({ where: { userId: attempt.userId } }),
    tx.meetingType.findFirst({
      where: { id: attempt.meetingTypeId, orgId: attempt.orgId },
      include: {
        modes: { select: { mode: true, details: true } },
      },
    }),
  ]);

  if (!profile) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Missing booking profile.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  if (!mt) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Meeting type not found for booking attempt.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  const resolvedTz =
    isValidTimezone(attempt.requestedTimezone) ? attempt.requestedTimezone : "UTC";
  const limitTz = isValidTimezone(profile.timezone || "")
    ? (profile.timezone as string)
    : resolvedTz;
  const startUtc = DateTime.fromJSDate(attempt.startAtUtc).toUTC();
  const endUtc = DateTime.fromJSDate(attempt.endAtUtc).toUTC();
  if (!startUtc.isValid || !endUtc.isValid || endUtc <= startUtc) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Booking attempt has an invalid stored time window.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  if (
    reservation.startAtUtc.getTime() !== attempt.startAtUtc.getTime() ||
    reservation.endAtUtc.getTime() !== attempt.endAtUtc.getTime() ||
    reservation.staffUserId !== attempt.staffUserId
  ) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Stored reservation does not match the booking attempt.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  const maxDailyBookings =
    typeof settings?.maxDailyBookings === "number" && settings.maxDailyBookings > 0
      ? settings.maxDailyBookings
      : 5;
  const dayStartUtc = DateTime.now().setZone(limitTz).startOf("day").toUTC();
  const dayEndUtc = DateTime.now().setZone(limitTz).endOf("day").toUTC();
  const userDaily = await tx.appointment.findMany({
    where: {
      orgId: attempt.orgId,
      userId: attempt.userId,
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
    return markAttemptFailure(tx, {
      attemptId,
      error: "Daily booking limit reached. Please choose another day.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  const userOverlap = await tx.appointment.findFirst({
    where: {
      orgId: attempt.orgId,
      userId: attempt.userId,
      status: { in: BUSY_STATUSES },
      startAtUtc: { lt: endUtc.toJSDate() },
      endAtUtc: { gt: startUtc.toJSDate() },
    },
    select: { id: true },
  });

  if (userOverlap) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "You already have a booking in this time slot.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  const staffUserId = attempt.staffUserId ?? null;
  const staffWorkingHours = staffUserId
    ? await tx.staffCalendar.findFirst({
        where: { orgId: attempt.orgId, staffUserId, isActive: true },
        select: { workingHours: true },
      })
    : null;
  const orgWorkingHours = !staffUserId
    ? await tx.orgSettings.findFirst({
        where: { orgId: attempt.orgId },
        select: { workingHours: true },
      })
    : null;
  const workingHours = staffUserId
    ? staffWorkingHours?.workingHours ?? null
    : orgWorkingHours?.workingHours ?? null;

  const wh = parseWorkingHours(workingHours);
  const bufferMin = clampBuffer(wh.bufferMin ?? DEFAULT_BUFFER_MIN);
  const startWithBuffer = startUtc.minus({ minutes: bufferMin });
  const endWithBuffer = endUtc.plus({ minutes: bufferMin });

  const conflicts = await tx.appointment.findFirst({
    where: {
      orgId: attempt.orgId,
      status: { in: BUSY_STATUSES },
      startAtUtc: { lt: endWithBuffer.toJSDate() },
      endAtUtc: { gt: startWithBuffer.toJSDate() },
      ...(staffUserId ? { staffUserId } : {}),
    },
    select: { id: true },
  });

  if (conflicts) {
    return markAttemptFailure(tx, {
      attemptId,
      error: "Slot already booked.",
      nextStatus: "booking_failed",
      paymentStatus: "paid",
      reservationStatus: "released",
    });
  }

  const status: AppointmentStatus =
    settings?.approvalPolicy === "AUTO_APPROVE" ? "confirmed" : "pending";
  const payment = await tx.paymentRecord.findFirst({
    where: { bookingAttemptId: attemptId, provider: "stripe" },
    orderBy: { createdAt: "asc" },
  });

  await tx.orgMember.upsert({
    where: {
      orgId_userId: {
        orgId: attempt.orgId,
        userId: attempt.userId,
      },
    },
    update: {},
    create: {
      id: crypto.randomUUID(),
      orgId: attempt.orgId,
      userId: attempt.userId,
      role: "customer",
    },
  });

  const appointmentId = crypto.randomUUID();
  const modeDetails = mt.modes.find((m) => m.mode === attempt.mode)?.details as
    | { link?: string }
    | null
    | undefined;
  const joinLink = getMeetingLink({
    appointmentId,
    mode: attempt.mode,
    overrideLink: modeDetails?.link ?? null,
  });

  try {
    const appointment = await tx.appointment.create({
      data: {
        id: appointmentId,
        orgId: attempt.orgId,
        userId: attempt.userId,
        staffUserId: staffUserId ?? null,
        bookingAttemptId: attempt.id,
        meetingTypeId: attempt.meetingTypeId,
        status,
        mode: attempt.mode,
        joinLink,
        paymentPolicy: "PAID",
        paymentStatus: "paid",
        requiresPayment: true,
        priceCents: attempt.priceCents,
        currency: attempt.currency,
        startAtUtc: startUtc.toJSDate(),
        endAtUtc: endUtc.toJSDate(),
        notes:
          [
            attempt.notes || null,
            `booking_attempt_id=${attempt.id}`,
            payment?.stripeCheckoutSessionId
              ? `payment_session_id=${payment.stripeCheckoutSessionId}`
              : null,
            payment?.stripePaymentIntentId
              ? `payment_intent_id=${payment.stripePaymentIntentId}`
              : null,
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
          ]
            .filter(Boolean)
            .join("\n") || null,
      },
    });

    await tx.bookingAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "booking_confirmed",
        paymentStatus: "paid",
        failureReason: null,
      },
    });

    await tx.slotReservation.updateMany({
      where: {
        bookingAttemptId: attempt.id,
        status: "active",
      },
      data: {
        status: "consumed",
      },
    });

    return {
      handled: true as const,
      success: true as const,
      appointmentId: appointment.id,
      reused: false,
      emailError: null,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2004")
    ) {
      return markAttemptFailure(tx, {
        attemptId,
        error: "Slot could not be confirmed after payment.",
        nextStatus: "booking_failed",
        paymentStatus: "paid",
        reservationStatus: "released",
      });
    }

    throw error;
  }
}

export async function markBookingAttemptPaid(args: {
  attemptId: string;
  stripeEventId: string;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  amountCents: number;
  currency: string;
}): Promise<FinalizePaidBookingAttemptResult> {
  const txResult = await prisma.$transaction(async (tx) => {
    await expireAttemptIfNeeded(tx, args.attemptId);

    const attempt = await tx.bookingAttempt.findUnique({
      where: { id: args.attemptId },
      select: {
        id: true,
        status: true,
        priceCents: true,
        currency: true,
      },
    });

    if (!attempt) {
      throw new Error("Booking attempt not found.");
    }

    const normalizedCurrency = args.currency.trim().toUpperCase();

    await updatePaymentFromStripe(tx, {
      attemptId: args.attemptId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: args.stripePaymentIntentId ?? null,
      stripeEventId: args.stripeEventId,
      status: "paid",
      amountCents: args.amountCents,
      currency: normalizedCurrency,
    });

    if (
      attempt.priceCents !== args.amountCents ||
      attempt.currency.trim().toUpperCase() !== normalizedCurrency
    ) {
      return markAttemptFailure(tx, {
        attemptId: args.attemptId,
        error: "Stripe payment amount or currency did not match the booking attempt.",
        nextStatus: "booking_failed",
        paymentStatus: "paid",
        reservationStatus: "released",
      });
    }

    if (
      attempt.status === "booking_failed" ||
      attempt.status === "expired" ||
      attempt.status === "cancelled" ||
      attempt.status === "payment_failed"
    ) {
      return markAttemptFailure(tx, {
        attemptId: args.attemptId,
        error: "Payment succeeded after the booking attempt had already ended.",
        nextStatus: "booking_failed",
        paymentStatus: "paid",
        reservationStatus:
          attempt.status === "expired" ? "expired" : "released",
      });
    }

    await tx.bookingAttempt.update({
      where: { id: args.attemptId },
      data: {
        status:
          attempt.status === "booking_confirmed" ? "booking_confirmed" : "paid",
        paymentStatus: "paid",
        failureReason: null,
      },
    });

    return createAppointmentForAttempt(tx, args.attemptId);
  });

  if (!txResult.success) {
    return txResult;
  }

  if (txResult.reused) {
    return txResult;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: txResult.appointmentId },
  });
  if (!appointment) {
    throw new Error("Created appointment could not be loaded.");
  }

  await writeAudit({
    orgId: appointment.orgId,
    actorUserId: null,
    entityType: "appointment",
    entityId: appointment.id,
    action: "create_via_payment_webhook",
    before: null,
    after: appointment,
  });

  let emailError: string | null = null;
  try {
    await sendBookingEmails({ appointmentId: appointment.id });
  } catch (error: unknown) {
    emailError =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to send booking emails.";
    console.error("sendBookingEmails failed", emailError);
  }

  return { ...txResult, emailError };
}

export async function markBookingAttemptPaymentFailed(args: {
  attemptId: string;
  stripeEventId: string;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await expireAttemptIfNeeded(tx, args.attemptId);

    const attempt = await tx.bookingAttempt.findUnique({
      where: { id: args.attemptId },
      select: { id: true, status: true },
    });

    if (!attempt) {
      throw new Error("Booking attempt not found.");
    }

    if (
      attempt.status === "booking_confirmed" ||
      attempt.status === "booking_failed" ||
      attempt.status === "expired" ||
      attempt.status === "cancelled" ||
      attempt.status === "payment_failed"
    ) {
      await updatePaymentFromStripe(tx, {
        attemptId: args.attemptId,
        stripeCheckoutSessionId: args.stripeCheckoutSessionId ?? null,
        stripePaymentIntentId: args.stripePaymentIntentId ?? null,
        stripeEventId: args.stripeEventId,
        status: "failed",
      });

      return {
        handled: true as const,
        success: false as const,
        attemptStatus: attempt.status,
        error:
          attempt.status === "booking_confirmed"
            ? "Payment failed event ignored because the booking is already confirmed."
            : "Payment failed event ignored because the booking attempt is already terminal.",
      };
    }

    await updatePaymentFromStripe(tx, {
      attemptId: args.attemptId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: args.stripePaymentIntentId ?? null,
      stripeEventId: args.stripeEventId,
      status: "failed",
    });

    return markAttemptFailure(tx, {
      attemptId: args.attemptId,
      error: "Payment failed for this booking attempt.",
      nextStatus: "payment_failed",
      paymentStatus: "unpaid",
      reservationStatus: "released",
    });
  });
}
