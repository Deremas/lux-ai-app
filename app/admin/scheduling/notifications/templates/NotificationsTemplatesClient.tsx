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
import { cn } from "@/lib/utils";

type Props = {
  orgId?: string;
};

type TemplateRecord = {
  id: string;
  channel: "email" | "whatsapp";
  key: string;
  subject: string | null;
  body: string;
  updatedAt: string;
};

type TemplateDefinition = {
  channel: "email" | "whatsapp";
  key: string;
  label: string;
  description: string;
};

const TEMPLATE_GROUPS: Array<{
  label: string;
  items: TemplateDefinition[];
}> = [
  {
    label: "Customer email",
    items: [
      {
        channel: "email",
        key: "booking_created",
        label: "Booking created",
        description: "Sent when a customer submits a booking.",
      },
      {
        channel: "email",
        key: "booking_confirmed",
        label: "Booking confirmed",
        description: "Sent when a booking is confirmed.",
      },
      {
        channel: "email",
        key: "booking_declined",
        label: "Booking declined",
        description: "Sent when a booking is declined.",
      },
      {
        channel: "email",
        key: "booking_canceled",
        label: "Booking canceled",
        description: "Sent when a booking is canceled.",
      },
    ],
  },
  {
    label: "Staff email",
    items: [
      {
        channel: "email",
        key: "booking_created_internal",
        label: "New booking (staff)",
        description: "Staff notification for new bookings.",
      },
      {
        channel: "email",
        key: "booking_confirmed_internal",
        label: "Booking confirmed (staff)",
        description: "Staff notification when confirmed.",
      },
      {
        channel: "email",
        key: "booking_declined_internal",
        label: "Booking declined (staff)",
        description: "Staff notification when declined.",
      },
      {
        channel: "email",
        key: "booking_canceled_internal",
        label: "Booking canceled (staff)",
        description: "Staff notification when canceled.",
      },
      {
        channel: "email",
        key: "reschedule_request",
        label: "Reschedule request",
        description: "Staff notification when a reschedule is requested.",
      },
    ],
  },
  {
    label: "Customer WhatsApp",
    items: [
      {
        channel: "whatsapp",
        key: "booking_created_whatsapp",
        label: "Booking created",
        description: "Customer WhatsApp confirmation.",
      },
      {
        channel: "whatsapp",
        key: "booking_confirmed_whatsapp",
        label: "Booking confirmed",
        description: "Customer WhatsApp when confirmed.",
      },
      {
        channel: "whatsapp",
        key: "booking_declined_whatsapp",
        label: "Booking declined",
        description: "Customer WhatsApp when declined.",
      },
      {
        channel: "whatsapp",
        key: "booking_canceled_whatsapp",
        label: "Booking canceled",
        description: "Customer WhatsApp when canceled.",
      },
    ],
  },
  {
    label: "Staff WhatsApp",
    items: [
      {
        channel: "whatsapp",
        key: "booking_created_whatsapp_internal",
        label: "New booking (staff)",
        description: "Staff WhatsApp for new bookings.",
      },
      {
        channel: "whatsapp",
        key: "booking_confirmed_whatsapp_internal",
        label: "Booking confirmed (staff)",
        description: "Staff WhatsApp when confirmed.",
      },
      {
        channel: "whatsapp",
        key: "booking_declined_whatsapp_internal",
        label: "Booking declined (staff)",
        description: "Staff WhatsApp when declined.",
      },
      {
        channel: "whatsapp",
        key: "booking_canceled_whatsapp_internal",
        label: "Booking canceled (staff)",
        description: "Staff WhatsApp when canceled.",
      },
    ],
  },
];

const TOKEN_HELP = [
  { token: "{{customer_name}}", description: "Customer full name" },
  { token: "{{customer_email}}", description: "Customer email" },
  { token: "{{customer_phone}}", description: "Customer phone" },
  { token: "{{meeting_title}}", description: "Meeting title" },
  { token: "{{meeting_mode}}", description: "Meeting mode" },
  { token: "{{meeting_status}}", description: "Meeting status" },
  { token: "{{start_time_utc}}", description: "Start time (UTC)" },
  { token: "{{end_time_utc}}", description: "End time (UTC)" },
  { token: "{{meeting_link}}", description: "Meeting link if confirmed" },
  { token: "{{admin_link}}", description: "Admin booking link" },
  { token: "{{reason}}", description: "Status change reason" },
  { token: "{{booking_id}}", description: "Appointment ID" },
];

function templateId(def: TemplateDefinition) {
  return `${def.channel}:${def.key}`;
}

function snapshotFrom(subject: string, body: string) {
  return JSON.stringify({
    subject: subject ?? "",
    body: body ?? "",
  });
}

