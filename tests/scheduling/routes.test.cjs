const assert = require("node:assert/strict");
const test = require("node:test");

const { loadFreshModule } = require("../helpers/module-loader.cjs");
const { createAsyncSpy } = require("../helpers/spies.cjs");

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";
const ATTEMPT_ID = "33333333-3333-3333-3333-333333333333";
const MEETING_TYPE_ID = "66666666-6666-6666-6666-666666666666";
const APPOINTMENT_ID = "55555555-5555-5555-5555-555555555555";

function okRateLimit() {
  return {
    RATE_LIMIT_RULES: { scheduling: { id: "scheduling", max: 60, windowMs: 60000 } },
    applyRateLimit: createAsyncSpy(async () => ({
      ok: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.now() + 60000,
      headers: {},
    })),
  };
}

test("checkout route uses the stable booking attempt idempotency key", async () => {
  const sessionsCreate = createAsyncSpy(async () => ({
    id: "cs_test_123",
    url: "https://stripe.example/session/cs_test_123",
  }));
  const paymentUpdate = createAsyncSpy(async () => ({}));

  const route = loadFreshModule("@/app/api/scheduling/payment/checkout/route", {
    "@/lib/prisma": {
      prisma: {
        paymentRecord: {
          update: paymentUpdate,
        },
      },
    },
    "@/lib/scheduling/authz": {
      requireUserIdFromSession: createAsyncSpy(async () => ({ ok: true, userId: USER_ID })),
    },
    "@/lib/scheduling/paid-booking": {
      getOrCreatePaidBookingAttempt: createAsyncSpy(async () => ({
        attemptId: ATTEMPT_ID,
        orgId: ORG_ID,
        paymentId: "payment-1",
        status: "payment_pending",
        priceCents: 15000,
        currency: "USD",
        mode: "google_meet",
        startLocal: "2031-01-15T13:00:00",
        requestedTimezone: "UTC",
        staffUserId: null,
        stripeCheckoutSessionId: null,
        reservedUntil: "2031-01-15T13:10:00.000Z",
      })),
    },
    "@/lib/rate-limit": okRateLimit(),
    "@/lib/validation": {
      isBodyTooLarge: () => false,
      isValidNotes: () => true,
      isValidTimezone: () => true,
      isValidUuid: () => true,
    },
    "@/lib/public-url": {
      getPublicBaseUrl: () => "https://lux.example",
    },
    "@/lib/stripe": {
      getStripeForOrg: createAsyncSpy(async () => ({
        checkout: {
          sessions: {
            create: sessionsCreate,
          },
        },
      })),
    },
  });

  const req = new Request("https://lux.example/api/scheduling/payment/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      orgId: ORG_ID,
      meetingTypeId: MEETING_TYPE_ID,
      mode: "google_meet",
      startLocal: "2031-01-15T13:00:00",
      tz: "UTC",
    }),
  });

  const res = await route.POST(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.bookingAttemptId, ATTEMPT_ID);
  assert.equal(json.sessionId, "cs_test_123");
  assert.equal(
    sessionsCreate.calls[0][1].idempotencyKey,
    `booking_attempt:${ATTEMPT_ID}`
  );
  assert.equal(
    paymentUpdate.calls[0][0].data.stripeCheckoutSessionId,
    "cs_test_123"
  );
});

