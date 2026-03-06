import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";
import { decryptSecret, encryptSecret } from "@/lib/security/secret-crypto";
import { inferStripeMode } from "@/lib/stripe";

const MAX_BODY = 4096;

type StripeStatus = {
  secretKeyConfigured: boolean;
  publishableKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  secretKeySource: "org" | "env" | "none";
  webhookSecretSource: "org" | "env" | "none";
  secretKeyLast4: string | null;
  publishableKeyLast4: string | null;
  webhookSecretLast4: string | null;
  mode: "test" | "live" | "unknown";
  webhookEndpoint: string;
  lastWebhookEvent: {
    id: string;
    type: string;
    createdAt: string;
    livemode: boolean | null;
  } | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeDecrypt(value: string | null | undefined) {
  try {
    return decryptSecret(value);
  } catch {
    return null;
  }
}

function last4(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4);
}

function buildBaseUrl(req: Request) {
  const env = process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/+$/, "");
  const url = new URL(req.url);
  return url.origin;
}

async function getStripeStatus(orgId: string, req: Request): Promise<StripeStatus> {
  const secretRow = await prisma.orgSecret.findFirst({
    where: { orgId },
    select: {
      stripeSecretKeyEnc: true,
      stripePublishableKeyEnc: true,
      stripeWebhookSecretEnc: true,
    },
  });

  const orgSecretKey = safeDecrypt(secretRow?.stripeSecretKeyEnc);
  const orgPublishableKey = safeDecrypt(secretRow?.stripePublishableKeyEnc);
  const orgWebhookSecret = safeDecrypt(secretRow?.stripeWebhookSecretEnc);
  const envSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || null;
  const envWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
  const effectiveSecretKey = orgSecretKey || envSecretKey;
  const effectiveWebhookSecret = orgWebhookSecret || envWebhookSecret;
  const secretKeySource = orgSecretKey ? "org" : envSecretKey ? "env" : "none";
  const webhookSecretSource = orgWebhookSecret
    ? "org"
    : envWebhookSecret
      ? "env"
      : "none";

  const lastWebhook = await prisma.auditLog.findFirst({
    where: { orgId, entityType: "stripe_webhook" },
    orderBy: { createdAt: "desc" },
  });

  return {
    secretKeyConfigured: Boolean(effectiveSecretKey),
    publishableKeyConfigured: Boolean(orgPublishableKey),
    webhookSecretConfigured: Boolean(effectiveWebhookSecret),
    secretKeySource,
    webhookSecretSource,
    secretKeyLast4: last4(effectiveSecretKey),
    publishableKeyLast4: last4(orgPublishableKey),
    webhookSecretLast4: last4(effectiveWebhookSecret),
    mode: inferStripeMode(effectiveSecretKey),
    webhookEndpoint: `${buildBaseUrl(req)}/api/scheduling/webhooks/stripe/${orgId}`,
    lastWebhookEvent: lastWebhook
      ? {
          id: lastWebhook.entityId,
          type: lastWebhook.action,
          createdAt: lastWebhook.createdAt.toISOString(),
          livemode:
            typeof (lastWebhook.after as any)?.livemode === "boolean"
              ? ((lastWebhook.after as any).livemode as boolean)
              : null,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgIdParam = cleanString(url.searchParams.get("orgId"));

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const orgContext = orgIdParam
    ? null
    : await getUserOrgContext(who.userId, ["admin"]);

  const orgId = orgIdParam || orgContext?.orgId || "";
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

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const stripe = await getStripeStatus(orgId, req);
  return NextResponse.json({ stripe }, { status: 200 });
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, MAX_BODY)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const body = await req.json().catch(() => ({}));
  const orgIdParam = cleanString(body?.orgId);
  const orgContext = orgIdParam
    ? null
    : await getUserOrgContext(who.userId, ["admin"]);
  const orgId = orgIdParam || orgContext?.orgId || "";
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

  const disconnect = Boolean(body?.disconnect);
  const stripeSecretKey = cleanString(body?.stripeSecretKey);
  const stripePublishableKey = cleanString(body?.stripePublishableKey);
  const stripeWebhookSecret = cleanString(body?.stripeWebhookSecret);

  if (!disconnect) {
    if (stripeSecretKey && !stripeSecretKey.startsWith("sk_")) {
      return NextResponse.json({ error: "Invalid Stripe secret key" }, { status: 400 });
    }
    if (stripePublishableKey && !stripePublishableKey.startsWith("pk_")) {
      return NextResponse.json(
        { error: "Invalid Stripe publishable key" },
        { status: 400 }
      );
    }
    if (stripeWebhookSecret && !stripeWebhookSecret.startsWith("whsec_")) {
      return NextResponse.json(
        { error: "Invalid Stripe webhook secret" },
        { status: 400 }
      );
    }
  }

  const secretUpdates: Record<string, string | null> = {};
  const updatedKeys: string[] = [];

  if (disconnect) {
    secretUpdates.stripeSecretKeyEnc = null;
    secretUpdates.stripePublishableKeyEnc = null;
    secretUpdates.stripeWebhookSecretEnc = null;
    updatedKeys.push("stripeSecretKey", "stripePublishableKey", "stripeWebhookSecret");
  } else {
    try {
      if (stripeSecretKey) {
        secretUpdates.stripeSecretKeyEnc = encryptSecret(stripeSecretKey);
        updatedKeys.push("stripeSecretKey");
      }
      if (stripePublishableKey) {
        secretUpdates.stripePublishableKeyEnc = encryptSecret(stripePublishableKey);
        updatedKeys.push("stripePublishableKey");
      }
      if (stripeWebhookSecret) {
        secretUpdates.stripeWebhookSecretEnc = encryptSecret(stripeWebhookSecret);
        updatedKeys.push("stripeWebhookSecret");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to encrypt secrets";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (Object.keys(secretUpdates).length > 0) {
    await prisma.orgSecret.upsert({
      where: { orgId },
      create: {
        id: crypto.randomUUID(),
        orgId,
        ...secretUpdates,
      },
      update: {
        ...secretUpdates,
        updatedAt: new Date(),
      },
    });

    await writeAudit({
      orgId,
      actorUserId: who.userId,
      entityType: "org_secret",
      entityId: orgId,
      action: disconnect ? "clear_stripe" : "update_stripe",
      before: null,
      after: { updatedKeys },
    });
  }

  const stripe = await getStripeStatus(orgId, req);
  return NextResponse.json({ stripe }, { status: 200 });
}
