import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";

const MODES = ["google_meet", "zoom", "phone", "in_person"] as const;
const LOCALES = ["en", "fr", "de", "lb"] as const;
const PAYMENT_POLICIES = ["FREE", "PAID"] as const;

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
  if (value.length < 3 || value.length > 120) return false;
  if (/[\r\n]/.test(value)) return false;
  return true;
}

function parseLocale(input: unknown): Locale {
  const v = cleanString(input).toLowerCase();
  if (LOCALES.includes(v as Locale)) return v as Locale;
  return "en";
}

function parsePaymentPolicy(input: unknown): PaymentPolicy | null {
  if (input === null || input === undefined || input === "") return null;
  const v = cleanString(input).toUpperCase();
  if (PAYMENT_POLICIES.includes(v as PaymentPolicy)) return v as PaymentPolicy;
  return null;
}

function normalizePaymentPolicy(value: string | null | undefined): PaymentPolicy {
  return value === "FREE" ? "FREE" : "PAID";
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

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
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

  const { id } = await ctx.params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = cleanString(body.orgId);
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
  const role = authz.role;

  const [existing, settings] = await Promise.all([
    prisma.meetingType.findFirst({
      where: { orgId, id },
      include: {
        modes: true,
        translations: true,
      },
    }),
    prisma.orgSettings.findFirst({
      where: { orgId },
      select: { paymentPolicy: true, defaultPaymentCents: true, defaultCurrency: true },
    }),
  ]);

  if (!existing) {
    return NextResponse.json({ error: "Meeting type not found" }, { status: 404 });
  }

  const orgPaymentPolicy = normalizePaymentPolicy(settings?.paymentPolicy);
  const defaultPaymentCents =
    typeof settings?.defaultPaymentCents === "number"
      ? settings.defaultPaymentCents
      : null;
  const defaultCurrency = settings?.defaultCurrency?.trim() || null;

  const patch: Prisma.MeetingTypeUpdateInput = {};
  const isStaff = role === "staff";
  if (isStaff) {
    const allowedForStaff = ["priceCents"] as const;
    const hasDisallowedField = [
      "key",
      "durationMin",
      "paymentPolicy",
      "currency",
      "isActive",
      "modes",
      "modeDetails",
      "title",
      "subtitle",
      "description",
      "locale",
    ].some((field) => field in body);
    if (hasDisallowedField || !("priceCents" in body)) {
      return NextResponse.json(
        { error: "Staff can only update the price." },
        { status: 403 }
      );
    }
  }
  const rawTitle = cleanString(body.title);
  const rawKey = cleanString(body.key);
  const wantsTitleUpdate = !isStaff && ("title" in body || "key" in body);
  const title = wantsTitleUpdate ? (rawTitle || rawKey) : "";
  if (wantsTitleUpdate) {
    if (!title || title.length < 3 || title.length > 120 || !isValidKey(title)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    patch.key = title;
  }

  if (!isStaff && body.durationMin !== undefined) {
    const durationMin = parseDurationMin(body.durationMin);
    if (!durationMin) {
      return NextResponse.json(
        { error: "Duration must be between 15 and 240 minutes in 15-minute steps." },
        { status: 400 }
      );
    }
    patch.durationMin = durationMin;
  }

  let nextPaymentPolicy: PaymentPolicy | null | undefined = undefined;
  if (!isStaff && "paymentPolicy" in body) {
    const raw = body.paymentPolicy;
    if (raw === null || raw === "" || raw === undefined) {
      nextPaymentPolicy = null;
    } else {
      const parsed = parsePaymentPolicy(raw);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }
      nextPaymentPolicy = parsed;
    }
    patch.paymentPolicy = nextPaymentPolicy ?? null;
  }

  const effectivePaymentPolicy = normalizePaymentPolicy(
    nextPaymentPolicy !== undefined
      ? nextPaymentPolicy
      : existing.paymentPolicy ?? orgPaymentPolicy
  );

  if (effectivePaymentPolicy === "FREE") {
    patch.priceCents = null;
    if (!isStaff) {
      patch.currency = null;
    }
  } else {
    if (body.priceCents !== undefined) {
      if (body.priceCents === null) {
        return NextResponse.json(
          { error: "Price is required for paid meeting types." },
          { status: 409 }
        );
      }
      patch.priceCents = body.priceCents;
    }

    if (!isStaff && body.currency !== undefined) {
      const cleanedCurrency = cleanString(body.currency);
      if (!cleanedCurrency) {
        return NextResponse.json(
          { error: "Currency is required for paid meeting types." },
          { status: 409 }
        );
      }
      patch.currency = cleanedCurrency || null;
    }

    if (
      patch.priceCents === undefined &&
      existing?.priceCents == null &&
      defaultPaymentCents !== null
    ) {
      patch.priceCents = defaultPaymentCents;
    }
    if (
      !isStaff &&
      patch.currency === undefined &&
      existing?.currency == null &&
      defaultCurrency
    ) {
      patch.currency = defaultCurrency;
    }
  }

  if (!isStaff && body.isActive !== undefined) {
    patch.isActive = Boolean(body.isActive);
  }

  if (!isStaff) {
    patch.requiresPayment = effectivePaymentPolicy !== "FREE";
  }

  const updated = await prisma.meetingType.update({
    where: { id },
    data: { ...patch, updatedAt: new Date() },
  });

  const locale = parseLocale(body.locale);
  const subtitle = cleanString(body.subtitle);
  const description = cleanString(body.description);

  if (subtitle && subtitle.length > 160) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isStaff && title) {
    const existingTranslation = await prisma.meetingTypeTranslation.findFirst({
      where: { meetingTypeId: id, locale },
      select: { id: true },
    });

    if (existingTranslation) {
      await prisma.meetingTypeTranslation.update({
        where: { id: existingTranslation.id },
        data: {
          title,
          subtitle: subtitle || null,
          description: description || null,
        },
      });
    } else {
      await prisma.meetingTypeTranslation.create({
        data: {
          id: crypto.randomUUID(),
          meetingTypeId: id,
          locale,
          title,
          subtitle: subtitle || null,
          description: description || null,
        },
      });
    }
  }

  if (!isStaff && body.modes) {
    const modes = parseModes(body.modes);
    if (modes.length === 0) {
      return NextResponse.json(
        { error: "Select at least one mode" },
        { status: 400 }
      );
    }

    const modeDetails = parseModeDetails(body.modeDetails);
    await prisma.meetingTypeMode.deleteMany({
      where: { meetingTypeId: id },
    });

    if (modes.length) {
      await prisma.meetingTypeMode.createMany({
        data: modes.map((mode) => ({
          id: crypto.randomUUID(),
          meetingTypeId: id,
          mode,
          details: modeDetails[mode],
        })),
      });
    }
  }

  const after = await prisma.meetingType.findFirst({
    where: { orgId, id },
    include: {
      modes: true,
      translations: true,
    },
  });
  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "meeting_type",
    entityId: id,
    action: "update",
    before: existing,
    after: after ?? updated,
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const { id } = await ctx.params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const url = new URL(req.url);
  const orgId = cleanString(url.searchParams.get("orgId"));
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

  const before = await prisma.meetingType.findFirst({
    where: { orgId, id },
    include: { modes: true, translations: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Meeting type not found" }, { status: 404 });
  }

  const hasAppointments = await prisma.appointment.findFirst({
    where: { meetingTypeId: id },
    select: { id: true },
  });

  if (hasAppointments) {
    const archived = await prisma.meetingType.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
    const after = await prisma.meetingType.findFirst({
      where: { orgId, id },
      include: { modes: true, translations: true },
    });
    await writeAudit({
      orgId,
      actorUserId: who.userId,
      entityType: "meeting_type",
      entityId: id,
      action: "archive",
      before,
      after: after ?? archived,
    });
    return NextResponse.json({ ok: true, archived: true });
  }

  try {
    await prisma.meetingType.delete({ where: { id } });
    await writeAudit({
      orgId,
      actorUserId: who.userId,
      entityType: "meeting_type",
      entityId: id,
      action: "delete",
      before,
      after: null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003" || err.code === "P2014") {
        return NextResponse.json(
          { error: "Cannot delete a meeting type with existing bookings." },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: "Failed to delete meeting type." }, { status: 500 });
  }
}
