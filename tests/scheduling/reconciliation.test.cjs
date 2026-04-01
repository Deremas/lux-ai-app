const assert = require("node:assert/strict");
const test = require("node:test");

const { loadFreshModule } = require("../helpers/module-loader.cjs");
const { createAsyncSpy } = require("../helpers/spies.cjs");

const ATTEMPT_ID = "33333333-3333-3333-3333-333333333333";

test("expireStaleAttempts expires only stale pending attempts", async () => {
  const slotReservationUpdateMany = createAsyncSpy(async () => ({ count: 1 }));
  const bookingAttemptUpdateMany = createAsyncSpy(async () => ({ count: 1 }));

  const prismaMock = {
    bookingAttempt: {
      findMany: createAsyncSpy(async () => [{ id: ATTEMPT_ID }]),
    },
    $transaction: async (callback) =>
      callback({
        bookingAttempt: {
          findUnique: createAsyncSpy(async () => ({
            id: ATTEMPT_ID,
            status: "payment_pending",
            paymentStatus: "unpaid",
          })),
          updateMany: bookingAttemptUpdateMany,
        },
        slotReservation: {
          updateMany: slotReservationUpdateMany,
        },
      }),
  };

  const reconciliation = loadFreshModule("@/lib/scheduling/reconciliation", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/lib/scheduling/paid-booking": {
      markBookingAttemptPaid: createAsyncSpy(async () => ({
        handled: true,
        success: true,
        appointmentId: "appt-1",
        reused: false,
        emailError: null,
      })),
      markBookingAttemptPaymentFailed: createAsyncSpy(async () => ({
        handled: true,
        success: false,
        attemptStatus: "payment_failed",
        error: "failed",
      })),
    },
  });

  const result = await reconciliation.expireStaleAttempts(
    new Date("2031-01-15T10:11:00.000Z")
  );

  assert.deepEqual(result, {
    expiredReservations: 1,
    expiredAttempts: 1,
  });
  assert.equal(slotReservationUpdateMany.calls.length, 1);
  assert.equal(slotReservationUpdateMany.calls[0][0].data.status, "expired");
  assert.equal(bookingAttemptUpdateMany.calls.length, 1);
  assert.equal(bookingAttemptUpdateMany.calls[0][0].data.status, "expired");
});

test("reconcilePaidUnconfirmedAttempts retries shared finalize logic exactly once", async () => {
  const markBookingAttemptPaid = createAsyncSpy(async () => ({
    handled: true,
    success: true,
    appointmentId: "appt-1",
    reused: false,
    emailError: null,
  }));

  const prismaMock = {
    bookingAttempt: {
      findMany: createAsyncSpy(async () => [
        {
          id: ATTEMPT_ID,
          paymentStatus: "paid",
          status: "paid",
          payments: [
            {
              stripePaymentIntentId: "pi_test_123",
              stripeCheckoutSessionId: "cs_test_123",
              amountCents: 15000,
              currency: "USD",
              lastStripeEventId: "evt_original",
            },
          ],
        },
      ]),
      updateMany: createAsyncSpy(async () => ({ count: 1 })),
    },
  };

  const reconciliation = loadFreshModule("@/lib/scheduling/reconciliation", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/lib/scheduling/paid-booking": {
      markBookingAttemptPaid,
      markBookingAttemptPaymentFailed: createAsyncSpy(async () => ({
        handled: true,
        success: false,
        attemptStatus: "payment_failed",
        error: "failed",
      })),
    },
  });

  const result = await reconciliation.reconcilePaidUnconfirmedAttempts();

  assert.deepEqual(result, {
    reconciledPaidAttempts: 1,
    failedPaidAttempts: 0,
  });
  assert.equal(markBookingAttemptPaid.calls.length, 1);
  assert.equal(markBookingAttemptPaid.calls[0][0].attemptId, ATTEMPT_ID);
  assert.equal(markBookingAttemptPaid.calls[0][0].stripeEventId, "evt_original");
});

test("repairStuckStripeEvents marks events failed when replay cannot recover safely", async () => {
  const stripeEventUpdateMany = createAsyncSpy(async () => ({ count: 1 }));

  const prismaMock = {
    stripeEvent: {
      findMany: createAsyncSpy(async () => [
        {
          eventId: "evt_stuck_1",
          eventType: "payment_intent.succeeded",
          payload: {
            data: {
              object: {
                metadata: {},
                amount_received: 15000,
                currency: "usd",
                id: "pi_test_999",
              },
            },
          },
        },
      ]),
      updateMany: stripeEventUpdateMany,
    },
    paymentRecord: {
      updateMany: createAsyncSpy(async () => ({ count: 1 })),
    },
    bookingAttempt: {
      updateMany: createAsyncSpy(async () => ({ count: 1 })),
      findUnique: createAsyncSpy(async () => null),
      findMany: createAsyncSpy(async () => []),
    },
    $transaction: async (callback) =>
      callback({
        bookingAttempt: {
          findUnique: createAsyncSpy(async () => null),
          updateMany: createAsyncSpy(async () => ({ count: 0 })),
        },
        slotReservation: {
          updateMany: createAsyncSpy(async () => ({ count: 0 })),
        },
      }),
  };

  const reconciliation = loadFreshModule("@/lib/scheduling/reconciliation", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/lib/scheduling/paid-booking": {
      markBookingAttemptPaid: createAsyncSpy(async () => {
        throw new Error("should_not_run");
      }),
      markBookingAttemptPaymentFailed: createAsyncSpy(async () => ({
        handled: true,
        success: false,
        attemptStatus: "payment_failed",
        error: "failed",
      })),
    },
  });

  const result = await reconciliation.repairStuckStripeEvents();

  assert.deepEqual(result, {
    repairedStripeEvents: 0,
    failedStripeEvents: 1,
  });
  assert.equal(stripeEventUpdateMany.calls.length, 1);
  assert.equal(stripeEventUpdateMany.calls[0][0].data.status, "failed");
  assert.equal(
    stripeEventUpdateMany.calls[0][0].data.lastError,
    "missing_booking_attempt_id"
  );
});
