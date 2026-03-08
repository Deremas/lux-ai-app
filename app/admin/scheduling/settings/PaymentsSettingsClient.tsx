"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "@/components/scheduling/SectionCard";
import SettingsFormActions from "@/components/scheduling/SettingsFormActions";
import { useUnsavedChangesPrompt } from "@/hooks/use-unsaved-changes";

type Props = {
  orgId?: string;
};

type Settings = {
  paymentPolicy: "FREE" | "PAY_BEFORE_CONFIRM" | "APPROVE_THEN_PAY";
  defaultPaymentCents: number | null;
  defaultCurrency: string | null;
  allowedCurrencies: string | null;
};

const PAYMENT_TIERS = ["FREE", "PAID"] as const;
type PaymentTier = (typeof PAYMENT_TIERS)[number];

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function snapshotFrom(settings: Settings, paymentAmount: string) {
  return JSON.stringify({
    paymentPolicy: settings.paymentPolicy,
    paymentAmount,
    defaultCurrency: settings.defaultCurrency ?? "",
    allowedCurrencies: settings.allowedCurrencies ?? "",
  });
}

export default function PaymentsSettingsClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [lastPaidPolicy, setLastPaidPolicy] =
    useState<Settings["paymentPolicy"]>("PAY_BEFORE_CONFIRM");

  const currencyOptions = useMemo(() => {
    const fromForm = form?.allowedCurrencies
      ? form.allowedCurrencies
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
      : [];
    const fallback = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD"];
    const merged = Array.from(new Set([...fromForm, ...fallback]));
    return merged.length ? merged : fallback;
  }, [form?.allowedCurrencies]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = orgId
      ? `/api/scheduling/admin/settings?orgId=${orgId}`
      : "/api/scheduling/admin/settings";

    fetch(url, { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load settings");
          return;
        }
        const next = data?.settings as Settings | undefined;
        if (next) {
          setForm(next);
          const value =
            next.defaultPaymentCents === null || next.defaultPaymentCents === undefined
              ? ""
              : String(next.defaultPaymentCents / 100);
          setPaymentAmount(value);
          setInitialSnapshot(snapshotFrom(next, value));
        } else {
          setForm(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  useEffect(() => {
    if (form?.paymentPolicy && form.paymentPolicy !== "FREE") {
      setLastPaidPolicy(form.paymentPolicy);
    }
  }, [form?.paymentPolicy]);

  const snapshot = useMemo(
    () => (form ? snapshotFrom(form, paymentAmount) : ""),
    [form, paymentAmount]
  );
  const isDirty = Boolean(form && snapshot !== initialSnapshot);
  const paymentTier: PaymentTier | null = form
    ? form.paymentPolicy === "FREE"
      ? "FREE"
      : "PAID"
    : null;

  useUnsavedChangesPrompt(isDirty);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);

    try {
      const amountNumber = paymentAmount ? Number(paymentAmount) : NaN;
      const cents = Number.isFinite(amountNumber)
        ? Math.round(amountNumber * 100)
        : null;
      const res = await fetch("/api/scheduling/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(orgId ? { orgId } : {}),
          paymentPolicy: form.paymentPolicy,
          defaultPaymentCents: cents,
          defaultCurrency: cleanString(form.defaultCurrency ?? ""),
          allowedCurrencies: cleanString(form.allowedCurrencies ?? ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save settings");
        return;
      }
      const next = data?.settings as Settings | undefined;
      if (next) {
        setForm(next);
        const value =
          next.defaultPaymentCents === null || next.defaultPaymentCents === undefined
            ? ""
            : String(next.defaultPaymentCents / 100);
        setPaymentAmount(value);
        setInitialSnapshot(snapshotFrom(next, value));
      }
      toast.success("Payment settings saved.");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyDefaults() {
    if (!orgId) return;
    setApplyLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/meeting-types/apply-payment-defaults?orgId=${orgId}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to apply defaults");
        return;
      }
      toast.success(`Applied defaults to ${data?.updated ?? 0} meeting types.`);
    } catch {
      setError("Failed to apply defaults");
    } finally {
      setApplyLoading(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage payments settings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required to update org policies.
          </p>
          <Button className="mt-6" onClick={() => signIn()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Scheduling Admin
        </p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Payments
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure pricing defaults and currency rules. Provider connections live
          under Integrations.
        </p>
      </div>

      {loading && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          Loading settings...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {form && (
        <>
          <div className="grid gap-6">
            <SectionCard>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  Payment policy
                </p>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Policy
                  </label>
                  <select
                    className="mt-2 flex h-10 w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-gray-900 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
                    value={paymentTier ?? "FREE"}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              paymentPolicy:
                                (e.target.value as PaymentTier) === "FREE"
                                  ? "FREE"
                                  : prev.paymentPolicy !== "FREE"
                                  ? prev.paymentPolicy
                                  : lastPaidPolicy,
                            }
                          : prev
                      )
                    }
                  >
                    {PAYMENT_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier === "FREE" ? "Free booking" : "Paid booking"}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Paid bookings require payment. Existing timing rules are
                    preserved.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  Pricing defaults
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Default price
                    </label>
                    <Input
                      className="mt-2"
                      type="number"
                      min={0}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="150.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Amount in currency units (e.g. 150.00).
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Default currency
                    </label>
                    <Input
                      className="mt-2"
                      list="currency-options"
                      value={form.defaultCurrency ?? ""}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, defaultCurrency: e.target.value } : prev
                        )
                      }
                      placeholder="EUR"
                    />
                    <datalist id="currency-options">
                      {currencyOptions.map((currency) => (
                        <option key={currency} value={currency} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Allowed currencies
                  </label>
                  <Textarea
                    className="mt-2"
                    value={form.allowedCurrencies ?? ""}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, allowedCurrencies: e.target.value } : prev
                      )
                    }
                    placeholder="EUR, USD, GBP"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Comma-separated ISO currency codes shown in meeting types.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs text-gray-600 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
            <p className="font-semibold text-gray-700 dark:text-gray-200">
              About defaults
            </p>
            <p className="mt-1">
              Applying payment defaults fills in missing price or currency on
              meeting types. It does not overwrite meeting types that already
              have a price and currency set.
            </p>
          </div>

          <SettingsFormActions
            isDirty={isDirty}
            saving={saving}
            onSave={handleSave}
            secondaryAction={
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyDefaults}
                disabled={applyLoading}
              >
                {applyLoading ? "Applying..." : "Apply payment defaults"}
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}
