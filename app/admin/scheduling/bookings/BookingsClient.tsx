"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  orgId: string;
  tz?: string;
};

type Booking = {
  id: string;
  userId: string;
  staffUserId: string | null;
  meetingTypeId: string;
  meetingTypeKey: string | null;
  durationMin: number | null;
  status: string;
  mode: string;
  paymentPolicy?: string | null;
  paymentStatus?: string | null;
  requiresPayment?: boolean | null;
  priceCents?: number | null;
  currency?: string | null;
  startAtUtc: string | Date;
  endAtUtc: string | Date;
  notes: string | null;
  userName?: string | null;
  userFullName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
};

type MeetingTypeOption = {
  id: string;
  key: string;
  title: string;
};

type StaffOption = {
  id: string;
  name: string | null;
  email: string;
};

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "completed",
] as const;

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

function extractNoteValue(notes: string | null | undefined, key: string) {
  if (!notes) return null;
  const line = notes
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  if (!line) return null;
  const value = line.slice(key.length + 1).trim();
  return value || null;
}

export default function BookingsClient({ orgId, tz }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<Booking[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeOption[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [tz]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function buildUrl() {
    const url = new URL("/api/scheduling/admin/appointments", window.location.origin);
    url.searchParams.set("orgId", orgId);
    if (statusFilter !== "all") {
      url.searchParams.set("status", statusFilter);
    }
    if (modeFilter !== "all") {
      url.searchParams.set("mode", modeFilter);
    }
    if (meetingTypeFilter !== "all") {
      url.searchParams.set("meetingTypeId", meetingTypeFilter);
    }
    if (staffFilter !== "all") {
      url.searchParams.set("staffUserId", staffFilter);
    }
    if (startDate) {
      url.searchParams.set("startDate", startDate);
    }
    if (endDate) {
      url.searchParams.set("endDate", endDate);
    }
    if (debouncedQuery) {
      url.searchParams.set("q", debouncedQuery);
    }
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    return url.toString();
  }

  async function fetchBookings() {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl(), { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to load bookings");
        return;
      }
      setItems((data?.items ?? []) as Booking[]);
      setTotal(Number(data?.total ?? 0));
    } catch {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetchBookings();
  }, [
    status,
    statusFilter,
    modeFilter,
    meetingTypeFilter,
    staffFilter,
    startDate,
    endDate,
    debouncedQuery,
    page,
    pageSize,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    modeFilter,
    meetingTypeFilter,
    staffFilter,
    startDate,
    endDate,
    debouncedQuery,
    pageSize,
  ]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;

    fetch(`/api/scheduling/meeting-types?orgId=${orgId}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) return;
        const next = (data?.items ?? []) as Array<{
          id: string;
          key: string;
          title: string;
        }>;
        setMeetingTypes(
          next.map((item) => ({
            id: item.id,
            key: item.key,
            title: item.title || item.key,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setMeetingTypes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;

    const url = new URL("/api/scheduling/admin/users", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("role", "staff");
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "50");

    const maxRetries = 2;
    const fetchStaff = (attempt: number) => {
      fetch(url.toString(), { cache: "no-store" })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (cancelled) return;
          if (!ok) return;
          const next = (data?.items ?? []) as Array<{
            id: string;
            name: string | null;
            email: string;
          }>;
          setStaffUsers(next);
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < maxRetries) {
            setTimeout(() => fetchStaff(attempt + 1), 500 * (attempt + 1));
            return;
          }
          setStaffUsers([]);
        });
    };

    fetchStaff(0);

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);



  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage bookings
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

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No organization found for this account.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-end">
          <Link
            href="/admin/scheduling"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 hover:underline dark:text-gray-400"
          >
            Back to dashboard
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Scheduling Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              Booking approvals
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Review and approve upcoming bookings. Times shown in {timezone}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Status
              </label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Mode
              </label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
              >
                <option value="all">all</option>
                <option value="google_meet">google_meet</option>
                <option value="zoom">zoom</option>
                <option value="phone">phone</option>
                <option value="in_person">in_person</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Meeting
              </label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={meetingTypeFilter}
                onChange={(e) => setMeetingTypeFilter(e.target.value)}
              >
                <option value="all">all</option>
                {meetingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Staff
              </label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
              >
                <option value="all">all</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(16rem,1fr)_auto_auto] sm:items-center">
            <Input
              className="h-9 w-full sm:w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, meeting..."
            />
            <Input
              type="date"
              className="h-9 w-full sm:w-40"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              className="h-9 w-full sm:w-40"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
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
            <span className="text-xs text-gray-500">Total: {total}</span>
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Loading bookings...
          </div>
        )}

        {notice && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            No bookings found.
          </div>
        )}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.2em] text-gray-500 dark:bg-slate-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Meeting</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Staff</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {items.map((item) => {
                  const start = DateTime.fromJSDate(
                    item.startAtUtc instanceof Date
                      ? item.startAtUtc
                      : new Date(item.startAtUtc)
                  ).setZone(timezone);
                  const end = DateTime.fromJSDate(
                    item.endAtUtc instanceof Date
                      ? item.endAtUtc
                      : new Date(item.endAtUtc)
                  ).setZone(timezone);
                  const label = `${start.toFormat("ccc, LLL dd")} · ${start.toFormat(
                    "HH:mm"
                  )}–${end.toFormat("HH:mm")}`;
                  const pending = item.status === "pending";
                  const canCancel =
                    item.status === "pending" || item.status === "confirmed";
                  const canRestore = item.status === "canceled";
                  const displayName =
                    item.userFullName || item.userName || "Booking user";
                  const priceLabel = formatMoney(item.priceCents, item.currency);
                  const paymentStatus = item.paymentStatus ?? "not_required";
                  const paymentRequired = Boolean(item.requiresPayment);
                  const paymentLabel = paymentRequired
                    ? `${paymentStatus}${priceLabel ? ` · ${priceLabel}` : ""}`
                    : "Not required";
                  const paymentSession = extractNoteValue(
                    item.notes,
                    "payment_session_id"
                  );
                  const paymentIntent = extractNoteValue(
                    item.notes,
                    "payment_intent_id"
                  );

                  return (
                    <tr key={item.id} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.meetingTypeKey ?? "Meeting"}
                          </div>
                          <div className="text-xs text-gray-500">{item.mode}</div>
                          {item.durationMin ? (
                            <div className="mt-1 text-xs text-gray-400">
                              {item.durationMin} min
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                          {label}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {displayName}
                          </div>
                          {item.userEmail && (
                            <a
                              className="text-blue-600 hover:underline"
                              href={`mailto:${item.userEmail}`}
                            >
                              {item.userEmail}
                            </a>
                          )}
                          {item.userPhone && (
                            <div>
                              <a
                                className="text-blue-600 hover:underline"
                                href={`tel:${item.userPhone}`}
                              >
                                {item.userPhone}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                          {item.staffUserId ?? "Unassigned"}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {paymentLabel}
                          </div>
                          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                            Policy: {item.paymentPolicy ?? "n/a"}
                          </div>
                          {priceLabel ? (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              Price: {priceLabel}
                            </div>
                          ) : null}
                          {paymentSession && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              Session: {paymentSession}
                            </div>
                          )}
                          {paymentIntent && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              Intent: {paymentIntent}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/admin/scheduling/bookings/${item.id}`}
                            >
                              View details
                            </Link>
                          </Button>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                setPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

