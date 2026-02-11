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

const MODES = ["google_meet", "zoom", "phone", "in_person"] as const;
const LOCALES = ["en", "fr", "de", "lb"] as const;
const PAYMENT_POLICIES = [
  "FREE",
  "PAY_BEFORE_CONFIRM",
  "APPROVE_THEN_PAY",
] as const;

type MeetingMode = (typeof MODES)[number];
type Locale = (typeof LOCALES)[number];
type PaymentPolicy = (typeof PAYMENT_POLICIES)[number];
type ModeDetails = {
  label?: string;
  description?: string;
  link?: string;
};

type Body = {
  orgId?: string;
  key?: string;
  durationMin?: number;
  paymentPolicy?: PaymentPolicy | null | "";
  priceCents?: number | null;
  currency?: string | null;
  isActive?: boolean;
  modes?: MeetingMode[];
  modeDetails?: Record<string, ModeDetails>;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  locale?: Locale;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseModes(input: unknown): MeetingMode[] {
  if (!Array.isArray(input)) return [];
  return input.filter((mode): mode is MeetingMode =>
    MODES.includes(mode as MeetingMode)
  );
}

function isValidKey(value: string) {
  return /^[a-z0-9_]{3,60}$/.test(value);
}

function parseLocale(input: unknown): Locale {
  const v = cleanString(input).toLowerCase();
  if (LOCALES.includes(v as Locale)) return v as Locale;
  return "en";
}

function parseLocaleOptional(input: unknown): Locale | null {
  const v = cleanString(input).toLowerCase();
  if (!v) return null;
  if (LOCALES.includes(v as Locale)) return v as Locale;
  return null;
}

function parseDurationMin(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null;
  const n = typeof input === "number" ? input : Number(cleanString(input));
  if (!Number.isFinite(n)) return null;
  const value = Math.round(n);
  if (value < 15 || value > 240) return null;
  if (value % 15 !== 0) return null;
  return value;
}

function parsePaymentPolicy(input: unknown): PaymentPolicy | null {
  if (input === null || input === undefined || input === "") return null;
  const v = cleanString(input).toUpperCase();
  if (PAYMENT_POLICIES.includes(v as PaymentPolicy)) return v as PaymentPolicy;
  return null;
}

function parseModeDetails(
  input: unknown
): Partial<Record<MeetingMode, ModeDetails>> {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const result: Partial<Record<MeetingMode, ModeDetails>> = {};

  for (const mode of MODES) {
    const entry = raw[mode];
    if (!entry || typeof entry !== "object") continue;
    const details = entry as Record<string, unknown>;
    const label = cleanString(details.label);
    const description = cleanString(details.description);
    const link = cleanString(details.link);
    const next: ModeDetails = {};
    if (label) next.label = label;
    if (description) next.description = description;
    if (link) next.link = link;
    if (Object.keys(next).length > 0) {
      result[mode] = next;
    }
  }

  return result;
}

async function resolveOrgId(orgIdParam: string, userId: string) {
  if (orgIdParam) return orgIdParam;
  const ctx = await getUserOrgContext(userId, ["admin"]);
  return ctx?.orgId ?? "";
}

export async function GET(req: Request) {
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
  const orgIdParam = cleanString(url.searchParams.get("orgId"));
  const orgId = await resolveOrgId(orgIdParam, who.userId);
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { defaultLocale: true, paymentPolicy: true },
  });

  const requestedLocale = parseLocaleOptional(url.searchParams.get("locale"));
  const orgLocale = (settings?.defaultLocale ?? "en") as Locale;
  const locale = requestedLocale ?? orgLocale;

  const types = await prisma.meetingType.findMany({
    where: { orgId },
    include: {
      modes: { select: { mode: true, details: true } },
      translations: {
        where: { locale },
        select: { title: true, subtitle: true, description: true },
      },
    },
  });

  const items = types.map((t) => ({
    id: t.id,
    orgId: t.orgId,
    key: t.key,
    durationMin: t.durationMin,
    priceCents: t.priceCents,
    currency: t.currency,
    paymentPolicy: t.paymentPolicy ?? null,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    modes: t.modes.map((m) => m.mode as MeetingMode),
    modeDetails: Object.fromEntries(
      t.modes
        .map((m) => [m.mode, m.details] as const)
        .filter(([, details]) => details)
    ),
    title: t.translations[0]?.title ?? t.key,
    subtitle: t.translations[0]?.subtitle ?? null,
    description: t.translations[0]?.description ?? null,
    locale,
  }));

  return NextResponse.json({ orgId, locale, items });
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 8192)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgIdParam = cleanString(body.orgId);
  const orgId = await resolveOrgId(orgIdParam, who.userId);
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

  const key = cleanString(body.key);
  if (!key || !isValidKey(key)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const durationMin = parseDurationMin(body.durationMin);
  if (!durationMin) {
    return NextResponse.json(
      { error: "Duration must be between 15 and 240 minutes in 15-minute steps." },
      { status: 400 }
    );
  }

  const modes = parseModes(body.modes);
  if (modes.length === 0) {
    return NextResponse.json({ error: "Select at least one mode" }, { status: 400 });
  }

  const title = cleanString(body.title);
  if (!title || title.length < 3 || title.length > 120) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const description = cleanString(body.description);
  const subtitle = cleanString(body.subtitle);
  if (description && description.length > 500) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (subtitle && subtitle.length > 160) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: {
      paymentPolicy: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
    },
  });
  const orgPaymentPolicy = settings?.paymentPolicy ?? "FREE";
  const paymentPolicy = parsePaymentPolicy(body.paymentPolicy);
  if (body.paymentPolicy !== undefined && body.paymentPolicy !== null && !paymentPolicy) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const effectivePaymentPolicy = paymentPolicy ?? orgPaymentPolicy;
  const requiresPayment = effectivePaymentPolicy !== "FREE";
  const priceCents = body.priceCents ?? settings?.defaultPaymentCents ?? null;
  const currency = cleanString(body.currency) || settings?.defaultCurrency || null;

  if (requiresPayment && (!priceCents || !currency)) {
    return NextResponse.json(
      { error: "Price and currency required when payment is enabled" },
      { status: 400 }
    );
  }

  const existing = await prisma.meetingType.findFirst({
    where: { orgId, key },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "Key already exists" }, { status: 409 });
  }

  const mt = await prisma.meetingType.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      key,
      durationMin,
      paymentPolicy,
      requiresPayment,
      priceCents,
      currency,
      isActive: body.isActive ?? true,
    },
  });

  await prisma.meetingTypeTranslation.create({
    data: {
      id: crypto.randomUUID(),
      meetingTypeId: mt.id,
      locale,
      title,
      subtitle: subtitle || null,
      description: description || null,
    },
  });

  if (modes.length) {
    const modeDetails = parseModeDetails(body.modeDetails);
    await prisma.meetingTypeMode.createMany({
      data: modes.map((mode) => ({
        id: crypto.randomUUID(),
        meetingTypeId: mt.id,
        mode,
        details: modeDetails[mode],
      })),
    });
  }

  const full = await prisma.meetingType.findFirst({
    where: { id: mt.id, orgId },
    include: {
      modes: true,
      translations: true,
    },
  });
  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "meeting_type",
    entityId: mt.id,
    action: "create",
    before: null,
    after: full ?? mt,
  });

  return NextResponse.json({ item: mt }, { status: 201 });
}
