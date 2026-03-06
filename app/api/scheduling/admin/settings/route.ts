import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isBodyTooLarge,
  isValidEmail,
  isValidPhone,
  isValidTimezone,
  isValidUuid,
} from "@/lib/validation";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { encryptSecret, hasSecret } from "@/lib/security/secret-crypto";
import { writeAudit } from "@/lib/scheduling/audit";

const LOCALES = ["en", "fr", "de", "lb"] as const;
const APPROVAL_POLICIES = ["AUTO_APPROVE", "REQUIRES_APPROVAL"] as const;
const PAYMENT_POLICIES = ["FREE", "PAY_BEFORE_CONFIRM", "APPROVE_THEN_PAY"] as const;

type Body = {
  orgId?: string;
  approvalPolicy?: (typeof APPROVAL_POLICIES)[number];
  paymentPolicy?: (typeof PAYMENT_POLICIES)[number];
  notifyEmails?: string;
  notifyWhatsapp?: string;
  notifyEmailEnabled?: boolean;
  notifyWhatsappEnabled?: boolean;
  notifyCalendarEnabled?: boolean;
  defaultTz?: string;
  defaultLocale?: (typeof LOCALES)[number];
  workingHoursJson?: string;
  defaultPaymentCents?: number | string | null;
  defaultCurrency?: string | null;
  allowedCurrencies?: string;
  maxDailyBookings?: number | string | null;
  metaWhatsappToken?: string;
  metaWhatsappPhoneId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsappFrom?: string;
  telnyxApiKey?: string;
  telnyxWhatsappFrom?: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNotifyEmails(
  raw: string
): string[] | null | { error: string } {
  if (!raw) return null;
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) return null;
  for (const email of items) {
    if (!isValidEmail(email)) {
      return { error: `Invalid email: ${email}` };
    }
  }
  return items;
}

function normalizeNotifyPhones(
  raw: string
): string[] | null | { error: string } {
  if (!raw) return null;
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) return null;
  for (const phone of items) {
    if (!isValidPhone(phone)) {
      return { error: `Invalid phone: ${phone}` };
    }
  }
  return items;
}

function normalizeAllowedCurrencies(
  raw: string
): string[] | null | { error: string } {
  if (!raw) return null;
  const items = raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  if (items.length === 0) return null;
  for (const code of items) {
    if (!/^[A-Z]{3}$/.test(code)) {
      return { error: `Invalid currency: ${code}` };
    }
  }
  return Array.from(new Set(items));
}

function validateWorkingHours(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      timezone?: string;
      slotStepMin?: number;
      bufferMin?: number;
      week?: Record<string, Array<{ start: string; end: string }>>;
    };

    if (parsed.timezone && !isValidTimezone(parsed.timezone)) {
      return { error: "Invalid timezone in working hours" };
    }

    if (
      parsed.slotStepMin !== undefined &&
      (parsed.slotStepMin < 5 || parsed.slotStepMin > 60)
    ) {
      return { error: "Invalid slotStepMin" };
    }

    if (
      parsed.bufferMin !== undefined &&
      (parsed.bufferMin < 0 || parsed.bufferMin > 15)
    ) {
      return { error: "Invalid bufferMin" };
    }

    return { value: parsed };
  } catch {
    return { error: "Invalid working hours JSON" };
  }
}

