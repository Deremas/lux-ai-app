"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import type { MRT_ColumnDef } from "material-react-table";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blocked | null>(null);
  const [tzQuery, setTzQuery] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [tzHighlight, setTzHighlight] = useState(0);
  const tzRef = useRef<HTMLDivElement | null>(null);
  const tzListRef = useRef<HTMLDivElement | null>(null);
  const modalOpen = editorOpen || Boolean(deleteTarget);

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
  const isEditing = Boolean(editingId);
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

  function resetForm(options?: { clearFeedback?: boolean }) {
    const shouldClear = options?.clearFeedback ?? true;
    setForm(emptyForm(inputTz));
    setEditingId(null);
    setTzQuery("");
    setTzOpen(false);
    if (shouldClear) {
      setError(null);
      setSuccess(null);
    }
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

  function openCreateEditor() {
    resetForm();
    setEditorOpen(true);
  }

  function openEditEditor(item: Blocked) {
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

  function openDeleteDialog(item: Blocked) {
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
        `/api/scheduling/admin/blocked/${item.id}?orgId=${orgId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to delete blocked time");
        return;
      }
      setSuccess("Blocked time deleted.");
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        resetForm({ clearFeedback: false });
        setEditorOpen(false);
      }
      setDeleteTarget(null);
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
      resetForm({ clearFeedback: false });
      setEditorOpen(false);
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

  function formatBlockedWindow(item: Blocked, timezone: string) {
    const start = DateTime.fromJSDate(
      item.startAtUtc instanceof Date ? item.startAtUtc : new Date(item.startAtUtc)
    ).setZone(timezone);
    const end = DateTime.fromJSDate(
      item.endAtUtc instanceof Date ? item.endAtUtc : new Date(item.endAtUtc)
    ).setZone(timezone);
    return `${start.toFormat("LLL dd, HH:mm")} -> ${end.toFormat("LLL dd, HH:mm")} ${timezone}`;
  }

  const columns = useMemo<MRT_ColumnDef<Blocked>[]>(
    () => [
      {
        id: "scope",
        header: "Scope",
        Cell: ({ row }) => (
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {row.original.staffUserId ? "Staff" : "Org-wide"}
          </span>
        ),
      },
      {
        accessorKey: "staffUserId",
        header: "Staff",
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.original.staffUserId || "—"}
          </span>
        ),
      },
      {
        id: "window",
        header: "Window",
        Cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {formatBlockedWindow(row.original, inputTz)}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        Cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {row.original.reason || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditEditor(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDeleteDialog(row.original)}
              disabled={saving}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [inputTz, saving]
  );
  const startValue = DateTime.fromISO(form.startAt, { zone: inputTz });
  const endValue = DateTime.fromISO(form.endAt, { zone: inputTz });
  const saveDisabled =
    saving ||
    !startValue.isValid ||
    !endValue.isValid ||
    endValue.toMillis() <= startValue.toMillis();

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
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

  return (
    <div className="space-y-8">
      <div className="space-y-8">
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

        <div className="mt-8">
          <MrtCardTable
            title="Blocked time"
            subtitle={items.length ? `${items.length} entries` : "No blocked time entries yet."}
            headerRight={
              <Button size="sm" onClick={openCreateEditor}>
                New blocked time
              </Button>
            }
            table={{
              columns,
              data: items,
              enablePagination: false,
              enableSorting: false,
              enableColumnActions: false,
              enableColumnFilters: false,
              enableGlobalFilter: false,
              enableDensityToggle: false,
              enableFullScreenToggle: false,
              enableColumnResizing: false,
              enableHiding: false,
              state: { isLoading: loading },
              renderEmptyRowsFallback: () => (
                <div className="p-4 text-sm text-gray-600">No blocked time entries yet.</div>
              ),
            }}
          />
        </div>

        <Dialog open={editorOpen} onOpenChange={handleEditorOpenChange}>
          <DialogContent className="w-[min(760px,94vw)] max-w-2xl top-[calc(var(--site-header-height)+1rem)] max-h-[calc(100dvh-var(--site-header-height)-2rem)] translate-y-0 overflow-y-auto overscroll-contain rounded-2xl border border-white/70 bg-white/95 p-0 shadow-2xl backdrop-blur data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4 dark:border-slate-700/60 dark:bg-slate-900/90">
            <DialogHeader className="sticky top-0 z-10 space-y-2 border-b border-white/70 bg-white/95 px-6 pb-4 pt-5 pr-14 text-left backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/95">
              <DialogTitle>
                {isEditing ? "Edit blocked time" : "Add blocked time"}
              </DialogTitle>
              <DialogDescription>
                Block time across the whole org or for a specific staff member.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 pt-4">
              <div className="space-y-4 text-sm">
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
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to block time for the whole organization.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>

                {endValue.isValid &&
                  startValue.isValid &&
                  endValue.toMillis() <= startValue.toMillis() && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    End time must be later than the start time.
                  </div>
                )}

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
                    placeholder="Optional note shown to admins."
                  />
                </div>

                <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t border-white/70 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/95">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEditorOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={saveDisabled}>
                    {saving ? "Saving..." : isEditing ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) closeDeleteDialog();
          }}
        >
          <AlertDialogContent className="rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete blocked time</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the blocked time entry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              <p className="font-semibold">
                {deleteTarget?.staffUserId ? "Staff-specific block" : "Org-wide block"}
              </p>
              {deleteTarget && <p className="mt-1">{formatBlockedWindow(deleteTarget, inputTz)}</p>}
              {deleteTarget?.reason && <p className="mt-1">Reason: {deleteTarget.reason}</p>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirmed}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
