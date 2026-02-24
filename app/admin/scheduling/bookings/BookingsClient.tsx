"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import type { MRT_ColumnDef, MRT_SortingState } from "material-react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import Badge, { getStatusDisplay, type BookingStatus } from "@/components/scheduling/Badge";
import ProductHero from "@/components/scheduling/ProductHero";

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

type MeetingTypeOption = { id: string; key: string; title: string };
type StaffOption = { id: string; name: string | null; email: string };

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "completed",
] as const;

function formatMoney(priceCents?: number | null, currency?: string | null) {
  if (priceCents == null || priceCents <= 0 || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
      priceCents / 100
    );
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

export default function BookingsClient({ orgId, tz }: Props) {
  const { status } = useSession();

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [tz]);

  const [items, setItems] = useState<Booking[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeOption[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // server filters
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // MRT state (server-side)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  // reset to page 1 when server filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [
    statusFilter,
    modeFilter,
    meetingTypeFilter,
    staffFilter,
    startDate,
    endDate,
    debouncedQuery,
  ]);

  function buildUrl() {
    const url = new URL("/api/scheduling/admin/appointments", window.location.origin);
    url.searchParams.set("orgId", orgId);

    if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
    if (modeFilter !== "all") url.searchParams.set("mode", modeFilter);
    if (meetingTypeFilter !== "all") url.searchParams.set("meetingTypeId", meetingTypeFilter);
    if (staffFilter !== "all") url.searchParams.set("staffUserId", staffFilter);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);
    if (debouncedQuery) url.searchParams.set("q", debouncedQuery);

    // server pagination
    url.searchParams.set("page", String(pagination.pageIndex + 1));
    url.searchParams.set("pageSize", String(pagination.pageSize));

    // server sorting (single-column is enough to start)
    if (sorting[0]) {
      url.searchParams.set("sortBy", sorting[0].id);
      url.searchParams.set("sortDir", sorting[0].desc ? "desc" : "asc");
    }

    return url.toString();
  }

  async function fetchBookings() {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(buildUrl(), { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as any;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    orgId,
    statusFilter,
    modeFilter,
    meetingTypeFilter,
    staffFilter,
    startDate,
    endDate,
    debouncedQuery,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ]);

  // meeting types
  useEffect(() => {
    if (status !== "authenticated" || !orgId) return;
    let cancelled = false;

    fetch(`/api/scheduling/meeting-types?orgId=${orgId}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        const next = (data?.items ?? []) as Array<{ id: string; key: string; title: string }>;
        setMeetingTypes(next.map((m) => ({ id: m.id, key: m.key, title: m.title || m.key })));
      })
      .catch(() => !cancelled && setMeetingTypes([]));

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  // staff users
  useEffect(() => {
    if (status !== "authenticated" || !orgId) return;
    let cancelled = false;

    const url = new URL("/api/scheduling/admin/users", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("role", "staff");
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "50");

    fetch(url.toString(), { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setStaffUsers((data?.items ?? []) as StaffOption[]);
      })
      .catch(() => !cancelled && setStaffUsers([]));

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  const columns = useMemo<MRT_ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "meetingTypeKey",
        header: "Meeting",
        Cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {row.original.meetingTypeKey ?? "—"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.durationMin ? `${row.original.durationMin} min` : "—"} ·{" "}
              {row.original.mode}
            </div>
          </div>
        ),
      },
      {
        id: "time",
        header: "Time",
        Cell: ({ row }) => {
          const start = DateTime.fromISO(String(row.original.startAtUtc), { zone: "utc" })
            .setZone(timezone)
            .toFormat("LLL dd, yyyy • HH:mm");
          return <span className="text-sm">{start}</span>;
        },
      },
      {
        id: "customer",
        header: "Customer",
        Cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">
              {row.original.userFullName ?? row.original.userName ?? "—"}
            </div>
            <div className="text-xs text-gray-500">
              {row.original.userEmail ?? "—"}
              {row.original.userPhone ? ` · ${row.original.userPhone}` : ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          const statusValue = row.original.status as BookingStatus;
          return (
            <Badge variant={statusValue}>
              {getStatusDisplay(statusValue)}
            </Badge>
          );
        },
      },
      {
        id: "payment",
        header: "Payment",
        Cell: ({ row }) => {
          const money = formatMoney(row.original.priceCents, row.original.currency);
          const policy = row.original.paymentPolicy ?? "FREE";
          const payStatus = row.original.paymentStatus ?? "not_required";
          return (
            <div className="space-y-1">
              <div className="text-sm">{money ?? "—"}</div>
              <div className="text-xs text-gray-500">
                {policy} · {payStatus}
              </div>
            </div>
          );
        },
      },
    ],
    [timezone]
  );

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
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
      <div className="space-y-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No organization found for this account.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Link
          href="/admin/scheduling"
          className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 hover:underline dark:text-gray-400"
        >
          Back to dashboard
        </Link>
      </div>

      <ProductHero
        eyebrow="Bookings"
        title="Booking approvals"
        subtitle="Review and approve pending booking requests"
        chips={<span className="text-xs text-gray-500">Times shown in {timezone}.</span>}
      />

      <FilterBar>
        <select
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="canceled">Canceled</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
        >
          <option value="all">All Modes</option>
          <option value="google_meet">Google Meet</option>
          <option value="zoom">Zoom</option>
          <option value="phone">Phone</option>
          <option value="in_person">In Person</option>
        </select>

        <select
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={meetingTypeFilter}
          onChange={(e) => setMeetingTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {meetingTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <select
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
        >
          <option value="all">All Staff</option>
          {staffUsers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email}
            </option>
          ))}
        </select>

        <Input type="date" className="h-9" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" className="h-9" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <Input
          className="h-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone..."
        />
      </FilterBar>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <MrtCardTable
        title="Bookings"
        subtitle={`${total} total`}
        table={{
          columns,
          data: items,
          manualPagination: true,
          manualSorting: true,
          rowCount: total,

          onPaginationChange: setPagination,
          onSortingChange: setSorting,

          state: {
            isLoading: loading,
            pagination,
            sorting,
          },

          enableColumnActions: false,
          enableDensityToggle: false,
          enableFullScreenToggle: false,

          initialState: {
            pagination,
            showGlobalFilter: false,
          },

          renderEmptyRowsFallback: () => (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
              No bookings found.
            </div>
          ),
        }}
      />
    </div>
  );
}
