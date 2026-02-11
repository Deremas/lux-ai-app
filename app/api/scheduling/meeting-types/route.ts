import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

// If you don't have "@/db" alias, use:
// import { db } from "../../../db"; (path depends on your folder structure)

type Locale = "en" | "fr" | "de" | "lb";

function normalizeLocale(input: string | null): Locale {
  const v = (input ?? "").toLowerCase();
  if (v === "en" || v === "fr" || v === "de" || v === "lb") return v;
  return "en";
}

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const url = new URL(req.url);

  const orgId = url.searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const requestedLocale = normalizeLocale(url.searchParams.get("locale"));

  // 1) Find org default locale (fallback)
  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: {
      defaultLocale: true,
      paymentPolicy: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
      allowedCurrencies: true,
    },
  });

  const orgDefaultLocale = (settings?.defaultLocale ?? "en") as Locale;
  const orgPaymentPolicy = settings?.paymentPolicy ?? "FREE";
  const fallbackPaymentCents = Number(
    process.env.DEFAULT_PAYMENT_CENTS ?? "15000"
  );
  const fallbackCurrency = (process.env.DEFAULT_PAYMENT_CURRENCY ?? "EUR").trim();

  const defaultPaymentCents =
    typeof settings?.defaultPaymentCents === "number"
      ? settings.defaultPaymentCents
      : Number.isFinite(fallbackPaymentCents)
        ? fallbackPaymentCents
        : null;
  const defaultCurrency = settings?.defaultCurrency ?? (fallbackCurrency || null);

  const localeOrder: Locale[] =
    requestedLocale === orgDefaultLocale
      ? [requestedLocale, "en"]
      : [requestedLocale, orgDefaultLocale, "en"];

  // 2) Get meeting types
  const types = await prisma.meetingType.findMany({
    where: { orgId, isActive: true },
    include: {
      modes: { select: { mode: true, details: true } },
      translations: {
        where: { locale: { in: localeOrder } },
        select: { locale: true, title: true, subtitle: true, description: true },
      },
    },
  });

  if (types.length === 0) {
    return NextResponse.json({ items: [], localeUsed: null });
  }

  const items = types.map((t) => {
    const byLocale = new Map(
      t.translations.map((tr) => [
        tr.locale,
        {
          title: tr.title,
          subtitle: tr.subtitle ?? null,
          description: tr.description ?? null,
        },
      ])
    );
    const pickedLocale = localeOrder.find((loc) => byLocale.has(loc)) ?? null;
    const picked = pickedLocale ? byLocale.get(pickedLocale)! : null;

    const effectivePaymentPolicy = t.paymentPolicy ?? orgPaymentPolicy;
    const resolvedPriceCents =
      effectivePaymentPolicy === "FREE"
        ? null
        : t.priceCents ?? defaultPaymentCents;
    const resolvedCurrency =
      effectivePaymentPolicy === "FREE"
        ? null
        : t.currency ?? defaultCurrency;

    return {
      id: t.id,
      key: t.key,
      durationMin: t.durationMin,
      paymentPolicy: effectivePaymentPolicy,
      priceCents: resolvedPriceCents,
      currency: resolvedCurrency,
      modes: t.modes.map((m) => ({
        mode: m.mode,
        details: m.details ?? null,
      })),
      title: picked?.title ?? t.key,
      subtitle: picked?.subtitle ?? null,
      description: picked?.description ?? null,
      localeUsed: pickedLocale,
    };
  });

  return NextResponse.json({
    orgId,
    requestedLocale,
    orgDefaultLocale,
    paymentPolicy: orgPaymentPolicy,
    allowedCurrencies: settings?.allowedCurrencies ?? [],
    defaultCurrency: settings?.defaultCurrency ?? null,
    items,
  });
}
