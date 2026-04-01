import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { writeAudit } from "@/lib/scheduling/audit";
import { resolveOrgIdForRequest } from "@/lib/scheduling/org-resolver";
import {
  reconcileBookingAttemptById,
  repairStripeEventById,
  runSchedulingCleanupJobs,
} from "@/lib/scheduling/reconciliation";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";

const STUCK_EVENT_MINUTES = 5;
const LIST_LIMIT = 100;

type ReviewMeta = {
  reviewedAt: string;
  reviewedByName: string | null;
  reviewedByEmail: string | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPayloadString(value: unknown, ...path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

async function requireOpsAccess(req: Request) {
  const who = await requireUserIdFromSession();
  if (!who.ok) {
    return { ok: false as const, response: NextResponse.json({ error: who.error }, { status: 401 }) };
  }

  const url = new URL(req.url);
  const orgId = await resolveOrgIdForRequest({
    orgId: url.searchParams.get("orgId"),
    userId: who.userId,
    allowedRoles: ["admin", "staff"],
  });
  if (!orgId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No organization found" }, { status: 400 }),
    };
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: authz.error }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    orgId,
    userId: who.userId,
  };
}

async function loadReviewMeta(orgId: string, entityType: string, entityIds: string[]) {
  if (entityIds.length === 0) return new Map<string, ReviewMeta>();

  const reviewRows = await prisma.auditLog.findMany({
    where: {
      orgId,
      entityType,
      action: "ops_reviewed",
      entityId: { in: entityIds },
    },
    orderBy: { createdAt: "desc" },
    select: {
      entityId: true,
      createdAt: true,
      actorUserId: true,
    },
  });

  const latestByEntity = new Map<
    string,
    { createdAt: Date; actorUserId: string | null }
  >();
  for (const row of reviewRows) {
    if (!latestByEntity.has(row.entityId)) {
      latestByEntity.set(row.entityId, {
        createdAt: row.createdAt,
        actorUserId: row.actorUserId,
      });
    }
  }

  const actorIds = Array.from(
    new Set(
      Array.from(latestByEntity.values())
        .map((entry) => entry.actorUserId)
        .filter((value): value is string => Boolean(value))
    )
  );

  const actors = actorIds.length
    ? await prisma.appUser.findMany({
        where: { id: { in: actorIds } },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    : [];
  const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

  const result = new Map<string, ReviewMeta>();
  latestByEntity.forEach((entry, entityId) => {
    const actor = entry.actorUserId ? actorMap.get(entry.actorUserId) ?? null : null;
    result.set(entityId, {
      reviewedAt: entry.createdAt.toISOString(),
      reviewedByName: actor?.name ?? null,
      reviewedByEmail: actor?.email ?? null,
    });
  });
  return result;
}

async function getOpsData(orgId: string) {
  const stuckThreshold = new Date(Date.now() - STUCK_EVENT_MINUTES * 60_000);

  const [attempts, stripeEvents] = await Promise.all([
    prisma.bookingAttempt.findMany({
      where: {
        orgId,
        OR: [
          { status: "booking_failed" },
          { status: "expired" },
          {
            AND: [
              { appointment: { is: null } },
              { status: { not: "booking_confirmed" } },
              {
                OR: [{ paymentStatus: "paid" }, { status: "paid" }],
              },
            ],
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: LIST_LIMIT,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meetingType: {
          select: {
            key: true,
          },
        },
        appointment: {
          select: {
            id: true,
            status: true,
          },
        },
        reservation: {
          select: {
            id: true,
            status: true,
            reservedUntil: true,
          },
        },
        payments: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            status: true,
            amountCents: true,
            currency: true,
            stripeCheckoutSessionId: true,
            stripePaymentIntentId: true,
          },
        },
      },
    }),
    prisma.stripeEvent.findMany({
      where: {
        orgId,
        OR: [
          { status: "failed" },
          {
            status: "processing",
            updatedAt: { lt: stuckThreshold },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: LIST_LIMIT,
      select: {
        eventId: true,
        eventType: true,
        status: true,
        lastError: true,
        updatedAt: true,
        payload: true,
      },
    }),
  ]);

  const userIds = Array.from(new Set(attempts.map((attempt) => attempt.userId)));
  const profiles = userIds.length
    ? await prisma.bookingProfile.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          fullName: true,
        },
      })
    : [];
  const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));

  const eventAttemptIds = Array.from(
    new Set(
      stripeEvents
        .map((event) =>
          getPayloadString(
            event.payload,
            "data",
            "object",
            "metadata",
            "bookingAttemptId"
          )
        )
        .filter((value): value is string => Boolean(value))
    )
  );

  const missingAttemptIds = eventAttemptIds.filter(
    (attemptId) => !attempts.some((attempt) => attempt.id === attemptId)
  );

  const extraAttempts = missingAttemptIds.length
    ? await prisma.bookingAttempt.findMany({
        where: {
          orgId,
          id: { in: missingAttemptIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          meetingType: {
            select: {
              key: true,
            },
          },
          appointment: {
            select: {
              id: true,
              status: true,
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              status: true,
              amountCents: true,
              currency: true,
              stripeCheckoutSessionId: true,
              stripePaymentIntentId: true,
            },
          },
        },
      })
    : [];

  const allAttempts = [...attempts, ...extraAttempts];
  const attemptMap = new Map(allAttempts.map((attempt) => [attempt.id, attempt]));

  const attemptReviewMap = await loadReviewMeta(
    orgId,
    "booking_attempt",
    attempts.map((attempt) => attempt.id)
  );
  const eventReviewMap = await loadReviewMeta(
    orgId,
    "stripe_event",
    stripeEvents.map((event) => event.eventId)
  );

  const attemptItems = attempts.map((attempt) => {
    const payment = attempt.payments[0] ?? null;
    const profile = profileMap.get(attempt.userId);
    const review = attemptReviewMap.get(attempt.id) ?? null;
    const category =
      attempt.status === "booking_failed"
        ? "booking_failed"
        : (attempt.paymentStatus === "paid" || attempt.status === "paid") &&
            !attempt.appointment
          ? "paid_without_booking"
          : "expired";

    return {
      id: attempt.id,
      category,
      status: attempt.status,
      paymentStatus: attempt.paymentStatus,
      customerName:
        profile?.fullName ?? attempt.user.name ?? attempt.user.email ?? "Unknown",
      customerEmail: attempt.user.email ?? null,
      meetingTypeKey: attempt.meetingType?.key ?? null,
      startAtUtc: attempt.startAtUtc.toISOString(),
      endAtUtc: attempt.endAtUtc.toISOString(),
      amountCents: payment?.amountCents ?? attempt.priceCents,
      currency: payment?.currency ?? attempt.currency,
      checkoutSessionId: payment?.stripeCheckoutSessionId ?? null,
      paymentIntentId: payment?.stripePaymentIntentId ?? null,
      appointmentId: attempt.appointment?.id ?? null,
      appointmentStatus: attempt.appointment?.status ?? null,
      reservationStatus: attempt.reservation?.status ?? null,
      reservedUntil: attempt.reservedUntil ? attempt.reservedUntil.toISOString() : null,
      failureReason: attempt.failureReason ?? null,
      updatedAt: attempt.updatedAt.toISOString(),
      retryable:
        !attempt.appointment &&
        (attempt.paymentStatus === "paid" || attempt.status === "paid"),
      review,
    };
  });

  const stripeEventItems = stripeEvents.map((event) => {
    const bookingAttemptId =
      getPayloadString(
        event.payload,
        "data",
        "object",
        "metadata",
        "bookingAttemptId"
      ) ?? null;
    const relatedAttempt = bookingAttemptId ? attemptMap.get(bookingAttemptId) ?? null : null;
    const relatedPayment = relatedAttempt?.payments?.[0] ?? null;
    const relatedProfile = relatedAttempt
      ? profileMap.get(relatedAttempt.userId) ?? null
      : null;
    const review = eventReviewMap.get(event.eventId) ?? null;

    return {
      eventId: event.eventId,
      eventType: event.eventType,
      status: event.status,
      bookingAttemptId,
      customerName: relatedAttempt
        ? relatedProfile?.fullName ??
          relatedAttempt.user.name ??
          relatedAttempt.user.email ??
          "Unknown"
        : null,
      customerEmail: relatedAttempt?.user.email ?? null,
      meetingTypeKey: relatedAttempt?.meetingType?.key ?? null,
      startAtUtc: relatedAttempt?.startAtUtc.toISOString() ?? null,
      endAtUtc: relatedAttempt?.endAtUtc.toISOString() ?? null,
      appointmentId: relatedAttempt?.appointment?.id ?? null,
      checkoutSessionId:
        getPayloadString(event.payload, "data", "object", "id") ??
        relatedPayment?.stripeCheckoutSessionId ??
        null,
      paymentIntentId:
        getPayloadString(event.payload, "data", "object", "payment_intent") ??
        getPayloadString(event.payload, "data", "object", "id") ??
        relatedPayment?.stripePaymentIntentId ??
        null,
      lastError: event.lastError ?? null,
      updatedAt: event.updatedAt.toISOString(),
      retryable: true,
      review,
    };
  });

  return {
    summary: {
      paidWithoutBookingCount: attemptItems.filter(
        (item) => item.category === "paid_without_booking"
      ).length,
      bookingFailedCount: attemptItems.filter(
        (item) => item.category === "booking_failed"
      ).length,
      expiredAttemptCount: attemptItems.filter((item) => item.category === "expired")
        .length,
      failedStripeEventCount: stripeEventItems.filter((item) => item.status === "failed")
        .length,
      stuckStripeEventCount: stripeEventItems.filter(
        (item) => item.status === "processing"
      ).length,
    },
    attempts: attemptItems,
    stripeEvents: stripeEventItems,
  };
}

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const access = await requireOpsAccess(req);
  if (!access.ok) return access.response;

  const data = await getOpsData(access.orgId);
  return NextResponse.json(data);
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

  const access = await requireOpsAccess(req);
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const action = cleanString(body?.action);

  if (action === "run_cleanup") {
    const summary = await runSchedulingCleanupJobs();
    await writeAudit({
      orgId: access.orgId,
      actorUserId: access.userId,
      entityType: "scheduling_ops",
      entityId: access.orgId,
      action: "ops_run_cleanup",
      before: null,
      after: summary,
    });
    return NextResponse.json({ ok: true, summary });
  }

  if (action === "retry_attempt") {
    const attemptId = cleanString(body?.attemptId);
    if (!attemptId || !isValidUuid(attemptId)) {
      return NextResponse.json({ error: "Invalid attemptId" }, { status: 400 });
    }

    const attempt = await prisma.bookingAttempt.findFirst({
      where: {
        id: attemptId,
        orgId: access.orgId,
      },
      select: { id: true, status: true, paymentStatus: true },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Booking attempt not found" }, { status: 404 });
    }

    const result = await reconcileBookingAttemptById(attemptId);
    await writeAudit({
      orgId: access.orgId,
      actorUserId: access.userId,
      entityType: "booking_attempt",
      entityId: attemptId,
      action: "ops_retry_attempt",
      before: attempt,
      after: result,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (action === "retry_event") {
    const eventId = cleanString(body?.eventId);
    if (!eventId) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    const event = await prisma.stripeEvent.findFirst({
      where: {
        eventId,
        orgId: access.orgId,
      },
      select: { eventId: true, status: true, eventType: true, lastError: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Stripe event not found" }, { status: 404 });
    }

    const result = await repairStripeEventById(eventId);
    await writeAudit({
      orgId: access.orgId,
      actorUserId: access.userId,
      entityType: "stripe_event",
      entityId: eventId,
      action: "ops_retry_stripe_event",
      before: event,
      after: result,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (action === "mark_reviewed") {
    const targetType = cleanString(body?.targetType);
    const targetId = cleanString(body?.targetId);
    if (!targetId) {
      return NextResponse.json({ error: "Invalid targetId" }, { status: 400 });
    }

    if (targetType === "attempt") {
      const attempt = await prisma.bookingAttempt.findFirst({
        where: {
          id: targetId,
          orgId: access.orgId,
        },
        select: { id: true, status: true, paymentStatus: true },
      });
      if (!attempt) {
        return NextResponse.json({ error: "Booking attempt not found" }, { status: 404 });
      }

      await writeAudit({
        orgId: access.orgId,
        actorUserId: access.userId,
        entityType: "booking_attempt",
        entityId: targetId,
        action: "ops_reviewed",
        before: null,
        after: {
          status: attempt.status,
          paymentStatus: attempt.paymentStatus,
          reviewedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (targetType === "event") {
      const event = await prisma.stripeEvent.findFirst({
        where: {
          eventId: targetId,
          orgId: access.orgId,
        },
        select: { eventId: true, status: true, eventType: true },
      });
      if (!event) {
        return NextResponse.json({ error: "Stripe event not found" }, { status: 404 });
      }

      await writeAudit({
        orgId: access.orgId,
        actorUserId: access.userId,
        entityType: "stripe_event",
        entityId: targetId,
        action: "ops_reviewed",
        before: null,
        after: {
          status: event.status,
          eventType: event.eventType,
          reviewedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
