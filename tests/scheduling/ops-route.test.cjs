const assert = require("node:assert/strict");
const test = require("node:test");

const { loadFreshModule } = require("../helpers/module-loader.cjs");
const { createAsyncSpy } = require("../helpers/spies.cjs");

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";
const ATTEMPT_ID = "33333333-3333-3333-3333-333333333333";

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

test("ops route retries a paid unconfirmed attempt through the shared reconciler", async () => {
  const reconcileBookingAttemptById = createAsyncSpy(async () => ({
    success: true,
    handled: true,
    status: "booking_confirmed",
    reason: null,
  }));
  const writeAudit = createAsyncSpy(async () => undefined);

  const route = loadFreshModule("@/app/api/scheduling/admin/ops/route", {
    "@/lib/prisma": {
      prisma: {
        bookingAttempt: {
          findFirst: createAsyncSpy(async () => ({
            id: ATTEMPT_ID,
            status: "paid",
            paymentStatus: "paid",
          })),
        },
      },
    },
    "@/lib/rate-limit": okRateLimit(),
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
    "@/lib/scheduling/audit": { writeAudit },
    "@/lib/scheduling/org-resolver": {
      resolveOrgIdForRequest: createAsyncSpy(async () => ORG_ID),
    },
    "@/lib/scheduling/reconciliation": {
      reconcileBookingAttemptById,
      repairStripeEventById: createAsyncSpy(async () => ({
        success: true,
        status: "processed",
        error: null,
      })),
      runSchedulingCleanupJobs: createAsyncSpy(async () => ({
        expiredReservations: 0,
        expiredAttempts: 0,
        reconciledPaidAttempts: 0,
        failedPaidAttempts: 0,
        repairedStripeEvents: 0,
        failedStripeEvents: 0,
      })),
    },
    "@/lib/validation": {
      isBodyTooLarge: () => false,
      isValidUuid: () => true,
    },
  });

  const res = await route.POST(
    new Request(`https://lux.example/api/scheduling/admin/ops?orgId=${ORG_ID}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "retry_attempt",
        attemptId: ATTEMPT_ID,
      }),
    })
  );
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.ok, true);
  assert.equal(reconcileBookingAttemptById.calls.length, 1);
  assert.equal(reconcileBookingAttemptById.calls[0][0], ATTEMPT_ID);
  assert.equal(writeAudit.calls.length, 1);
  assert.equal(writeAudit.calls[0][0].action, "ops_retry_attempt");
});

test("ops route marks attempts as reviewed through audit only", async () => {
  const writeAudit = createAsyncSpy(async () => undefined);

  const route = loadFreshModule("@/app/api/scheduling/admin/ops/route", {
    "@/lib/prisma": {
      prisma: {
        bookingAttempt: {
          findFirst: createAsyncSpy(async () => ({
            id: ATTEMPT_ID,
            status: "booking_failed",
            paymentStatus: "paid",
          })),
        },
        auditLog: {
          findMany: createAsyncSpy(async () => []),
        },
      },
    },
    "@/lib/rate-limit": okRateLimit(),
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
    "@/lib/scheduling/audit": { writeAudit },
    "@/lib/scheduling/org-resolver": {
      resolveOrgIdForRequest: createAsyncSpy(async () => ORG_ID),
    },
    "@/lib/scheduling/reconciliation": {
      reconcileBookingAttemptById: createAsyncSpy(async () => ({
        success: true,
        handled: true,
        status: "booking_confirmed",
        reason: null,
      })),
      repairStripeEventById: createAsyncSpy(async () => ({
        success: true,
        status: "processed",
        error: null,
      })),
      runSchedulingCleanupJobs: createAsyncSpy(async () => ({
        expiredReservations: 0,
        expiredAttempts: 0,
        reconciledPaidAttempts: 0,
        failedPaidAttempts: 0,
        repairedStripeEvents: 0,
        failedStripeEvents: 0,
      })),
    },
    "@/lib/validation": {
      isBodyTooLarge: () => false,
      isValidUuid: () => true,
    },
  });

  const res = await route.POST(
    new Request(`https://lux.example/api/scheduling/admin/ops?orgId=${ORG_ID}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "mark_reviewed",
        targetType: "attempt",
        targetId: ATTEMPT_ID,
      }),
    })
  );
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.ok, true);
  assert.equal(writeAudit.calls.length, 1);
  assert.equal(writeAudit.calls[0][0].action, "ops_reviewed");
  assert.equal(writeAudit.calls[0][0].entityType, "booking_attempt");
});
