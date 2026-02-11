"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  orgId: string;
  defaultTz?: string;
};

type Blocked = {
  id: string;
  staffUserId: string | null;
  startAtUtc: string | Date;
  endAtUtc: string | Date;
  reason: string | null;
};

type FormState = {
  staffUserId: string;
  startAt: string;
  endAt: string;
  reason: string;
};

function resolveBrowserTz() {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function emptyForm(tz: string): FormState {
  const start = DateTime.now()
    .setZone(tz)
    .plus({ hours: 2 })
    .toISO({ suppressSeconds: true })!;
  const end = DateTime.now()
    .setZone(tz)
    .plus({ hours: 3 })
    .toISO({ suppressSeconds: true })!;
  return {
    staffUserId: "",
    startAt: start.slice(0, 16),
    endAt: end.slice(0, 16),
    reason: "",
  };
}

export default function BlockedTimeClient({ orgId, defaultTz }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inputTz, setInputTz] = useState(
    defaultTz || resolveBrowserTz()
  );
  const [form, setForm] = useState<FormState>(() => emptyForm(inputTz));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tzQuery, setTzQuery] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [tzHighlight, setTzHighlight] = useState(0);
  const tzRef = useRef<HTMLDivElement | null>(null);
  const tzListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (defaultTz && defaultTz !== inputTz) {
      setInputTz(defaultTz);
      setForm((prev) => ({
        ...prev,
        startAt: emptyForm(defaultTz).startAt,
        endAt: emptyForm(defaultTz).endAt,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTz]);
  const timezones = useMemo(() => {
    const fallback = [
      "UTC",
      "Europe/Luxembourg",
      "Europe/London",
      "America/New_York",
      "Asia/Dubai",
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
    const idx = filteredTimezones.indexOf(inputTz);
    setTzHighlight(idx >= 0 ? idx : 0);
  }, [tzOpen, filteredTimezones, inputTz]);
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
        setInputTz(zone);
        setTzQuery("");
        setTzOpen(false);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setTzOpen(false);
    }
  };

  const dashboardHref = orgId
    ? `/admin/scheduling?orgId=${orgId}`
    : "/admin/scheduling";

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/scheduling/admin/blocked?orgId=${orgId}`, {
      cache: "no-store",
    })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load blocked time");
          return;
        }
        setItems((data?.items ?? []) as Blocked[]);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load blocked time");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  function resetForm() {
    setForm(emptyForm(inputTz));
    setEditingId(null);
  }

  function loadForEdit(item: Blocked) {
    const start = DateTime.fromJSDate(
      item.startAtUtc instanceof Date ? item.startAtUtc : new Date(item.startAtUtc)
    )
      .setZone(inputTz)
      .toISO({ suppressSeconds: true })!;
    const end = DateTime.fromJSDate(
      item.endAtUtc instanceof Date ? item.endAtUtc : new Date(item.endAtUtc)
    )
      .setZone(inputTz)
      .toISO({ suppressSeconds: true })!;

    setForm({
      staffUserId: item.staffUserId ?? "",
      startAt: start.slice(0, 16),
      endAt: end.slice(0, 16),
      reason: item.reason ?? "",
    });
    setEditingId(item.id);
  }

  async function handleDelete(id: string) {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/scheduling/admin/blocked/${id}?orgId=${orgId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to delete blocked time");
        return;
      }
      setSuccess("Blocked time deleted.");
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch {
      setError("Failed to delete blocked time");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      orgId,
      staffUserId: form.staffUserId.trim() || null,
      startAtUtc: DateTime.fromISO(form.startAt, { zone: inputTz })
        .toUTC()
        .toISO(),
      endAtUtc: DateTime.fromISO(form.endAt, { zone: inputTz })
        .toUTC()
        .toISO(),
      reason: form.reason.trim() || null,
    };

    try {
      const res = await fetch(
        editingId
          ? `/api/scheduling/admin/blocked/${editingId}`
          : "/api/scheduling/admin/blocked",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save blocked time");
        return;
      }
      setSuccess(editingId ? "Blocked time updated." : "Blocked time created.");
      resetForm();
      const refetch = await fetch(
        `/api/scheduling/admin/blocked?orgId=${orgId}`,
        { cache: "no-store" }
      );
      const refetchData = await refetch.json().catch(() => ({}));
      setItems((refetchData?.items ?? []) as Blocked[]);
    } catch {
      setError("Failed to save blocked time");
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage blocked time
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

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No org found for this account.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-end">
          <Link
            href={dashboardHref}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 hover:underline dark:text-gray-400"
          >
            Back to dashboard
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Blocked time
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Add org-wide or staff-specific blackout periods.
          </p>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Loading blocked time...
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.length === 0 && !loading ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-gray-300">
                No blocked time entries yet.
              </div>
            ) : (
              items.map((item) => {
                const start = DateTime.fromJSDate(
                  item.startAtUtc instanceof Date
                    ? item.startAtUtc
                    : new Date(item.startAtUtc)
                ).setZone(inputTz);
                const end = DateTime.fromJSDate(
                  item.endAtUtc instanceof Date ? item.endAtUtc : new Date(item.endAtUtc)
                ).setZone(inputTz);
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                          {item.staffUserId ? "Staff" : "Org-wide"}
                        </p>
                        {item.staffUserId && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.staffUserId}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                          {start.toFormat("LLL dd, HH:mm")} → {end.toFormat("LLL dd, HH:mm")}{" "}
                          {inputTz}
                        </p>
                        {item.reason && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => loadForEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          disabled={saving}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? "Edit blocked time" : "Add blocked time"}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Input timezone
                </label>
                <div className="relative mt-1" ref={tzRef}>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between gap-3 rounded-md border border-input bg-white px-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => setTzOpen((prev) => !prev)}
                    onKeyDown={handleTzKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={tzOpen}
                  >
                    <span className="truncate">{inputTz}</span>
                    <span aria-hidden>▾</span>
                  </button>
                  {tzOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
                      <input
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                                zone === inputTz ? "font-semibold" : "",
                                index === tzHighlight ? "bg-gray-100" : "",
                              ].join(" ")}
                              onClick={() => {
                                setInputTz(zone);
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
                  Staff user ID (optional)
                </label>
                <Input
                  value={form.staffUserId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      staffUserId: e.target.value,
                    }))
                  }
                  placeholder="UUID"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Start ({inputTz})
                </label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      startAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  End ({inputTz})
                </label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      endAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Reason
                </label>
                <Textarea
                  value={form.reason}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