export default function NotificationsTemplatesClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, TemplateRecord>>({});

  const initialDef = TEMPLATE_GROUPS[0]?.items[0] ?? {
    channel: "email",
    key: "booking_created",
    label: "Booking created",
    description: "",
  };
  const [active, setActive] = useState<TemplateDefinition>(initialDef);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [initialSnapshot, setInitialSnapshot] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = orgId
      ? `/api/scheduling/admin/notifications/templates?orgId=${orgId}`
      : "/api/scheduling/admin/notifications/templates";

    fetch(url, { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load templates");
          return;
        }
        const rows = Array.isArray(data?.templates) ? data.templates : [];
        const mapped: Record<string, TemplateRecord> = {};
        for (const row of rows) {
          if (!row?.channel || !row?.key) continue;
          mapped[`${row.channel}:${row.key}`] = row as TemplateRecord;
        }
        setTemplates(mapped);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load templates");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  const activeId = templateId(active);
  const activeTemplate = templates[activeId] ?? null;

  useEffect(() => {
    const nextSubject = activeTemplate?.subject ?? "";
    const nextBody = activeTemplate?.body ?? "";
    setSubject(nextSubject);
    setBody(nextBody);
    setInitialSnapshot(snapshotFrom(nextSubject, nextBody));
  }, [activeId, activeTemplate?.subject, activeTemplate?.body]);

  const snapshot = useMemo(() => snapshotFrom(subject, body), [subject, body]);
  const isDirty = snapshot !== initialSnapshot;

  useUnsavedChangesPrompt(isDirty);

  function handleSelect(def: TemplateDefinition) {
    if (templateId(def) === activeId) return;
    if (isDirty && !window.confirm("You have unsaved changes. Switch anyway?")) {
      return;
    }
    setActive(def);
  }

  async function handleSave() {
    if (!body.trim()) {
      setError("Template body is required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/scheduling/admin/notifications/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(orgId ? { orgId } : {}),
          channel: active.channel,
          key: active.key,
          subject: active.channel === "email" ? subject : "",
          body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save template");
        return;
      }
      const saved = data?.template as TemplateRecord | undefined;
      if (saved?.channel && saved?.key) {
        setTemplates((prev) => ({
          ...prev,
          [`${saved.channel}:${saved.key}`]: saved,
        }));
        setInitialSnapshot(snapshotFrom(saved.subject ?? "", saved.body ?? ""));
      }
      toast.success("Template saved.");
    } catch {
      setError("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!activeTemplate) return;
    const ok = window.confirm("Reset this template to the default version?");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/scheduling/admin/notifications/templates", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(orgId ? { orgId } : {}),
          channel: active.channel,
          key: active.key,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to reset template");
        return;
      }
      setTemplates((prev) => {
        const next = { ...prev };
        delete next[activeId];
        return next;
      });
      setSubject("");
      setBody("");
      setInitialSnapshot(snapshotFrom("", ""));
      toast.success("Template reset to default.");
    } catch {
      setError("Failed to reset template");
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage notification templates
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required to customize templates.
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
          Notification templates
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Customize email and WhatsApp messages. Leave fields blank to use defaults.
        </p>
      </div>

      {loading && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          Loading templates...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <SectionCard>
          <div className="space-y-6">
            {TEMPLATE_GROUPS.map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  {group.label}
                </p>
                <div className="grid gap-2">
                  {group.items.map((item) => {
                    const id = templateId(item);
                    const isActive = id === activeId;
                    const hasOverride = Boolean(templates[id]);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm transition",
                          isActive
                            ? "border-blue-200 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white hover:border-blue-100 hover:bg-blue-50/40",
                          hasOverride && !isActive
                            ? "shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
                            : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{item.label}</span>
                          {hasOverride && (
                            <span className="text-[10px] font-semibold uppercase text-blue-600">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {active.label}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Channel: {active.channel.toUpperCase()} ·{" "}
                    {activeTemplate ? "Custom template" : "Default template"}
                  </p>
                </div>
                {activeTemplate?.updatedAt && (
                  <span className="text-xs text-gray-500">
                    Updated {new Date(activeTemplate.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {active.channel === "email" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Subject (optional)
                  </label>
                  <Input
                    className="mt-2"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a subject. Leave blank to use the default."
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600">
                  Message body
                </label>
                <Textarea
                  className="mt-2 min-h-[220px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message. Tokens like {{customer_name}} are supported."
                />
                <p className="mt-2 text-xs text-gray-500">
                  Plain text only. Tokens will be replaced automatically.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Available tokens
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {TOKEN_HELP.map((token) => (
                  <div
                    key={token.token}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-gray-600"
                  >
                    <div className="font-semibold text-gray-900">{token.token}</div>
                    <div className="text-[11px] text-gray-500">
                      {token.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SettingsFormActions
            isDirty={isDirty}
            saving={saving}
            onSave={handleSave}
            secondaryAction={
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!activeTemplate || saving}
              >
                Reset to default
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