test("webhook route dedupes already processed Stripe events", async () => {
  const markBookingAttemptPaid = createAsyncSpy(async () => ({
    handled: true,
    success: true,
    appointmentId: APPOINTMENT_ID,
    reused: false,
    emailError: null,
  }));

  const route = loadFreshModule("@/app/api/scheduling/webhooks/stripe/[orgId]/route", {
    "@/lib/prisma": {
      prisma: {
        stripeEvent: {
          findUnique: createAsyncSpy(async () => ({
            id: "stripe-event-row-1",
            processedAt: new Date("2031-01-15T13:05:00.000Z"),
            status: "processed",
          })),
        },
      },
    },
    "@/lib/scheduling/audit": {
      writeAudit: createAsyncSpy(async () => undefined),
    },
    "@/lib/scheduling/paid-booking": {
      markBookingAttemptPaid,
      markBookingAttemptPaymentFailed: createAsyncSpy(async () => ({
        handled: true,
        success: false,
        attemptStatus: "payment_failed",
        error: "failed",
      })),
    },
    "@/lib/stripe": {
      getStripeForOrg: createAsyncSpy(async () => ({
        webhooks: {
          constructEvent: () => ({
            id: "evt_duplicate_1",
            type: "payment_intent.succeeded",
            livemode: false,
            created: 1,
            data: {
              object: {
                id: "pi_test_123",
                amount_received: 15000,
                currency: "usd",
                metadata: { bookingAttemptId: ATTEMPT_ID },
              },
            },
          }),
        },
      })),
      getStripeWebhookSecretForOrg: createAsyncSpy(async () => "whsec_test"),
    },
    "@/lib/validation": {
      isValidUuid: () => true,
    },
  });

  const req = new Request("https://lux.example/api/scheduling/webhooks/stripe/" + ORG_ID, {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body: JSON.stringify({ ok: true }),
  });

  const res = await route.POST(req, {
    params: { orgId: ORG_ID },
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(json, {
    received: true,
    duplicate: true,
  });
  assert.equal(markBookingAttemptPaid.calls.length, 0);
});

test("status route only marks active payment_pending attempts as resumable", async () => {
  const route = loadFreshModule("@/app/api/scheduling/payment/status/route", {
    "@/lib/prisma": {
      prisma: {
        bookingAttempt: {
          findFirst: createAsyncSpy(async () => ({
            id: ATTEMPT_ID,
            status: "payment_pending",
            paymentStatus: "unpaid",
            mode: "google_meet",
            startLocal: "2031-01-15T13:00:00",
            requestedTimezone: "UTC",
            startAtUtc: new Date("2031-01-15T13:00:00.000Z"),
            endAtUtc: new Date("2031-01-15T14:00:00.000Z"),
            priceCents: 15000,
            currency: "USD",
            reservedUntil: new Date("2031-01-15T13:10:00.000Z"),
            failureReason: null,
            notes: null,
            meetingType: {
              id: MEETING_TYPE_ID,
              key: "strategy-call",
              durationMin: 60,
            },
            appointment: null,
            reservation: {
              id: "reservation-1",
              status: "active",
              staffUserId: null,
              reservedUntil: new Date(Date.now() + 10 * 60_000),
              startAtUtc: new Date("2031-01-15T13:00:00.000Z"),
              endAtUtc: new Date("2031-01-15T14:00:00.000Z"),
            },
            payments: [
              {
                status: "pending",
                amountCents: 15000,
                currency: "USD",
                stripeCheckoutSessionId: "cs_test_123",
                stripePaymentIntentId: "pi_test_123",
                paidAt: null,
                failedAt: null,
              },
            ],
          })),
        },
      },
    },
    "@/lib/rate-limit": okRateLimit(),
    "@/lib/scheduling/authz": {
      requireUserIdFromSession: createAsyncSpy(async () => ({ ok: true, userId: USER_ID })),
    },
    "@/lib/scheduling/paid-booking": {
      refreshPaidBookingAttemptState: createAsyncSpy(async () => false),
    },
    "@/lib/validation": {
      isValidUuid: () => true,
    },
  });

  const res = await route.GET(
    new Request(
      `https://lux.example/api/scheduling/payment/status?attemptId=${ATTEMPT_ID}`
    )
  );
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.bookingAttempt.id, ATTEMPT_ID);
  assert.equal(json.bookingAttempt.canResumePayment, true);
});

test("resume route rejects expired attempts", async () => {
  const route = loadFreshModule("@/app/api/scheduling/payment/resume/route", {
    "@/lib/prisma": {
      prisma: {
        bookingAttempt: {
          findFirst: createAsyncSpy(async () => ({
            id: ATTEMPT_ID,
            orgId: ORG_ID,
            status: "expired",
            reservation: {
              status: "expired",
              reservedUntil: new Date(Date.now() - 60_000),
            },
            payments: [
              {
                id: "payment-1",
                stripeCheckoutSessionId: "cs_test_123",
              },
            ],
          })),
        },
      },
    },
    "@/lib/public-url": {
      getPublicBaseUrl: () => "https://lux.example",
    },
    "@/lib/rate-limit": okRateLimit(),
    "@/lib/scheduling/authz": {
      requireUserIdFromSession: createAsyncSpy(async () => ({ ok: true, userId: USER_ID })),
    },
    "@/lib/scheduling/paid-booking": {
      refreshPaidBookingAttemptState: createAsyncSpy(async () => false),
    },
    "@/lib/stripe": {
      getStripeForOrg: createAsyncSpy(async () => ({
        checkout: {
          sessions: {
            retrieve: createAsyncSpy(async () => ({
              status: "open",
              url: "https://stripe.example/session/cs_test_123",
            })),
          },
        },
      })),
    },
    "@/lib/validation": {
      isBodyTooLarge: () => false,
      isValidUuid: () => true,
    },
  });

  const res = await route.POST(
    new Request("https://lux.example/api/scheduling/payment/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attemptId: ATTEMPT_ID }),
    })
  );
  const json = await res.json();

  assert.equal(res.status, 409);
  assert.equal(json.error, "This payment attempt can no longer be resumed.");
});

test("manual payment route blocks Stripe-paid booking status bypass", async () => {
  const route = loadFreshModule(
    "@/app/api/scheduling/admin/appointments/[id]/payment/route",
    {
      "@/lib/prisma": {
        prisma: {
          appointment: {
            findFirst: createAsyncSpy(async () => ({
              id: APPOINTMENT_ID,
              bookingAttemptId: ATTEMPT_ID,
              paymentPolicy: "PAID",
              paymentStatus: "unpaid",
              requiresPayment: true,
              priceCents: 15000,
              currency: "USD",
              meetingTypeId: MEETING_TYPE_ID,
            })),
          },
          orgSettings: {
            findFirst: createAsyncSpy(async () => ({ paymentPolicy: "PAID" })),
          },
          meetingType: {
            findFirst: createAsyncSpy(async () => ({
              requiresPayment: true,
              priceCents: 15000,
              currency: "USD",
            })),
          },
        },
      },
      "@/lib/scheduling/authz": {
        requireUserIdFromSession: createAsyncSpy(async () => ({
          ok: true,
          userId: USER_ID,
        })),
        requireOrgRole: createAsyncSpy(async () => ({
          ok: true,
          role: "admin",
        })),
      },
      "@/lib/scheduling/org-resolver": {
        resolveOrgIdForRequest: createAsyncSpy(async () => ORG_ID),
      },
      "@/lib/rate-limit": okRateLimit(),
      "@/lib/validation": {
        isBodyTooLarge: () => false,
        isValidUuid: () => true,
      },
    }
  );

  const res = await route.POST(
    new Request(
      `https://lux.example/api/scheduling/admin/appointments/${APPOINTMENT_ID}/payment?orgId=${ORG_ID}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      }
    ),
    {
      params: Promise.resolve({ id: APPOINTMENT_ID }),
    }
  );
  const json = await res.json();

  assert.equal(res.status, 409);
  assert.match(json.error, /Manual payment updates are disabled/);
});
