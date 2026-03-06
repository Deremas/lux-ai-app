"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  defaultTz: string;
  defaultLocale: "en" | "fr" | "de" | "lb";
  workingHoursJson: string | null;
};

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

function snapshotFrom(settings: Settings) {
  return JSON.stringify({
    defaultTz: settings.defaultTz,
    defaultLocale: settings.defaultLocale,
    workingHoursJson: settings.workingHoursJson ?? "",
  });
}

export default function GeneralSettingsClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState("");

  const [tzQuery, setTzQuery] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [tzHighlight, setTzHighlight] = useState(0);
  const tzRef = useRef<HTMLDivElement | null>(null);
  const tzListRef = useRef<HTMLDivElement | null>(null);

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
            workingHoursJson: next.workingHoursJson ?? DEFAULT_WORKING_HOURS,
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
          defaultTz: cleanString(form.defaultTz),
          defaultLocale: form.defaultLocale,
          workingHoursJson: cleanString(form.workingHoursJson ?? ""),
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
          workingHoursJson: next.workingHoursJson ?? DEFAULT_WORKING_HOURS,
        };
        setForm(normalized);
        setInitialSnapshot(snapshotFrom(normalized));
      }
      toast.success("General settings saved.");
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
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Scheduling Admin
        </p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Scheduling settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          General defaults for scheduling behavior.
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
                  Time & locale
                </p>
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
                          ? {
                              ...prev,
                              defaultLocale: e.target.value as Settings["defaultLocale"],
                            }
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
              </div>
            </SectionCard>

            <SectionCard>
              <div id="working-hours" className="space-y-3 scroll-mt-24">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    Working hours
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Define default availability used across scheduling.
                  </p>
                </div>
                <div>
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
