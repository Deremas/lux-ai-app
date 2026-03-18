"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Bell, MailCheck, MailX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

type Props = {
  orgId: string;
  tz?: string;
};

type NotificationItem = {
  id: string;
  appointmentId: string;
  channel: string;
  toAddress: string | null;
  templateKey: string | null;
  status: string;
  error: string | null;
  createdAt: string | Date;
  meetingTypeKey: string | null;
  apptStatus: string;
  startAtUtc: string | Date;
  seen: boolean;
};

const STATUS_OPTIONS = ["all", "sent", "failed"] as const;

function formatMoney(priceCents?: number | null, currency?: string | null) {
  if (!priceCents || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatKeyLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolvePagination(
  updaterOrValue: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState),
  prev: MRT_PaginationState
) {
  return typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
}

export default function NotificationsClient({ orgId, tz }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [tz]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL(
      "/api/scheduling/admin/notifications",
      window.location.origin,
    );
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (statusFilter !== "all") {
      url.searchParams.set("status", statusFilter);
    }
    if (debouncedQuery) {
      url.searchParams.set("q", debouncedQuery);
    }

    fetch(url.toString(), { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load notifications");
          return;
        }
        setItems((data?.items ?? []) as NotificationItem[]);
        setTotal(Number(data?.total ?? 0));
        setUnseenCount(
          (data?.items ?? []).filter((n: NotificationItem) => !n.seen).length,
        );
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notifications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status, statusFilter, debouncedQuery, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedQuery, pageSize]);

  useEffect(() => {
    if (!selected) return;
    if (!selected.appointmentId) {
      setSelectedDetail({ error: "Missing appointment id" });
      return;
    }
    let cancelled = false;
    setSelectedDetail(null);

    fetch(
      `/api/scheduling/admin/appointments/${selected.appointmentId}?orgId=${encodeURIComponent(
        orgId,
      )}`,
      { cache: "no-store" },
    )
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setSelectedDetail({
            error: data?.error ?? "Failed to load booking details",
          });
          return;
        }
        setSelectedDetail(data?.appointment ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedDetail({ error: "Failed to load booking details" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selected, orgId]);

  async function handleSelect(item: NotificationItem) {
    setSelected(item);
    setActionError(null);
    setNote("");
    setSelectedDetail(null);
    if (!item.seen) {
      try {
        await fetch("/api/scheduling/admin/notifications", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orgId, ids: [item.id] }),
        });
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, seen: true } : n))
        );
        setUnseenCount((prev) => Math.max(0, prev - 1));
      } catch {
        // best-effort; UI still opens details
      }
    }
  }

  const columns = useMemo<MRT_ColumnDef<NotificationItem>[]>(
    () => [
      {
        id: "status",
        header: "Status",
        Cell: ({ row }) => {
          const failed = row.original.status === "failed";
          const Icon = failed ? MailX : MailCheck;
          return (
            <div className="flex items-center gap-2">
              <Icon
                className={`h-4 w-4 ${failed ? "text-red-500" : "text-emerald-500"}`}
              />
              <Badge variant={failed ? "destructive" : "secondary"}>
                {failed ? "Failed" : "Sent"}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "notification",
        header: "Notification",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-white">
              {formatKeyLabel(row.original.meetingTypeKey ?? "Meeting")} ·{" "}
              {row.original.templateKey ?? "notification"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {titleCase(row.original.channel)}
            </div>
          </div>
        ),
      },
      {
        id: "recipient",
        header: "Recipient",
        Cell: ({ row }) => (
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {row.original.toAddress ? (
              row.original.toAddress
            ) : (
              <span className="text-red-500">No recipient</span>
            )}
          </div>
        ),
      },
      {
        id: "appointment",
        header: "Appointment",
        Cell: ({ row }) => {
          const start = DateTime.fromJSDate(
            row.original.startAtUtc instanceof Date
              ? row.original.startAtUtc
              : new Date(row.original.startAtUtc)
          ).setZone(timezone);
          return (
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <div>{start.toFormat("LLL dd · HH:mm")}</div>
              <div>{titleCase(row.original.apptStatus)}</div>
            </div>
          );
        },
      },
      {
        id: "created",
        header: "Sent",
        Cell: ({ row }) => {
          const when = DateTime.fromJSDate(
            row.original.createdAt instanceof Date
              ? row.original.createdAt
              : new Date(row.original.createdAt)
          ).setZone(timezone);
          return (
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {when.toFormat("LLL dd · HH:mm")}
            </span>
          );
        },
      },
    ],
    [timezone]
  );

  const pagination = useMemo(
    () => ({ pageIndex: page - 1, pageSize }),
    [page, pageSize]
  );

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to view notifications
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin or staff access is required.
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Notification logs
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Email delivery logs and booking alerts. Times shown in {timezone}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Bell className="h-4 w-4 text-gray-500" />
        <span>Unseen notifications: {unseenCount} / {total}</span>
      </div>

      <FilterBar>
        <Input
          className="h-9 w-60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email or template..."
        />
        <select
          className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 text-sm text-gray-900 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </FilterBar>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <MrtCardTable
        title="Notification logs"
        subtitle={total ? `Showing ${items.length} of ${total}` : "No notifications found."}
        table={{
          columns,
          data: items,
          manualPagination: true,
          rowCount: total,
          enableColumnActions: true,
          enableColumnFilters: false,
          enableGlobalFilter: false,
          enableDensityToggle: true,
          enableFullScreenToggle: true,
          enableTopToolbar: true,
          state: {
            isLoading: loading,
            pagination,
          },
          onPaginationChange: (updaterOrValue) => {
            const next = resolvePagination(updaterOrValue, pagination);
            if (next.pageSize !== pageSize) setPageSize(next.pageSize);
            if (next.pageIndex !== pagination.pageIndex) setPage(next.pageIndex + 1);
          },
          muiTableBodyRowProps: ({ row }) => ({
            role: "button",
            tabIndex: 0,
            onClick: () => handleSelect(row.original),
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSelect(row.original);
              }
            },
            sx: (theme) => ({
              cursor: "pointer",
              boxShadow: !row.original.seen
                ? `inset 0 0 0 2px ${
                    theme.palette.mode === "dark"
                      ? "rgba(16,185,129,0.35)"
                      : "rgba(16,185,129,0.25)"
                  }`
                : "none",
            }),
          }),
          renderEmptyRowsFallback: () => (
            <div className="p-4 text-sm text-gray-600">No notifications found.</div>
          ),
        }}
      />
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
              setSelectedDetail(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Booking detail
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  setSelectedDetail(null);
                }}
              >
                Close
              </Button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
              {selectedDetail ? (
                selectedDetail.error ? (
                  <div className="text-red-600">{selectedDetail.error}</div>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold">Meeting:</span>{" "}
                      {formatKeyLabel(selectedDetail.meetingTypeKey ?? "Meeting")} ·{" "}
                      {selectedDetail.mode ?? "mode"}
                    </p>
                    <p>
                      <span className="font-semibold">User:</span>{" "}
                      {selectedDetail.userFullName ||
                        selectedDetail.userName ||
                        selectedDetail.userId}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {selectedDetail.userEmail || "n/a"}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      {selectedDetail.userPhone || "n/a"}
                    </p>
                    <p>
                      <span className="font-semibold">Company:</span>{" "}
                      {selectedDetail.userCompany || "n/a"}
                      {selectedDetail.userCompanyRole
                        ? ` · ${selectedDetail.userCompanyRole}`
                        : ""}
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      {selectedDetail.status}
                    </p>
                    <p>
                      <span className="font-semibold">Payment:</span>{" "}
                      {selectedDetail.paymentStatus ?? "not_required"}
                      {selectedDetail.requiresPayment ? "" : " (not required)"}
                      {formatMoney(
                        selectedDetail.priceCents,
                        selectedDetail.currency
                      )
                        ? ` · ${formatMoney(
                            selectedDetail.priceCents,
                            selectedDetail.currency
                          )}`
                        : ""}
                    </p>
                    <p>
                      <span className="font-semibold">Appointment:</span>{" "}
                      {DateTime.fromJSDate(
                        selectedDetail.startAtUtc instanceof Date
                          ? selectedDetail.startAtUtc
                          : new Date(selectedDetail.startAtUtc),
                      )
                        .setZone(timezone)
                        .toFormat("ccc, LLL dd · HH:mm")}{" "}
                      · {selectedDetail.status}
                    </p>
                    <p>
                      <span className="font-semibold">Notes:</span>{" "}
                      {selectedDetail.notes || "No notes"}
                    </p>
                    <p>
                      <span className="font-semibold">Created:</span>{" "}
                      {DateTime.fromJSDate(
                        selectedDetail.createdAt instanceof Date
                          ? selectedDetail.createdAt
                          : new Date(selectedDetail.createdAt),
                      )
                        .setZone(timezone)
                        .toFormat("LLL dd · HH:mm")}
                    </p>
                  </>
                )
              ) : (
                <div>Loading booking details...</div>
              )}
              {selectedDetail &&
                !selectedDetail.error &&
                selectedDetail.status === "pending" && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Approval required</p>
                    <p className="mt-1 text-xs text-amber-800">
                      This booking is pending approval. You can approve or
                      decline it here.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        className="h-9 flex-1"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note"
                      />
                      <Button
                        className="min-w-[110px]"
                        disabled={actioning}
                        onClick={async () => {
                          setActioning(true);
                          setActionError(null);
                          try {
                            const res = await fetch(
                              `/api/scheduling/admin/appointments/${selectedDetail.id}/approve?orgId=${orgId}`,
                              {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  reason: note.trim() || undefined,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setActionError(data?.error ?? "Approve failed");
                              return;
                            }
                            setSelected(null);
                            setSelectedDetail(null);
                          } catch {
                            setActionError("Approve failed");
                          } finally {
                            setActioning(false);
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="min-w-[110px]"
                        disabled={actioning}
                        onClick={async () => {
                          setActioning(true);
                          setActionError(null);
                          try {
                            const res = await fetch(
                              `/api/scheduling/admin/appointments/${selectedDetail.id}/decline?orgId=${orgId}`,
                              {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  reason: note.trim() || undefined,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setActionError(data?.error ?? "Decline failed");
                              return;
                            }
                            setSelected(null);
                            setSelectedDetail(null);
                          } catch {
                            setActionError("Decline failed");
                          } finally {
                            setActioning(false);
                          }
                        }}
                      >
                        Decline
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/admin/scheduling/bookings">
                          Open approvals
                        </Link>
                      </Button>
                    </div>
                    {actionError && (
                      <div className="mt-2 text-xs text-red-600">
                        {actionError}
                      </div>
                    )}
                  </div>
                )}
              {selectedDetail &&
                !selectedDetail.error &&
                (selectedDetail.status === "pending" ||
                  selectedDetail.status === "confirmed") && (
                  <div className="mt-5 rounded-xl border border-white/70 bg-white/80 p-4 text-sm text-gray-800 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                    <p className="font-semibold">Need to cancel?</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Canceling will notify the customer and free the slot.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        className="h-9 flex-1"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note"
                      />
                      <Button
                        variant="outline"
                        disabled={actioning}
                        onClick={async () => {
                          setActioning(true);
                          setActionError(null);
                          try {
                            const res = await fetch(
                              `/api/scheduling/appointments/${selectedDetail.id}/cancel?orgId=${orgId}`,
                              {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  reason: note.trim() || undefined,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setActionError(data?.error ?? "Cancel failed");
                              return;
                            }
                            setSelected(null);
                            setSelectedDetail(null);
                          } catch {
                            setActionError("Cancel failed");
                          } finally {
                            setActioning(false);
                          }
                        }}
                      >
                        Cancel booking
                      </Button>
                    </div>
                    {actionError && (
                      <div className="mt-2 text-xs text-red-600">
                        {actionError}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
