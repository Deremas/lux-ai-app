const assert = require("node:assert/strict");
const test = require("node:test");

const { loadFreshModule } = require("../helpers/module-loader.cjs");
const { createAsyncSpy } = require("../helpers/spies.cjs");

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";
const ATTEMPT_ID = "33333333-3333-3333-3333-333333333333";
const PAYMENT_ID = "44444444-4444-4444-4444-444444444444";
const APPOINTMENT_ID = "55555555-5555-5555-5555-555555555555";
const MEETING_TYPE_ID = "66666666-6666-6666-6666-666666666666";

function buildSuccessfulPaidBookingMocks() {
  const startAtUtc = new Date("2031-01-15T10:00:00.000Z");
  const endAtUtc = new Date("2031-01-15T11:00:00.000Z");
  const reservationDeadline = new Date("2031-01-15T10:10:00.000Z");

  let bookingAttemptFindUniqueCount = 0;
  const bookingAttemptUpdate = createAsyncSpy(async (args) => args);
  const slotReservationUpdateMany = createAsyncSpy(async () => ({ count: 1 }));
  const paymentRecordFindFirst = createAsyncSpy(async () => ({
    id: PAYMENT_ID,
    provider: "stripe",
    bookingAttemptId: ATTEMPT_ID,
    stripeCheckoutSessionId: "cs_test_123",
    stripePaymentIntentId: "pi_test_123",
    amountCents: 15000,
    currency: "USD",
    webhookConfirmedAt: null,
    paidAt: null,
    failedAt: null,
    lastStripeEventId: null,
  }));
  const paymentRecordUpdate = createAsyncSpy(async (args) => ({
    id: PAYMENT_ID,
    ...args.data,
  }));
  const appointmentCreate = createAsyncSpy(async () => ({
    id: APPOINTMENT_ID,
    orgId: ORG_ID,
    userId: USER_ID,
    status: "confirmed",
    joinLink: "https://meet.example/room",
    startAtUtc,
    endAtUtc,
  }));
  const appointmentFindUnique = createAsyncSpy(async () => ({
    id: APPOINTMENT_ID,
    orgId: ORG_ID,
    userId: USER_ID,
    status: "confirmed",
    joinLink: "https://meet.example/room",
    startAtUtc,
    endAtUtc,
  }));
  const appointmentFindFirst = createAsyncSpy(async () => null);
  const appointmentFindMany = createAsyncSpy(async () => []);
  const orgSettingsFindFirst = createAsyncSpy(async () => ({
    approvalPolicy: "AUTO_APPROVE",
    paymentPolicy: "PAID",
    defaultTz: "UTC",
    defaultPaymentCents: 15000,
    defaultCurrency: "USD",
    maxDailyBookings: 5,
    workingHours: null,
  }));
  const bookingProfileFindFirst = createAsyncSpy(async () => ({
    userId: USER_ID,
    fullName: "Ada Lovelace",
    phone: "+14155550100",
    company: "Lux",
    companyRole: "Founder",
    timezone: "UTC",
    notes: "Please send the agenda.",
  }));
  const meetingTypeFindFirst = createAsyncSpy(async () => ({
    id: MEETING_TYPE_ID,
    orgId: ORG_ID,
    key: "strategy-call",
    modes: [
      {
        mode: "google_meet",
        details: { link: "https://meet.example/room" },
      },
    ],
  }));
  const orgMemberUpsert = createAsyncSpy(async () => ({}));
  const queryRaw = createAsyncSpy(async () => []);

  const prismaMock = {
    $transaction: async (callback) =>
      callback({
        $queryRawUnsafe: queryRaw,
        bookingAttempt: {
          findUnique: async () => {
            bookingAttemptFindUniqueCount += 1;

            if (bookingAttemptFindUniqueCount === 1) {
              return {
                id: ATTEMPT_ID,
                status: "payment_pending",
                reservedUntil: reservationDeadline,
              };
            }

            if (bookingAttemptFindUniqueCount === 2) {
              return {
                id: ATTEMPT_ID,
                status: "payment_pending",
                priceCents: 15000,
                currency: "USD",
              };
            }

            if (bookingAttemptFindUniqueCount === 3) {
              return {
                id: ATTEMPT_ID,
                status: "paid",
                reservedUntil: reservationDeadline,
              };
            }

            return {
              id: ATTEMPT_ID,
              orgId: ORG_ID,
              userId: USER_ID,
              meetingTypeId: MEETING_TYPE_ID,
              mode: "google_meet",
              notes: "Please send the agenda.",
              requestedTimezone: "UTC",
              startAtUtc,
              endAtUtc,
              priceCents: 15000,
              currency: "USD",
              paymentStatus: "paid",
              status: "paid",
              staffUserId: null,
              appointment: null,
              reservation: {
                id: "reservation-1",
                status: "active",
                reservedUntil: reservationDeadline,
                startAtUtc,
                endAtUtc,
                staffUserId: null,
              },
            };
          },
          update: bookingAttemptUpdate,
          updateMany: createAsyncSpy(async () => ({ count: 1 })),
        },
        paymentRecord: {
          findFirst: paymentRecordFindFirst,
          update: paymentRecordUpdate,
        },
        slotReservation: {
          updateMany: slotReservationUpdateMany,
        },
        appointment: {
          findFirst: appointmentFindFirst,
          findMany: appointmentFindMany,
          create: appointmentCreate,
        },
        orgSettings: {
          findFirst: orgSettingsFindFirst,
        },
        bookingProfile: {
          findFirst: bookingProfileFindFirst,
        },
        meetingType: {
          findFirst: meetingTypeFindFirst,
        },
        orgMember: {
          upsert: orgMemberUpsert,
        },
        staffCalendar: {
          findFirst: createAsyncSpy(async () => null),
        },
      }),
    appointment: {
      findUnique: appointmentFindUnique,
    },
  };

  return {
    prismaMock,
    spies: {
      bookingAttemptUpdate,
      slotReservationUpdateMany,
      paymentRecordUpdate,
      appointmentCreate,
      appointmentFindUnique,
      queryRaw,
    },
  };
}

