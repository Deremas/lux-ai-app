"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Badge from "@/components/scheduling/Badge";
import SectionCard from "@/components/scheduling/SectionCard";

type Props = {
  orgId: string;
};

type MeetingType = {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  durationMin: number;
  paymentPolicy: PaymentPolicy | null;
  priceCents: number | null;
  currency: string | null;
  isActive: boolean;
  modes: string[];
  modeDetails?: Record<string, ModeDetails>;
  locale: string;
};

const MODES = ["google_meet", "zoom", "phone", "in_person"] as const;
const DURATION_OPTIONS = [30, 45, 60, 90, 120] as const;
const PAYMENT_POLICIES = [
  "FREE",
  "PAY_BEFORE_CONFIRM",
  "APPROVE_THEN_PAY",
] as const;
const PAYMENT_TIERS = ["FREE", "PAID"] as const;

type PaymentPolicy = (typeof PAYMENT_POLICIES)[number];
type PaymentTier = (typeof PAYMENT_TIERS)[number];
type ModeDetails = {
  label?: string;
  description?: string;
  link?: string;
};

type FormState = {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  durationMin: number;
  paymentPolicy: PaymentPolicy;
  priceAmount: string;
  currency: string;
  modes: string[];
  modeDetails: Record<string, ModeDetails>;
  isActive: boolean;
};

function emptyForm(): FormState {
  return {
    title: "",
    subtitle: "",
    description: "",
    durationMin: 60,
    paymentPolicy: "FREE",
    priceAmount: "",
    currency: "EUR",
    modes: ["google_meet"],
    modeDetails: {},
    isActive: true,
  };
}

