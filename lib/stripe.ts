import "server-only";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/security/secret-crypto";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2023-10-16";

function createStripe(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

function safeDecrypt(payload?: string | null) {
  try {
    return decryptSecret(payload);
  } catch {
    return null;
  }
}

export function inferStripeMode(secretKey: string | null) {
  if (!secretKey) return "unknown";
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  return "unknown";
}

export async function getStripeSecretKeyForOrg(orgId?: string | null) {
  const envKey = process.env.STRIPE_SECRET_KEY?.trim() || null;
  if (!orgId) return envKey;
  const secretRow = await prisma.orgSecret.findFirst({
    where: { orgId },
    select: { stripeSecretKeyEnc: true },
  });
  const orgKey = safeDecrypt(secretRow?.stripeSecretKeyEnc);
  return orgKey || envKey;
}

export async function getStripeWebhookSecretForOrg(orgId?: string | null) {
  const envSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
  if (!orgId) return envSecret;
  const secretRow = await prisma.orgSecret.findFirst({
    where: { orgId },
    select: { stripeWebhookSecretEnc: true },
  });
  const orgSecret = safeDecrypt(secretRow?.stripeWebhookSecretEnc);
  return orgSecret || envSecret;
}

export async function getStripePublishableKeyForOrg(orgId?: string | null) {
  if (!orgId) return null;
  const secretRow = await prisma.orgSecret.findFirst({
    where: { orgId },
    select: { stripePublishableKeyEnc: true },
  });
  return safeDecrypt(secretRow?.stripePublishableKeyEnc);
}

export async function getStripeForOrg(orgId?: string | null) {
  const secretKey = await getStripeSecretKeyForOrg(orgId);
  if (!secretKey) return null;
  return createStripe(secretKey);
}