test("markBookingAttemptPaid finalizes a valid paid reservation exactly once", async () => {
  const { prismaMock, spies } = buildSuccessfulPaidBookingMocks();
  const writeAudit = createAsyncSpy(async () => undefined);
  const sendBookingEmails = createAsyncSpy(async () => undefined);

  const { markBookingAttemptPaid } = loadFreshModule("@/lib/scheduling/paid-booking", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/lib/scheduling/audit": { writeAudit },
    "@/lib/scheduling/notify": { sendBookingEmails },
    "@/lib/scheduling/meeting-link": {
      getMeetingLink: () => "https://meet.example/room",
    },
    "@/lib/scheduling/auto-assignment": {
      pickStaffForSlot: createAsyncSpy(async () => ({
        noStaffCalendars: false,
        noStaffAvailable: false,
        staffUserId: null,
      })),
    },
  });

  const result = await markBookingAttemptPaid({
    attemptId: ATTEMPT_ID,
    stripeEventId: "evt_1",
    stripePaymentIntentId: "pi_test_123",
    stripeCheckoutSessionId: "cs_test_123",
    amountCents: 15000,
    currency: "usd",
  });

  assert.deepEqual(result, {
    handled: true,
    success: true,
    appointmentId: APPOINTMENT_ID,
    reused: false,
    emailError: null,
  });
  assert.equal(spies.appointmentCreate.calls.length, 1);
  assert.equal(spies.queryRaw.calls.length, 1);
  assert.equal(writeAudit.calls.length, 1);
  assert.equal(sendBookingEmails.calls.length, 1);
  assert.equal(spies.appointmentFindUnique.calls.length, 1);
  assert.equal(spies.paymentRecordUpdate.calls.length, 1);
  assert.equal(spies.slotReservationUpdateMany.calls.length, 1);
  assert.equal(spies.bookingAttemptUpdate.calls.length, 2);
  assert.equal(spies.bookingAttemptUpdate.calls[0][0].data.status, "paid");
  assert.equal(
    spies.bookingAttemptUpdate.calls[1][0].data.status,
    "booking_confirmed"
  );
  assert.equal(
    spies.slotReservationUpdateMany.calls[0][0].data.status,
    "consumed"
  );
});

