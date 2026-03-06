"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionCard from "@/components/scheduling/SectionCard";
import SettingsFormActions from "@/components/scheduling/SettingsFormActions";
import { useUnsavedChangesPrompt } from "@/hooks/use-unsaved-changes";

type Props = {
  orgId?: string;
};

type Settings = {
  approvalPolicy: "AUTO_APPROVE" | "REQUIRES_APPROVAL";
  maxDailyBookings: number | null;
};

const APPROVAL_OPTIONS: Settings["approvalPolicy"][] = [
  "REQUIRES_APPROVAL",
  "AUTO_APPROVE",
];

function snapshotFrom(settings: Settings) {
  return JSON.stringify({
    approvalPolicy: settings.approvalPolicy,
    maxDailyBookings: settings.maxDailyBookings ?? 0,
  });
}

export default function BookingSettingsClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState("");

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
          const normalized = {
            ...next,
            maxDailyBookings: next.maxDailyBookings ?? 5,
          };
          setForm(normalized);
          setInitialSnapshot(snapshotFrom(normalized));
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

  const snapshot = useMemo(
    () => (form ? snapshotFrom(form) : ""),
    [form]
  );
  const isDirty = Boolean(form && snapshot !== initialSnapshot);

  useUnsavedChangesPrompt(isDirty);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/scheduling/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(orgId ? { orgId } : {}),
          approvalPolicy: form.approvalPolicy,
          maxDailyBookings: form.maxDailyBookings ?? 5,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save settings");
        return;
      }
      const next = data?.settings as Settings | undefined;
      if (next) {
        const normalized = {
          ...next,
          maxDailyBookings: next.maxDailyBookings ?? 5,
        };
        setForm(normalized);
        setInitialSnapshot(snapshotFrom(normalized));
      }
      toast.success("Booking policies saved.");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage booking policies
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
          Booking policies
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Rules for approvals and booking limits.
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
                  Approvals
                </p>
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
                          ? {
                              ...prev,
                              approvalPolicy: e.target.value as Settings["approvalPolicy"],
                            }
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
              </div>
            </SectionCard>

            <SectionCard>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  Capacity
                </p>
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
                              maxDailyBookings: Math.min(
                                50,
                                Math.max(
                                  1,
                                  Number.isFinite(Number(e.target.value))
                                    ? Number(e.target.value)
                                    : 1
                                )
                              ),
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
              </div>
            </SectionCard>
          </div>

          <SettingsFormActions
            isDirty={isDirty}
            saving={saving}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  );
}
