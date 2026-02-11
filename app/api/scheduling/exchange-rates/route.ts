import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { getExchangeRates } from "@/lib/exchange-rates";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
  const orgId = cleanString(url.searchParams.get("orgId"));
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const base = cleanString(url.searchParams.get("base") ?? "EUR");
  const overrideSymbols = cleanString(url.searchParams.get("symbols"));

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { allowedCurrencies: true, defaultCurrency: true },
  });

  const allowed = settings?.allowedCurrencies ?? [];
  const symbols =
    overrideSymbols?.length
      ? overrideSymbols.split(",").map((item) => item.trim().toUpperCase())
      : allowed;

  const data = await getExchangeRates({
    base: base || settings?.defaultCurrency || "EUR",
    symbols,
  });

  return NextResponse.json({
    base: data.base,
    rates: data.rates,
    fetchedAt: data.fetchedAt?.toISOString() ?? null,
    symbols,
  });
}