test("markBookingAttemptPaid blocks amount or currency mismatches safely", async () => {
  const bookingAttemptUpdate = createAsyncSpy(async (args) => args);
  const slotReservationUpdateMany = createAsyncSpy(async () => ({ count: 1 }));
  const paymentRecordUpdate = createAsyncSpy(async (args) => ({
    id: PAYMENT_ID,
    ...args.data,
  }));

  let findUniqueCount = 0;
  const prismaMock = {
    $transaction: async (callback) =>
      callback({
        bookingAttempt: {
          findUnique: async () => {
            findUniqueCount += 1;
            if (findUniqueCount === 1) {
              return {
                id: ATTEMPT_ID,
                status: "payment_pending",
                reservedUntil: new Date("2031-01-15T10:10:00.000Z"),
              };
            }

            return {
              id: ATTEMPT_ID,
              status: "payment_pending",
              priceCents: 15000,
              currency: "USD",
            };
          },
          update: bookingAttemptUpdate,
        },
        paymentRecord: {
          findFirst: createAsyncSpy(async () => ({
            id: PAYMENT_ID,
            provider: "stripe",
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: null,
            amountCents: 15000,
            currency: "USD",
            webhookConfirmedAt: null,
            paidAt: null,
            failedAt: null,
          })),
          update: paymentRecordUpdate,
        },
        slotReservation: {
          updateMany: slotReservationUpdateMany,
        },
      }),
  };

  const writeAudit = createAsyncSpy(async () => undefined);
  const sendBookingEmails = createAsyncSpy(async () => undefined);

  const { markBookingAttemptPaid } = loadFreshModule("@/lib/scheduling/paid-booking", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/lib/scheduling/audit": { writeAudit },
    "@/lib/scheduling/notify": { sendBookingEmails },
    "@/lib/scheduling/meeting-link": {
      getMeetingLink: () => "https://meet.example/room",
    },
    "@/lib/scheduling/auto-assignment": {
      pickStaffForSlot: createAsyncSpy(async () => ({
        noStaffCalendars: false,
        noStaffAvailable: false,
        staffUserId: null,
      })),
    },
  });

  const result = await markBookingAttemptPaid({
    attemptId: ATTEMPT_ID,
    stripeEventId: "evt_2",
    stripePaymentIntentId: "pi_test_456",
    stripeCheckoutSessionId: "cs_test_456",
    amountCents: 20000,
    currency: "usd",
  });

  assert.deepEqual(result, {
    handled: true,
    success: false,
    attemptStatus: "booking_failed",
    error: "Stripe payment amount or currency did not match the booking attempt.",
  });
  assert.equal(paymentRecordUpdate.calls.length, 1);
  assert.equal(bookingAttemptUpdate.calls.length, 1);
  assert.equal(bookingAttemptUpdate.calls[0][0].data.status, "booking_failed");
  assert.equal(slotReservationUpdateMany.calls.length, 1);
  assert.equal(slotReservationUpdateMany.calls[0][0].data.status, "released");
  assert.equal(writeAudit.calls.length, 0);
  assert.equal(sendBookingEmails.calls.length, 0);
});

test("markBookingAttemptPaid keeps terminal booking_failed attempts terminal", async () => {
  const bookingAttemptUpdate = createAsyncSpy(async (args) => args);
  const slotReservationUpdateMany = createAsyncSpy(async () => ({ count: 1 }));

  let findUniqueCount = 0;
  const prismaMock = {
    $transaction: async (callback) =>
      callback({
        bookingAttempt: {
          findUnique: async () => {
            findUniqueCount += 1;
            if (findUniqueCount === 1) {
              return {
                id: ATTEMPT_ID,
                status: "booking_failed",
                reservedUntil: new Date("2031-01-15T10:10:00.000Z"),
              };
            }

            return {
              id: ATTEMPT_ID,
              status: "booking_failed",
              priceCents: 15000,
              currency: "USD",
            };
          },
          update: bookingAttemptUpdate,
        },
        paymentRecord: {
          findFirst: createAsyncSpy(async () => ({
            id: PAYMENT_ID,
            provider: "stripe",
            stripeCheckoutSessionId: null,
            stripePaymentIntentId: null,
            amountCents: 15000,
            currency: "USD",
            webhookConfirmedAt: null,
            paidAt: null,
            failedAt: null,
          })),
          update: createAsyncSpy(async (args) => ({ id: PAYMENT_ID, ...args.data })),
        },
        slotReservation: {
          updateMany: slotReservationUpdateMany,
        },
      }),
  };

  const { markBookingAttemptPaid } = loadFreshModule("@/lib/scheduling/paid-booking", {
    "@/lib/prisma": { prisma: prismaMock },
    "@/lib/scheduling/audit": {
      writeAudit: createAsyncSpy(async () => undefined),
    },
    "@/lib/scheduling/notify": {
      sendBookingEmails: createAsyncSpy(async () => undefined),
    },
    "@/lib/scheduling/meeting-link": {
      getMeetingLink: () => "https://meet.example/room",
    },
    "@/lib/scheduling/auto-assignment": {
      pickStaffForSlot: createAsyncSpy(async () => ({
        noStaffCalendars: false,
        noStaffAvailable: false,
        staffUserId: null,
      })),
    },
  });

  const result = await markBookingAttemptPaid({
    attemptId: ATTEMPT_ID,
    stripeEventId: "evt_3",
    stripePaymentIntentId: "pi_test_789",
    stripeCheckoutSessionId: "cs_test_789",
    amountCents: 15000,
    currency: "USD",
  });

  assert.deepEqual(result, {
    handled: true,
    success: false,
    attemptStatus: "booking_failed",
    error: "Payment succeeded after the booking attempt had already ended.",
  });
  assert.equal(bookingAttemptUpdate.calls.length, 1);
  assert.equal(bookingAttemptUpdate.calls[0][0].data.status, "booking_failed");
  assert.equal(slotReservationUpdateMany.calls.length, 1);
});
