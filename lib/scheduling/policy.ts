// lib/scheduling/policy.ts
import { prisma } from "@/lib/prisma";

export type ApprovalPolicy = "AUTO_APPROVE" | "REQUIRES_APPROVAL";
export type PaymentPolicy = "FREE" | "PAID";

type OrgPolicies = {
  approvalPolicy: ApprovalPolicy;
  paymentPolicy: PaymentPolicy;
  notifyEmails: string[] | null;
  defaultTz: string;
  defaultLocale: string;
  defaultPaymentCents: number | null;
  defaultCurrency: string | null;
  maxDailyBookings: number;
};

export async function getOrgPolicies(orgId: string): Promise<OrgPolicies> {
  const fallbackPaymentCents = Number(
    process.env.DEFAULT_PAYMENT_CENTS ?? "15000"
  );
  const fallbackCurrency = (process.env.DEFAULT_PAYMENT_CURRENCY ?? "EUR").trim();
  const fallbackCurrencyValue = fallbackCurrency || null;

  const row = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: {
      approvalPolicy: true,
      paymentPolicy: true,
      notifyEmails: true,
      defaultTz: true,
      defaultLocale: true,
      defaultPaymentCents: true,
      defaultCurrency: true,
      maxDailyBookings: true,
    },
  });

  // Settings row should exist (seed), but fallback safely:
  return {
    approvalPolicy: (row?.approvalPolicy ??
      "REQUIRES_APPROVAL") as ApprovalPolicy,
    paymentPolicy:
      row?.paymentPolicy === "FREE" ? "FREE" : "PAID",
    notifyEmails: row?.notifyEmails ?? null,
    defaultTz: row?.defaultTz ?? "Europe/Luxembourg",
    defaultLocale: row?.defaultLocale ?? "en",
    defaultPaymentCents:
      typeof row?.defaultPaymentCents === "number"
        ? row.defaultPaymentCents
        : Number.isFinite(fallbackPaymentCents)
          ? fallbackPaymentCents
          : null,
    defaultCurrency: row?.defaultCurrency ?? fallbackCurrencyValue,
    maxDailyBookings:
      typeof row?.maxDailyBookings === "number" && row.maxDailyBookings > 0
        ? row.maxDailyBookings
        : 5,
  };
}