function formatMoney(priceCents?: number | null, currency?: string | null) {
  if (!priceCents || !currency) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

function formatPaymentPolicy(policy: PaymentPolicy | null) {
  if (!policy) return "Org default";
  if (policy === "FREE") return "Free";
  return "Paid";
}

function formatModeLabel(mode: string) {
  switch (mode) {
    case "google_meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "phone":
      return "Phone";
    case "in_person":
      return "In person";
    default:
      return mode.replace(/[_-]+/g, " ");
  }
}

export default function MeetingTypesClient({ orgId }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [lastPaidPolicy, setLastPaidPolicy] =
    useState<PaymentPolicy>("PAY_BEFORE_CONFIRM");
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MeetingType | null>(null);
  const modalOpen = editorOpen || Boolean(deleteTarget);
  const [locale] = useState(() => {
    if (typeof document !== "undefined") {
      const lang =
        document.documentElement.lang ||
        (typeof navigator !== "undefined" ? navigator.language : "en");
      return lang.split("-")[0] || "en";
    }
    return "en";
  });
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([
    "EUR",
    "USD",
    "GBP",
    "CHF",
    "CAD",
    "AUD",
  ]);

  useEffect(() => {
    if (!modalOpen) return;
    const html = document.documentElement;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL(
      "/api/scheduling/admin/meeting-types",
      window.location.origin
    );
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("locale", locale);

    const settingsUrl = `/api/scheduling/admin/settings?orgId=${orgId}`;

    Promise.all([
      fetch(url.toString(), { cache: "no-store" }).then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      })),
      fetch(settingsUrl, { cache: "no-store" }).then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      })),
    ])
      .then(([typesRes, settingsRes]) => {
        if (cancelled) return;
        if (!typesRes.ok) {
          setError(typesRes.data?.error ?? "Failed to load meeting types");
          return;
        }
        const list = (typesRes.data?.items ?? []) as MeetingType[];
        setItems(list);
        if (settingsRes.ok) {
          const raw = settingsRes.data?.settings?.allowedCurrencies ?? "";
          const parsed = typeof raw === "string"
            ? raw
                .split(",")
                .map((item: string) => item.trim().toUpperCase())
                .filter(Boolean)
            : [];
          if (parsed.length > 0) {
            setCurrencyOptions((prev) => Array.from(new Set([...parsed, ...prev])));
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load meeting types");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status, locale]);

  useEffect(() => {
    if (form.paymentPolicy !== "FREE") {
      setLastPaidPolicy(form.paymentPolicy);
    }
  }, [form.paymentPolicy]);

  const isEditing = Boolean(form.id);

  function resetForm(options?: { clearFeedback?: boolean }) {
    const shouldClear = options?.clearFeedback ?? true;
    setForm(emptyForm());
    if (shouldClear) {
      setSuccess(null);
      setError(null);
    }
  }

  function loadForEdit(item: MeetingType) {
    setForm({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle ?? "",
      description: item.description ?? "",
      durationMin: item.durationMin,
      paymentPolicy: item.paymentPolicy ?? "FREE",
      priceAmount: item.priceCents ? String(item.priceCents / 100) : "",
      currency: item.currency ?? "EUR",
      modes: item.modes ?? [],
      modeDetails: item.modeDetails ?? {},
      isActive: item.isActive,
    });
  }

  function openCreateEditor() {
    resetForm();
    setEditorOpen(true);
  }

  function openEditEditor(item: MeetingType) {
    setError(null);
    setSuccess(null);
    loadForEdit(item);
    setEditorOpen(true);
  }

  function handleEditorOpenChange(open: boolean) {
    setEditorOpen(open);
    if (!open) {
      resetForm();
    }
  }

  function openDeleteDialog(item: MeetingType) {
    setDeleteTarget(item);
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
  }

  async function handleDeleteConfirmed() {
    if (!orgId || !deleteTarget) return;
    const item = deleteTarget;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/meeting-types/${item.id}?orgId=${orgId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to delete meeting type");
        return;
      }
      if (data?.archived) {
        setSuccess(
          "Meeting type archived because it has existing bookings."
        );
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, isActive: false } : entry
          )
        );
      } else {
        setSuccess("Meeting type deleted.");
        setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      }
      if (form.id === item.id) {
        resetForm();
      }
    } catch {
      setError("Failed to delete meeting type");
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }

  async function handleToggleActive(item: MeetingType) {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/meeting-types/${item.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orgId,
            key: item.title,
            title: item.title,
            subtitle: item.subtitle ?? null,
            description: item.description ?? null,
            durationMin: item.durationMin,
            paymentPolicy: item.paymentPolicy ?? "FREE",
            priceCents: item.priceCents ?? null,
            currency: item.currency ?? null,
            modes: item.modes ?? [],
            modeDetails: item.modeDetails ?? {},
            isActive: !item.isActive,
            locale,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to update meeting type");
        return;
      }
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, isActive: !item.isActive } : entry
        )
      );
      setSuccess(item.isActive ? "Meeting type deactivated." : "Meeting type activated.");
    } catch {
      setError("Failed to update meeting type");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const amountNumber = form.priceAmount ? Number(form.priceAmount) : NaN;
    const priceCents = Number.isFinite(amountNumber)
      ? Math.round(amountNumber * 100)
      : null;
    const titleValue = form.title.trim();
    const payload = {
      orgId,
      key: titleValue,
      title: titleValue,
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      durationMin: form.durationMin,
      paymentPolicy: form.paymentPolicy,
      priceCents,
      currency: form.currency.trim() || null,
      modes: form.modes,
      modeDetails: form.modeDetails,
      isActive: form.isActive,
      locale,
    };

    try {
      const res = await fetch(
        form.id
          ? `/api/scheduling/admin/meeting-types/${form.id}`
          : "/api/scheduling/admin/meeting-types",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save meeting type");
        return;
      }

      setSuccess(form.id ? "Meeting type updated." : "Meeting type created.");
      resetForm({ clearFeedback: false });
      setEditorOpen(false);
      const refetch = await fetch(
        `/api/scheduling/admin/meeting-types?orgId=${orgId}`,
        { cache: "no-store" }
      );
      const refetchData = await refetch.json().catch(() => ({}));
      setItems((refetchData?.items ?? []) as MeetingType[]);
    } catch {
      setError("Failed to save meeting type");
    } finally {
      setSaving(false);
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }, [items]);

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage meeting types
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required.
          </p>
          <Button className="mt-6" onClick={() => signIn()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const disabled =
    !form.title.trim() ||
    form.modes.length === 0 ||
    form.durationMin < 15 ||
    form.durationMin > 240 ||
    form.durationMin % 15 !== 0 ||
    (form.paymentPolicy !== "FREE" &&
      (!form.priceAmount.trim() || !form.currency.trim()));

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Meeting types
            </h1>
            <Button size="sm" onClick={openCreateEditor}>
              New meeting type
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Create and update booking types used across the scheduling system.
          </p>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Loading meeting types...
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

        <div className="mt-8">
          <SectionCard className="p-0">
            {items.length > 0 && (
              <div className="px-6 pt-5 text-sm text-gray-500 dark:text-gray-400">
                {items.length} types
              </div>
            )}
            <div className="p-4 sm:p-6">
              {sortedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-gray-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-gray-400">
                  No meeting types yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedItems.map((item) => {
                    const policyLabel = formatPaymentPolicy(item.paymentPolicy);
                    const priceLabel = formatMoney(item.priceCents, item.currency);
                    const showPrice =
                      item.priceCents !== null && item.currency !== null;
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                {item.title}
                              </h4>
                              <Badge variant={item.isActive ? "default" : "secondary"}>
                                {item.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {policyLabel}
                              </span>
                              {showPrice && (
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                  {priceLabel}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.subtitle}
                              </p>
                            )}
                            {item.description && (
                              <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                {item.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span>{item.durationMin} min</span>
                              <span>
                                {item.modes?.length
                                  ? item.modes.map(formatModeLabel).join(" · ")
                                  : "No modes"}
                              </span>
                            </div>
                          </div>
                          <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditEditor(item)}
                              className="shrink-0"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => handleToggleActive(item)}
                              className="shrink-0"
                            >
                              {item.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={saving}
                              onClick={() => openDeleteDialog(item)}
                              className="shrink-0"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <Dialog open={editorOpen} onOpenChange={handleEditorOpenChange}>
          <DialogContent className="w-[min(980px,94vw)] max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-0 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="flex max-h-[85vh] flex-col">
              <DialogHeader className="space-y-2 border-b border-white/70 px-6 pb-4 pt-5 pr-14 text-left dark:border-slate-700/60">
                <DialogTitle>
                  {isEditing ? "Edit meeting type" : "Create meeting type"}
                </DialogTitle>
                <DialogDescription>
                  Define how customers can book this session.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Title
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Subheading
                    </label>
                    <Input
                      value={form.subtitle}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      placeholder="Optional short subtitle"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Description
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Duration
                    </label>
                    <Input
                      type="number"
                      min={15}
                      max={240}
                      step={15}
                      list="meeting-duration-options"
                      value={form.durationMin}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          durationMin: Number(e.target.value || 0),
                        }))
                      }
                      placeholder="60"
                    />
                    <datalist id="meeting-duration-options">
                      {DURATION_OPTIONS.map((minutes) => (
                        <option key={minutes} value={minutes} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-gray-500">
                      Duration in minutes (15–240, steps of 15).
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Payment policy
                    </label>
                    <select
                      className="mt-1 h-9 w-full rounded-lg border border-white/70 bg-white/80 px-3 text-sm text-gray-900 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
                      value={form.paymentPolicy === "FREE" ? "FREE" : "PAID"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          paymentPolicy:
                            (e.target.value as PaymentTier) === "FREE"
                              ? "FREE"
                              : prev.paymentPolicy !== "FREE"
                              ? prev.paymentPolicy
                              : lastPaidPolicy,
                        }))
                      }
                    >
                      {PAYMENT_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier === "FREE" ? "Free" : "Paid"}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Paid bookings follow your org payment timing rules.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Price
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.priceAmount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            priceAmount: e.target.value,
                          }))
                        }
                        placeholder="150.00"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Amount in currency units (e.g. 150.00).
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Currency
                      </label>
                      <Input
                        list="meeting-currency-options"
                        value={form.currency}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            currency: e.target.value,
                          }))
                        }
                        placeholder="EUR"
                      />
                      <datalist id="meeting-currency-options">
                        {currencyOptions.map((currency) => (
                          <option key={currency} value={currency} />
                        ))}
                      </datalist>
                      {form.paymentPolicy === "FREE" && (
                        <p className="mt-1 text-xs text-gray-500">
                          Saved for later if payments are currently disabled.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Modes
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MODES.map((mode) => (
                        <label
                          key={mode}
                          className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={form.modes.includes(mode)}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                modes: e.target.checked
                                  ? [...prev.modes, mode]
                                  : prev.modes.filter((m) => m !== mode),
                                modeDetails: e.target.checked
                                  ? prev.modeDetails
                                  : Object.fromEntries(
                                      Object.entries(prev.modeDetails).filter(
                                        ([key]) => key !== mode
                                      )
                                    ),
                              }))
                            }
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                    {form.modes.length > 0 && (
                      <div className="mt-4 space-y-3 rounded-xl border border-white/70 bg-white/80 p-3 text-xs text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                          Mode details
                        </p>
                        {form.modes.map((mode) => {
                          const details = form.modeDetails[mode] ?? {};
                          return (
                            <div key={mode} className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {mode}
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  Label (optional)
                                </label>
                                <Input
                                  value={details.label ?? ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      modeDetails: {
                                        ...prev.modeDetails,
                                        [mode]: {
                                          ...prev.modeDetails[mode],
                                          label: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="e.g. Google Meet (preferred)"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  Join link (optional)
                                </label>
                                <Input
                                  value={details.link ?? ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      modeDetails: {
                                        ...prev.modeDetails,
                                        [mode]: {
                                          ...prev.modeDetails[mode],
                                          link: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="https://..."
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  Mode description (optional)
                                </label>
                                <Textarea
                                  value={details.description ?? ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      modeDetails: {
                                        ...prev.modeDetails,
                                        [mode]: {
                                          ...prev.modeDetails[mode],
                                          description: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Short guidance shown to the customer."
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleEditorOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={saving || disabled}>
                      {saving ? "Saving..." : isEditing ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) closeDeleteDialog();
          }}
        >
          <DialogContent className="max-w-md rounded-2xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle>Delete meeting type</DialogTitle>
              <DialogDescription>
                This removes the meeting type from active use. Existing bookings or
                recordings remain safe; if any exist, the type will be archived instead
                of deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              You are about to delete{" "}
              <span className="font-semibold">
                {deleteTarget?.title ?? "this meeting type"}
              </span>
              .
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeDeleteDialog} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirmed}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
