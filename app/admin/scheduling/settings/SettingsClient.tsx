"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  orgId?: string;
};

type Settings = {
  approvalPolicy: "AUTO_APPROVE" | "REQUIRES_APPROVAL";
  paymentPolicy: "FREE" | "PAY_BEFORE_CONFIRM" | "APPROVE_THEN_PAY";
  notifyEmails: string | null;
  notifyWhatsapp: string | null;
  notifyEmailEnabled: boolean;
  notifyWhatsappEnabled: boolean;
  notifyCalendarEnabled: boolean;
  defaultTz: string;
  defaultLocale: "en" | "fr" | "de" | "lb";
  workingHoursJson: string | null;
  defaultPaymentCents: number | null;
  defaultCurrency: string | null;
  allowedCurrencies: string | null;
  maxDailyBookings: number | null;
};

type SecretStatus = {
  metaTokenConfigured: boolean;
  metaPhoneConfigured: boolean;
  metaConfigured: boolean;
  twilioSidConfigured: boolean;
  twilioTokenConfigured: boolean;
  twilioFromConfigured: boolean;
  twilioConfigured: boolean;
  telnyxApiKeyConfigured: boolean;
  telnyxFromConfigured: boolean;
  telnyxConfigured: boolean;
};

const APPROVAL_OPTIONS: Settings["approvalPolicy"][] = [
  "REQUIRES_APPROVAL",
  "AUTO_APPROVE",
];
const PAYMENT_OPTIONS: Settings["paymentPolicy"][] = [
  "FREE",
  "PAY_BEFORE_CONFIRM",
  "APPROVE_THEN_PAY",
];
const LOCALES: Settings["defaultLocale"][] = ["en", "fr", "de", "lb"];
const DEFAULT_WORKING_HOURS = JSON.stringify(
  {
    timezone: "Europe/Luxembourg",
    slotStepMin: 60,
    bufferMin: 0,
    week: {
      mon: [{ start: "08:00", end: "17:00" }],
      tue: [{ start: "08:00", end: "17:00" }],
      wed: [{ start: "08:00", end: "17:00" }],
      thu: [{ start: "08:00", end: "17:00" }],
      fri: [{ start: "08:00", end: "17:00" }],
      sat: [],
      sun: [],
    },
  },
  null,
  2
);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function SettingsClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [secretStatus, setSecretStatus] = useState<SecretStatus | null>(null);
  const [metaTokenInput, setMetaTokenInput] = useState("");
  const [metaPhoneIdInput, setMetaPhoneIdInput] = useState("");
  const [twilioSidInput, setTwilioSidInput] = useState("");
  const [twilioAuthInput, setTwilioAuthInput] = useState("");
  const [twilioFromInput, setTwilioFromInput] = useState("");
  const [telnyxApiKeyInput, setTelnyxApiKeyInput] = useState("");
  const [telnyxFromInput, setTelnyxFromInput] = useState("");
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [tzQuery, setTzQuery] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [tzHighlight, setTzHighlight] = useState(0);
  const tzRef = useRef<HTMLDivElement | null>(null);
  const tzListRef = useRef<HTMLDivElement | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<"email" | "whatsapp" | null>(
    null
  );

  const timezones = useMemo<string[]>(() => {
    const fallback: string[] = [
      "UTC",
      "Africa/Addis_Ababa",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Zurich",
      "Europe/Luxembourg",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Singapore",
      "Asia/Tokyo",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
    ];

    const anyIntl = Intl as unknown as {
      supportedValuesOf?: (k: string) => string[];
    };

    if (typeof anyIntl?.supportedValuesOf === "function") {
      try {
        const list = anyIntl.supportedValuesOf("timeZone");
        return list.length ? list : fallback;
      } catch {
        return fallback;
      }
    }

    return fallback;
  }, []);
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
  const filteredTimezones = useMemo(() => {
    const query = tzQuery.trim().toLowerCase();
    if (!query) return timezones;
    return timezones.filter((zone) => zone.toLowerCase().includes(query));
  }, [timezones, tzQuery]);
  useEffect(() => {
    if (!tzOpen) return;
    const current = form?.defaultTz ?? "";
    const idx = filteredTimezones.indexOf(current);
    setTzHighlight(idx >= 0 ? idx : 0);
  }, [tzOpen, filteredTimezones, form?.defaultTz]);
  useEffect(() => {
    if (!tzOpen || filteredTimezones.length === 0) return;
    const el = tzListRef.current?.querySelector(
      `[data-tz-index="${tzHighlight}"]`
    );
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [tzOpen, tzHighlight, filteredTimezones.length]);
  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!tzRef.current) return;
      if (!tzRef.current.contains(event.target as Node)) {
        setTzOpen(false);
      }
    }
    if (tzOpen) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [tzOpen]);
  const handleTzKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!tzOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setTzOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setTzHighlight((prev) =>
        filteredTimezones.length === 0 ? 0 : (prev + 1) % filteredTimezones.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setTzHighlight((prev) =>
        filteredTimezones.length === 0
          ? 0
          : (prev - 1 + filteredTimezones.length) % filteredTimezones.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const zone = filteredTimezones[tzHighlight];
      if (zone) {
        setForm((prev) => (prev ? { ...prev, defaultTz: zone } : prev));
        setTzQuery("");
        setTzOpen(false);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setTzOpen(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = orgId
      ? `/api/scheduling/admin/settings?orgId=${orgId}`
      : "/api/scheduling/admin/settings";

    fetch(url, {
      cache: "no-store",
    })
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
        setStripeConfigured(Boolean(data?.stripeConfigured));
        setSecretStatus((data?.secretStatus ?? null) as SecretStatus | null);
        if (next) {
          setForm({
            ...next,
            workingHoursJson: next.workingHoursJson ?? DEFAULT_WORKING_HOURS,
          });
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
    if (!form) return;
    if (form.defaultPaymentCents === null || form.defaultPaymentCents === undefined) {
      setPaymentAmount("");
      return;
    }
    const value = form.defaultPaymentCents / 100;
    setPaymentAmount(Number.isFinite(value) ? String(value) : "");
  }, [form?.defaultPaymentCents]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

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
          approvalPolicy: form.approvalPolicy,
          paymentPolicy: form.paymentPolicy,
          defaultTz: cleanString(form.defaultTz),
          defaultLocale: form.defaultLocale,
          notifyEmails: cleanString(form.notifyEmails ?? ""),
          notifyWhatsapp: cleanString(form.notifyWhatsapp ?? ""),
          notifyEmailEnabled: form.notifyEmailEnabled,
          notifyWhatsappEnabled: form.notifyWhatsappEnabled,
          notifyCalendarEnabled: form.notifyCalendarEnabled,
          workingHoursJson: cleanString(form.workingHoursJson ?? ""),
          defaultPaymentCents: cents,
          defaultCurrency: cleanString(form.defaultCurrency ?? ""),
          allowedCurrencies: cleanString(form.allowedCurrencies ?? ""),
          maxDailyBookings: form.maxDailyBookings ?? null,
          metaWhatsappToken: cleanString(metaTokenInput),
          metaWhatsappPhoneId: cleanString(metaPhoneIdInput),
          twilioAccountSid: cleanString(twilioSidInput),
          twilioAuthToken: cleanString(twilioAuthInput),
          twilioWhatsappFrom: cleanString(twilioFromInput),
          telnyxApiKey: cleanString(telnyxApiKeyInput),
          telnyxWhatsappFrom: cleanString(telnyxFromInput),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save settings");
        return;
      }

      setForm(data?.settings ?? form);
      if (typeof data?.stripeConfigured === "boolean") {
        setStripeConfigured(data.stripeConfigured);
      }
      if (data?.secretStatus) {
        setSecretStatus(data.secretStatus as SecretStatus);
      }
      setMetaTokenInput("");
      setMetaPhoneIdInput("");
      setTwilioSidInput("");
      setTwilioAuthInput("");
      setTwilioFromInput("");
      setTelnyxApiKeyInput("");
      setTelnyxFromInput("");
      setSuccess("Settings saved.");
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
    setSuccess(null);
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
      setSuccess(`Applied defaults to ${data?.updated ?? 0} meeting types.`);
    } catch {
      setError("Failed to apply defaults");
    } finally {
      setApplyLoading(false);
    }
  }

  async function handleTest(channel: "email" | "whatsapp") {
    if (!orgId) {
      setTestError("Missing orgId");
      return;
    }
    setTestingChannel(channel);
    setTestError(null);
    setTestStatus(null);
    try {
      const res = await fetch("/api/scheduling/admin/notifications/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId, channel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestError(data?.error ?? "Test failed");
        return;
      }
      setTestStatus(
        channel === "email"
          ? "Test email sent."
          : "Test WhatsApp message sent."
      );
    } catch {
      setTestError("Test failed");
    } finally {
      setTestingChannel(null);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage scheduling settings
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
      <div className="space-y-8">
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Scheduling settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Control approval, payment, and notification defaults.
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Open times
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Define your weekly availability with the working hours JSON.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="#working-hours">Edit open times</a>
            </Button>
          </div>
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

        {success && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {form && (
          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Approval policy
              </label>
              <select
                className="mt-2 flex h-10 w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-gray-900 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
                value={form.approvalPolicy}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, approvalPolicy: e.target.value as Settings["approvalPolicy"] }
                      : prev
                  )
                }
              >
                {APPROVAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "AUTO_APPROVE" ? "Auto approve" : "Require approval"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Payment policy
              </label>
              <select
                className="mt-2 flex h-10 w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-gray-900 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
                value={form.paymentPolicy}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, paymentPolicy: e.target.value as Settings["paymentPolicy"] }
                      : prev
                  )
                }
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "FREE"
                      ? "Free booking"
                      : opt === "PAY_BEFORE_CONFIRM"
                      ? "Pay before confirm"
                      : "Approve then pay"}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Stripe status:{" "}
                <span className="font-semibold">
                  {stripeConfigured ? "Configured" : "Missing STRIPE_SECRET_KEY"}
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Max bookings per user per day
              </label>
              <Input
                className="mt-2"
                type="number"
                min={1}
                max={50}
                value={form.maxDailyBookings ?? 5}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          maxDailyBookings: Number(e.target.value || 0),
                        }
                      : prev
                  )
                }
                placeholder="5"
              />
              <p className="mt-1 text-xs text-gray-500">
                Limits how many bookings a customer can create per day (based on
                their local day).
              </p>
            </div>

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

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Default timezone
              </label>
              <div className="relative mt-2" ref={tzRef}>
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-input bg-white px-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={() => setTzOpen((prev) => !prev)}
                  onKeyDown={handleTzKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={tzOpen}
                >
                  <span className="truncate">{form.defaultTz}</span>
                  <span aria-hidden>▾</span>
                </button>
                {tzOpen && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
                    <input
                      className="h-9 w-full rounded-md border border-white/70 bg-white/90 px-3 text-sm text-gray-900 leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-gray-100"
                      value={tzQuery}
                      onChange={(e) => setTzQuery(e.target.value)}
                      placeholder="Search timezone"
                      autoFocus
                      onKeyDown={handleTzKeyDown}
                    />
                    <div
                      ref={tzListRef}
                      className="mt-2 max-h-60 overflow-auto rounded-md border border-gray-100"
                    >
                      {filteredTimezones.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No matches
                        </div>
                      ) : (
                        filteredTimezones.map((zone, index) => (
                          <button
                            key={zone}
                            type="button"
                            data-tz-index={index}
                            className={[
                              "w-full px-3 py-2 text-left text-sm hover:bg-gray-100",
                              zone === form.defaultTz ? "font-semibold" : "",
                              index === tzHighlight ? "bg-gray-100" : "",
                            ].join(" ")}
                            onClick={() => {
                              setForm((prev) =>
                                prev ? { ...prev, defaultTz: zone } : prev
                              );
                              setTzQuery("");
                              setTzOpen(false);
                            }}
                          >
                            {zone}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Default locale
              </label>
              <select
                className="mt-2 flex h-10 w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-gray-900 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
                value={form.defaultLocale}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, defaultLocale: e.target.value as Settings["defaultLocale"] }
                      : prev
                  )
                }
              >
                {LOCALES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Notification recipients
              </label>
              <Textarea
                className="mt-2"
                value={form.notifyEmails ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, notifyEmails: e.target.value } : prev
                  )
                }
                placeholder="admin@example.com, team@example.com"
              />
              <p className="mt-2 text-xs text-gray-500">
                Comma-separated list of emails.
              </p>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Notification channels
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.notifyEmailEnabled}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, notifyEmailEnabled: e.target.checked } : prev
                      )
                    }
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.notifyWhatsappEnabled}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, notifyWhatsappEnabled: e.target.checked }
                          : prev
                      )
                    }
                  />
                  WhatsApp
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.notifyCalendarEnabled}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, notifyCalendarEnabled: e.target.checked }
                          : prev
                      )
                    }
                  />
                  Calendar invites
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                WhatsApp recipients
              </label>
              <Textarea
                className="mt-2"
                value={form.notifyWhatsapp ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, notifyWhatsapp: e.target.value } : prev
                  )
                }
                placeholder="+352691833894, +251913226793"
              />
              <p className="mt-2 text-xs text-gray-500">
                Comma-separated E.164 numbers for admin/staff notifications.
              </p>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Provider secrets
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Leave blank to keep the current value. Secrets are encrypted in the
                database using APP_SECRET_KEY.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Meta WhatsApp
                    </h3>
                    <span className="text-xs font-semibold text-gray-600">
                      {secretStatus?.metaConfigured ? "Configured" : "Not set"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Access token
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={metaTokenInput}
                        onChange={(e) => setMetaTokenInput(e.target.value)}
                        placeholder="Paste token"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Phone number ID
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={metaPhoneIdInput}
                        onChange={(e) => setMetaPhoneIdInput(e.target.value)}
                        placeholder="Meta phone ID"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Twilio WhatsApp
                    </h3>
                    <span className="text-xs font-semibold text-gray-600">
                      {secretStatus?.twilioConfigured ? "Configured" : "Not set"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Account SID
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={twilioSidInput}
                        onChange={(e) => setTwilioSidInput(e.target.value)}
                        placeholder="ACxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Auth token
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={twilioAuthInput}
                        onChange={(e) => setTwilioAuthInput(e.target.value)}
                        placeholder="Twilio auth token"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        WhatsApp from
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={twilioFromInput}
                        onChange={(e) => setTwilioFromInput(e.target.value)}
                        placeholder="+14155238886"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Telnyx WhatsApp
                    </h3>
                    <span className="text-xs font-semibold text-gray-600">
                      {secretStatus?.telnyxConfigured ? "Configured" : "Not set"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        API key
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={telnyxApiKeyInput}
                        onChange={(e) => setTelnyxApiKeyInput(e.target.value)}
                        placeholder="Telnyx API key"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        WhatsApp from
                      </label>
                      <Input
                        className="mt-2"
                        type="password"
                        value={telnyxFromInput}
                        onChange={(e) => setTelnyxFromInput(e.target.value)}
                        placeholder="+14155238886"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Test notifications
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Sends a test message to the configured recipients.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={testingChannel === "email"}
                  onClick={() => handleTest("email")}
                >
                  {testingChannel === "email" ? "Sending..." : "Test email"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={testingChannel === "whatsapp"}
                  onClick={() => handleTest("whatsapp")}
                >
                  {testingChannel === "whatsapp"
                    ? "Sending..."
                    : "Test WhatsApp"}
                </Button>
              </div>
              {testStatus && (
                <div className="mt-3 text-xs text-emerald-700">{testStatus}</div>
              )}
              {testError && (
                <div className="mt-3 text-xs text-red-700">{testError}</div>
              )}
            </div>

            <div id="working-hours" className="scroll-mt-24">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Open times (working hours JSON)
              </label>
              <Textarea
                className="mt-2 min-h-[220px] font-mono text-xs"
                value={form.workingHoursJson ?? DEFAULT_WORKING_HOURS}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, workingHoursJson: e.target.value } : prev
                  )
                }
              />
              <p className="mt-2 text-xs text-gray-500">
                Used when a staff calendar is missing or when you apply defaults.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyDefaults}
                disabled={applyLoading}
              >
                {applyLoading ? "Applying..." : "Apply payment defaults"}
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
