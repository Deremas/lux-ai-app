"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Bell, MailCheck, MailX, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Email delivery logs and booking alerts. Times shown in {timezone}.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/scheduling?orgId=${encodeURIComponent(orgId)}`}>
            Back to dashboard
          </Link>
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">
              Unseen notifications: {unseenCount} / {total}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Input
              className="h-9 w-60"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email or template..."
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-gray-500">Rows:</span>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Loading notifications...
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            No notifications found.
          </div>
        )}

        <div className="mt-4 grid gap-3">
          {items.map((item) => {
            const when = DateTime.fromJSDate(
              item.createdAt instanceof Date
                ? item.createdAt
                : new Date(item.createdAt),
            ).setZone(timezone);
            const start = DateTime.fromJSDate(
              item.startAtUtc instanceof Date
                ? item.startAtUtc
                : new Date(item.startAtUtc),
            ).setZone(timezone);
            const Icon = item.status === "failed" ? MailX : MailCheck;

            return (
              <div
                key={item.id}
                className={`flex cursor-pointer flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition hover:border-gray-400 dark:border-slate-700 dark:bg-slate-800/40 ${!item.seen ? "ring-2 ring-emerald-400/40" : ""}`}
                onClick={async () => {
                  setSelected(item);
                  setActionError(null);
                  setNote("");
                  setSelectedDetail(null);
                  if (!item.seen) {
                    await fetch("/api/scheduling/admin/notifications", {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ orgId, ids: [item.id] }),
                    });
                    setItems((prev) =>
                      prev.map((n) =>
                        n.id === item.id ? { ...n, seen: true } : n,
                      ),
                    );
                    setUnseenCount((prev) => Math.max(0, prev - 1));
                  }
                }}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <Icon
                      className={`h-5 w-5 ${
                        item.status === "failed"
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.meetingTypeKey ?? "Meeting"} ·{" "}
                      {item.templateKey ?? "notification"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      To:{" "}
                      {item.toAddress ? (
                        item.toAddress
                      ) : (
                        <span className="text-red-500">
                          No recipient (email not found)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {start.toFormat("ccc, LLL dd · HH:mm")} ·{" "}
                      {item.apptStatus}
                    </p>
                    {item.error && (
                      <p className="mt-1 text-xs text-red-600">{item.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-4 w-4" />
                  {when.toFormat("LLL dd · HH:mm")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() =>
                setPage((prev) =>
                  Math.min(Math.ceil(total / pageSize), prev + 1),
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
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
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
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
                      {selectedDetail.meetingTypeKey ?? "Meeting"} ·{" "}
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
                        <Link
                          href={`/admin/scheduling/bookings?orgId=${orgId}`}
                        >
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
                  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
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
