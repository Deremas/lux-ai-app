"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "@/components/scheduling/SectionCard";
import SettingsFormActions from "@/components/scheduling/SettingsFormActions";
import { useUnsavedChangesPrompt } from "@/hooks/use-unsaved-changes";

type Props = {
  orgId?: string;
};

type Settings = {
  notifyEmails: string | null;
  notifyWhatsapp: string | null;
  notifyEmailEnabled: boolean;
  notifyWhatsappEnabled: boolean;
  notifyCalendarEnabled: boolean;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function snapshotFrom(settings: Settings) {
  return JSON.stringify({
    notifyEmails: settings.notifyEmails ?? "",
    notifyWhatsapp: settings.notifyWhatsapp ?? "",
    notifyEmailEnabled: settings.notifyEmailEnabled,
    notifyWhatsappEnabled: settings.notifyWhatsappEnabled,
    notifyCalendarEnabled: settings.notifyCalendarEnabled,
  });
}

export default function NotificationsSettingsClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState("");

  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<"email" | "whatsapp" | null>(
    null
  );

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
          setInitialSnapshot(snapshotFrom(next));
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
          notifyEmails: cleanString(form.notifyEmails ?? ""),
          notifyWhatsapp: cleanString(form.notifyWhatsapp ?? ""),
          notifyEmailEnabled: form.notifyEmailEnabled,
          notifyWhatsappEnabled: form.notifyWhatsappEnabled,
          notifyCalendarEnabled: form.notifyCalendarEnabled,
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
        setInitialSnapshot(snapshotFrom(next));
      }
      toast.success("Notification settings saved.");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
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
            Sign in to manage notification settings
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
          Notifications
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure reminders, channels, and recipients.
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
                  Recipients
                </p>
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
              </div>
            </SectionCard>

            <SectionCard>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  Channels
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
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
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
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
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
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
            </SectionCard>

            <SectionCard>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  Test notifications
                </p>
                <p className="text-xs text-gray-500">
                  Sends a test message to the configured recipients.
                </p>
                <div className="flex flex-wrap gap-3">
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
                    {testingChannel === "whatsapp" ? "Sending..." : "Test WhatsApp"}
                  </Button>
                </div>
                {testStatus && (
                  <div className="text-xs text-emerald-700">{testStatus}</div>
                )}
                {testError && <div className="text-xs text-red-700">{testError}</div>}
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    Logs
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Review sent notifications and delivery errors.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/admin/scheduling/notifications/logs">
                    View logs
                  </Link>
                </Button>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    Templates
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Customize email and WhatsApp notification copy.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/admin/scheduling/notifications/templates">
                    Manage templates
                  </Link>
                </Button>
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