function toNotifyString(raw: string[] | null | undefined): string | null {
  if (!raw || raw.length === 0) return null;
  return raw.join(", ");
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

  const row = await prisma.orgSettings.findFirst({
    where: { orgId },
  });
  const secretRow = await prisma.orgSecret.findFirst({ where: { orgId } });

  if (!row) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const metaTokenConfigured = hasSecret(secretRow?.metaWhatsappTokenEnc);
  const metaPhoneConfigured = hasSecret(secretRow?.metaWhatsappPhoneIdEnc);
  const twilioSidConfigured = hasSecret(secretRow?.twilioAccountSidEnc);
  const twilioTokenConfigured = hasSecret(secretRow?.twilioAuthTokenEnc);
  const twilioFromConfigured = hasSecret(secretRow?.twilioWhatsappFromEnc);
  const telnyxApiKeyConfigured = hasSecret(secretRow?.telnyxApiKeyEnc);
  const telnyxFromConfigured = hasSecret(secretRow?.telnyxWhatsappFromEnc);
  const stripeSecretConfigured =
    hasSecret(secretRow?.stripeSecretKeyEnc) || Boolean(process.env.STRIPE_SECRET_KEY);
  const stripePublishableConfigured = hasSecret(secretRow?.stripePublishableKeyEnc);
  const stripeWebhookConfigured =
    hasSecret(secretRow?.stripeWebhookSecretEnc) ||
    Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return NextResponse.json(
    {
      settings: {
        ...row,
        notifyEmails: toNotifyString(row.notifyEmails),
        notifyWhatsapp: toNotifyString(row.notifyWhatsapp),
        allowedCurrencies: toNotifyString(row.allowedCurrencies),
        workingHoursJson: row.workingHours
          ? JSON.stringify(row.workingHours, null, 2)
          : null,
      },
      stripeConfigured: stripeSecretConfigured,
      secretStatus: {
        metaTokenConfigured,
        metaPhoneConfigured,
        metaConfigured: metaTokenConfigured && metaPhoneConfigured,
        twilioSidConfigured,
        twilioTokenConfigured,
        twilioFromConfigured,
        twilioConfigured:
          twilioSidConfigured && twilioTokenConfigured && twilioFromConfigured,
        telnyxApiKeyConfigured,
        telnyxFromConfigured,
        telnyxConfigured: telnyxApiKeyConfigured && telnyxFromConfigured,
        stripeSecretConfigured,
        stripePublishableConfigured,
        stripeWebhookConfigured,
      },
    },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 4096)) {
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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgIdParam = cleanString(body.orgId);
  const orgContext = orgIdParam
    ? null
    : await getUserOrgContext(who.userId, ["admin"]);

  const orgId = orgIdParam || orgContext?.orgId || "";
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const approvalPolicy = body.approvalPolicy;
  const paymentPolicy = body.paymentPolicy;
  const defaultTz = cleanString(body.defaultTz);
  const defaultLocale = body.defaultLocale;
  const hasNotifyEmails = Object.prototype.hasOwnProperty.call(body, "notifyEmails");
  const hasNotifyWhatsapp = Object.prototype.hasOwnProperty.call(body, "notifyWhatsapp");
  const notifyRaw = hasNotifyEmails ? cleanString(body.notifyEmails) : undefined;
  const notifyWhatsappRaw = hasNotifyWhatsapp
    ? cleanString(body.notifyWhatsapp)
    : undefined;
  const notifyEmailEnabled = body.notifyEmailEnabled;
  const notifyWhatsappEnabled = body.notifyWhatsappEnabled;
  const notifyCalendarEnabled = body.notifyCalendarEnabled;
  const workingHoursJson = cleanString(body.workingHoursJson);
  const defaultCurrency = cleanString(body.defaultCurrency ?? "");
  const allowedCurrenciesRaw = cleanString(body.allowedCurrencies);
  const defaultPaymentCentsRaw = body.defaultPaymentCents;
  const maxDailyBookingsRaw = body.maxDailyBookings;
  const metaWhatsappToken = cleanString(body.metaWhatsappToken);
  const metaWhatsappPhoneId = cleanString(body.metaWhatsappPhoneId);
  const twilioAccountSid = cleanString(body.twilioAccountSid);
  const twilioAuthToken = cleanString(body.twilioAuthToken);
  const twilioWhatsappFrom = cleanString(body.twilioWhatsappFrom);
  const telnyxApiKey = cleanString(body.telnyxApiKey);
  const telnyxWhatsappFrom = cleanString(body.telnyxWhatsappFrom);

  const defaultPaymentCents =
    typeof defaultPaymentCentsRaw === "number"
      ? defaultPaymentCentsRaw
      : typeof defaultPaymentCentsRaw === "string" &&
        defaultPaymentCentsRaw.trim()
      ? Number(defaultPaymentCentsRaw)
      : null;
  const maxDailyBookings =
    typeof maxDailyBookingsRaw === "number"
      ? maxDailyBookingsRaw
      : typeof maxDailyBookingsRaw === "string" && maxDailyBookingsRaw.trim()
      ? Number(maxDailyBookingsRaw)
      : null;

  if (approvalPolicy && !APPROVAL_POLICIES.includes(approvalPolicy)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (paymentPolicy && !PAYMENT_POLICIES.includes(paymentPolicy)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (defaultLocale && !LOCALES.includes(defaultLocale)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (defaultTz && !isValidTimezone(defaultTz)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (
    defaultPaymentCents !== null &&
    (!Number.isFinite(defaultPaymentCents) || defaultPaymentCents < 0)
  ) {
    return NextResponse.json({ error: "Invalid default price" }, { status: 400 });
  }
  if (
    maxDailyBookings !== null &&
    (!Number.isFinite(maxDailyBookings) || maxDailyBookings < 1 || maxDailyBookings > 50)
  ) {
    return NextResponse.json(
      { error: "Invalid daily booking limit" },
      { status: 400 }
    );
  }

  if (defaultCurrency && defaultCurrency.length !== 3) {
    return NextResponse.json({ error: "Invalid default currency" }, { status: 400 });
  }

  const normalizedNotify = hasNotifyEmails
    ? normalizeNotifyEmails(notifyRaw ?? "")
    : null;
  if (hasNotifyEmails && normalizedNotify && !Array.isArray(normalizedNotify)) {
    return NextResponse.json({ error: normalizedNotify.error }, { status: 400 });
  }
  const notifyEmailsValue = hasNotifyEmails
    ? Array.isArray(normalizedNotify)
      ? normalizedNotify
      : []
    : undefined;

  const normalizedWhatsApp = hasNotifyWhatsapp
    ? normalizeNotifyPhones(notifyWhatsappRaw ?? "")
    : null;
  if (hasNotifyWhatsapp && normalizedWhatsApp && !Array.isArray(normalizedWhatsApp)) {
    return NextResponse.json({ error: normalizedWhatsApp.error }, { status: 400 });
  }
  const notifyWhatsappValue = hasNotifyWhatsapp
    ? Array.isArray(normalizedWhatsApp)
      ? normalizedWhatsApp
      : []
    : undefined;

  const normalizedCurrencies = normalizeAllowedCurrencies(allowedCurrenciesRaw);
  if (normalizedCurrencies && !Array.isArray(normalizedCurrencies)) {
    return NextResponse.json({ error: normalizedCurrencies.error }, { status: 400 });
  }

  const workingHoursCheck = validateWorkingHours(workingHoursJson || null);
  if (workingHoursCheck && "error" in workingHoursCheck) {
    return NextResponse.json({ error: workingHoursCheck.error }, { status: 400 });
  }

  const secretUpdates: Record<string, string> = {};
  const secretKeysUpdated: string[] = [];
  const wantsSecretUpdate =
    metaWhatsappToken ||
    metaWhatsappPhoneId ||
    twilioAccountSid ||
    twilioAuthToken ||
    twilioWhatsappFrom ||
    telnyxApiKey ||
    telnyxWhatsappFrom;

  if (wantsSecretUpdate) {
    try {
      if (metaWhatsappToken) {
        secretUpdates.metaWhatsappTokenEnc = encryptSecret(metaWhatsappToken);
        secretKeysUpdated.push("metaWhatsappToken");
      }
      if (metaWhatsappPhoneId) {
        secretUpdates.metaWhatsappPhoneIdEnc = encryptSecret(metaWhatsappPhoneId);
        secretKeysUpdated.push("metaWhatsappPhoneId");
      }
      if (twilioAccountSid) {
        secretUpdates.twilioAccountSidEnc = encryptSecret(twilioAccountSid);
        secretKeysUpdated.push("twilioAccountSid");
      }
      if (twilioAuthToken) {
        secretUpdates.twilioAuthTokenEnc = encryptSecret(twilioAuthToken);
        secretKeysUpdated.push("twilioAuthToken");
      }
      if (twilioWhatsappFrom) {
        secretUpdates.twilioWhatsappFromEnc = encryptSecret(twilioWhatsappFrom);
        secretKeysUpdated.push("twilioWhatsappFrom");
      }
      if (telnyxApiKey) {
        secretUpdates.telnyxApiKeyEnc = encryptSecret(telnyxApiKey);
        secretKeysUpdated.push("telnyxApiKey");
      }
      if (telnyxWhatsappFrom) {
        secretUpdates.telnyxWhatsappFromEnc = encryptSecret(telnyxWhatsappFrom);
        secretKeysUpdated.push("telnyxWhatsappFrom");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to encrypt secrets";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const updated = await prisma.orgSettings.updateMany({
    where: { orgId },
    data: {
      approvalPolicy: approvalPolicy ?? undefined,
      paymentPolicy: paymentPolicy ?? undefined,
      notifyEmails: notifyEmailsValue,
      notifyWhatsapp: notifyWhatsappValue,
      notifyEmailEnabled:
        typeof notifyEmailEnabled === "boolean" ? notifyEmailEnabled : undefined,
      notifyWhatsappEnabled:
        typeof notifyWhatsappEnabled === "boolean"
          ? notifyWhatsappEnabled
          : undefined,
      notifyCalendarEnabled:
        typeof notifyCalendarEnabled === "boolean"
          ? notifyCalendarEnabled
          : undefined,
      allowedCurrencies: normalizedCurrencies ?? undefined,
      defaultTz: defaultTz || undefined,
      defaultLocale: defaultLocale ?? undefined,
      workingHours:
        workingHoursCheck?.value === null
          ? Prisma.DbNull
          : workingHoursCheck?.value ?? undefined,
      defaultPaymentCents:
        defaultPaymentCents !== null ? defaultPaymentCents : undefined,
      defaultCurrency: defaultCurrency || undefined,
      maxDailyBookings:
        maxDailyBookings !== null ? Math.floor(maxDailyBookings) : undefined,
      updatedAt: new Date(),
    },
  });

  if (!updated.count) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  if (wantsSecretUpdate && Object.keys(secretUpdates).length > 0) {
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
      action: "update",
      before: null,
      after: { updatedKeys: secretKeysUpdated },
    });
  }

  const row = await prisma.orgSettings.findFirst({ where: { orgId } });
  const secretRow = await prisma.orgSecret.findFirst({ where: { orgId } });
  const metaTokenConfigured = hasSecret(secretRow?.metaWhatsappTokenEnc);
  const metaPhoneConfigured = hasSecret(secretRow?.metaWhatsappPhoneIdEnc);
  const twilioSidConfigured = hasSecret(secretRow?.twilioAccountSidEnc);
  const twilioTokenConfigured = hasSecret(secretRow?.twilioAuthTokenEnc);
  const twilioFromConfigured = hasSecret(secretRow?.twilioWhatsappFromEnc);
  const telnyxApiKeyConfigured = hasSecret(secretRow?.telnyxApiKeyEnc);
  const telnyxFromConfigured = hasSecret(secretRow?.telnyxWhatsappFromEnc);
  const stripeSecretConfigured =
    hasSecret(secretRow?.stripeSecretKeyEnc) || Boolean(process.env.STRIPE_SECRET_KEY);
  const stripePublishableConfigured = hasSecret(secretRow?.stripePublishableKeyEnc);
  const stripeWebhookConfigured =
    hasSecret(secretRow?.stripeWebhookSecretEnc) ||
    Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  return NextResponse.json(
    {
      settings: row
        ? {
            ...row,
            notifyEmails: toNotifyString(row.notifyEmails),
            notifyWhatsapp: toNotifyString(row.notifyWhatsapp),
            allowedCurrencies: toNotifyString(row.allowedCurrencies),
            workingHoursJson: row.workingHours
              ? JSON.stringify(row.workingHours, null, 2)
              : null,
          }
        : null,
      stripeConfigured: stripeSecretConfigured,
      secretStatus: {
        metaTokenConfigured,
        metaPhoneConfigured,
        metaConfigured: metaTokenConfigured && metaPhoneConfigured,
        twilioSidConfigured,
        twilioTokenConfigured,
        twilioFromConfigured,
        twilioConfigured:
          twilioSidConfigured && twilioTokenConfigured && twilioFromConfigured,
        telnyxApiKeyConfigured,
        telnyxFromConfigured,
        telnyxConfigured: telnyxApiKeyConfigured && telnyxFromConfigured,
        stripeSecretConfigured,
        stripePublishableConfigured,
        stripeWebhookConfigured,
      },
    },
    { status: 200 }
  );
}
