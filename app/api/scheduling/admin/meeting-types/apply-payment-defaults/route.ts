import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/scheduling/audit";
import { isValidUuid } from "@/lib/validation";

export async function POST(req: Request) {
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
  const orgId = url.searchParams.get("orgId") ?? "";
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: {
      paymentPolicy: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
    },
  });

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  if (!settings.defaultPaymentCents || !settings.defaultCurrency) {
    return NextResponse.json(
      { error: "Missing default payment amount or currency." },
      { status: 409 }
    );
  }

  const updated = await prisma.meetingType.updateMany({
    where: {
      orgId,
      OR: [{ priceCents: null }, { currency: null }],
    },
    data: {
      priceCents: settings.defaultPaymentCents,
      currency: settings.defaultCurrency,
    },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "meeting_type",
    entityId: orgId,
    action: "apply_payment_defaults",
    before: null,
    after: {
      updated: updated.count,
      defaults: {
        priceCents: settings.defaultPaymentCents,
        currency: settings.defaultCurrency,
      },
    },
  });

  return NextResponse.json({
    updated: updated.count,
    defaults: {
      priceCents: settings.defaultPaymentCents,
      currency: settings.defaultCurrency,
    },
  });
}
