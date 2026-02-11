import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const DEFAULT_TTL_MIN = 360; // 6 hours

type RatesMap = Record<string, number>;

function cleanCode(value: string) {
  return value.trim().toUpperCase();
}

export async function getExchangeRates(params: {
  base: string;
  symbols: string[];
  ttlMinutes?: number;
}) {
  const base = cleanCode(params.base || "EUR");
  const symbols = Array.from(
    new Set(params.symbols.map(cleanCode).filter(Boolean))
  ).filter((code) => code !== base);
  const ttlMinutes = params.ttlMinutes ?? DEFAULT_TTL_MIN;

  if (symbols.length === 0) {
    return { base, rates: {}, fetchedAt: null };
  }

  const cached = await prisma.exchangeRateCache.findFirst({
    where: { base },
  });

  const now = Date.now();
  const fresh =
    cached?.fetchedAt &&
    now - cached.fetchedAt.getTime() < ttlMinutes * 60 * 1000;

  if (cached && fresh) {
    return {
      base,
      rates: (cached.rates as RatesMap) ?? {},
      fetchedAt: cached.fetchedAt,
    };
  }

  const url = new URL("https://api.exchangerate.host/latest");
  url.searchParams.set("base", base);
  url.searchParams.set("symbols", symbols.join(","));

  let rates: RatesMap = {};
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`rate fetch failed: ${res.status}`);
    }
    const json = (await res.json()) as { rates?: RatesMap };
    rates = json?.rates ?? {};
  } catch {
    if (cached) {
      return {
        base,
        rates: (cached.rates as RatesMap) ?? {},
        fetchedAt: cached.fetchedAt,
      };
    }
    return { base, rates: {}, fetchedAt: null };
  }

  const fetchedAt = new Date();
  if (cached) {
    await prisma.exchangeRateCache.update({
      where: { id: cached.id },
      data: { rates, fetchedAt },
    });
  } else {
    await prisma.exchangeRateCache.create({
      data: {
        id: crypto.randomUUID(),
        base,
        rates,
        fetchedAt,
      },
    });
  }

  return { base, rates, fetchedAt };
}
