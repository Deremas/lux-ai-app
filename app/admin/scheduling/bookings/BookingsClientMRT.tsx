"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import Badge, { BookingStatus } from "@/components/scheduling/Badge";
import ProductHero from "@/components/scheduling/ProductHero";
import type { MRT_ColumnDef } from "material-react-table";

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

export default function BookingsClient({ orgId, tz }: Props) {
    const { status } = useSession();
    const [items, setItems] = useState<Booking[]>([]);
    const [meetingTypes, setMeetingTypes] = useState<MeetingTypeOption[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("pending");
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
    const [timezone, setTimezone] = useState(tz || "UTC");

    const timezoneDisplay = useMemo(() => {
        if (tz) return tz;
        if (typeof Intl !== "undefined") {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        }
        return "UTC";
    }, [tz]);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!orgId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
            orgId,
            status: statusFilter === "all" ? "" : statusFilter,
            mode: modeFilter === "all" ? "" : modeFilter,
            meetingTypeId: meetingTypeFilter === "all" ? "" : meetingTypeFilter,
            staffUserId: staffFilter === "all" ? "" : staffFilter,
            startDate,
            endDate,
            query: debouncedQuery,
            page: String(page),
            pageSize: String(pageSize),
        });

        fetch(`/api/scheduling/admin/appointments?${params}`, {
            cache: "no-store",
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (cancelled) return;
                if (!ok) {
                    setError(data?.error ?? "Failed to load bookings");
                    return;
                }
                setItems((data?.items ?? []) as Booking[]);
                setTotal(data?.total ?? 0);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load bookings");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [orgId, statusFilter, modeFilter, meetingTypeFilter, staffFilter, startDate, endDate, debouncedQuery, page, pageSize, status]);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!orgId) return;
        let cancelled = false;

        fetch(`/api/scheduling/admin/meeting-types?orgId=${orgId}`, {
            cache: "no-store",
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (cancelled) return;
                if (!ok) return;
                setMeetingTypes((data?.items ?? []) as MeetingTypeOption[]);
            })
            .catch(() => {
                if (!cancelled) console.error("Failed to load meeting types");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [orgId, status]);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!orgId) return;
        let cancelled = false;

        fetch(`/api/scheduling/admin/staff?orgId=${orgId}`, {
            cache: "no-store",
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (cancelled) return;
                if (!ok) return;
                setStaffUsers((data?.items ?? []) as StaffOption[]);
            })
            .catch(() => {
                if (!cancelled) console.error("Failed to load staff users");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [orgId, status]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (statusFilter !== "all" && item.status !== statusFilter) return false;
            if (modeFilter !== "all" && item.mode !== modeFilter) return false;
            if (meetingTypeFilter !== "all" && item.meetingTypeId !== meetingTypeFilter) return false;
            if (staffFilter !== "all" && item.staffUserId !== staffFilter) return false;
            if (startDate && new Date(item.startAtUtc) < new Date(startDate)) return false;
            if (endDate && new Date(item.startAtUtc) > new Date(endDate + "T23:59:59")) return false;
            if (debouncedQuery) {
                const q = debouncedQuery.toLowerCase();
                return (
                    (item.userFullName?.toLowerCase() || "").includes(q) ||
                    (item.userEmail?.toLowerCase() || "").includes(q) ||
                    (item.userPhone?.toLowerCase() || "").includes(q) ||
                    (item.meetingTypeKey?.toLowerCase() || "").includes(q)
                );
            }
            return true;
        });
    }, [items, statusFilter, modeFilter, meetingTypeFilter, staffFilter, startDate, endDate, debouncedQuery]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const columns = useMemo<MRT_ColumnDef<Booking>[]>(() => [
        {
            accessorKey: "meetingTypeKey",
            header: "Meeting",
            Cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {row.original.meetingTypeKey ?? "Meeting"}
                    </div>
                    <div className="text-xs text-gray-500">{row.original.mode}</div>
                    {row.original.durationMin && (
                        <div className="mt-1 text-xs text-gray-400">
                            {row.original.durationMin} min
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "startAtUtc",
            header: "Time",
            Cell: ({ row }) => {
                const start = DateTime.fromJSDate(
                    row.original.startAtUtc instanceof Date
                        ? row.original.startAtUtc
                        : new Date(row.original.startAtUtc)
                ).setZone(timezoneDisplay);
                const end = DateTime.fromJSDate(
                    row.original.endAtUtc instanceof Date
                        ? row.original.endAtUtc
                        : new Date(row.original.endAtUtc)
                ).setZone(timezoneDisplay);
                return (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        {start.toFormat("ccc, LLL dd · HH:mm")} – {end.toFormat("HH:mm")}
                    </div>
                );
            },
        },
        {
            accessorKey: "userFullName",
            header: "Customer",
            Cell: ({ row }) => {
                const displayName = row.original.userFullName || row.original.userName || "Booking user";
                return (
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                            {displayName}
                        </div>
                        {row.original.userEmail && (
                            <a
                                className="text-blue-600 hover:underline text-xs"
                                href={`mailto:${row.original.userEmail}`}
                            >
                                {row.original.userEmail}
                            </a>
                        )}
                        {row.original.userPhone && (
                            <div className="mt-1">
                                <a
                                    className="text-blue-600 hover:underline text-xs"
                                    href={`tel:${row.original.userPhone}`}
                                >
                                    {row.original.userPhone}
                                </a>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "staffUserId",
            header: "Staff",
            Cell: ({ row }) => (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                    {row.original.staffUserId ?? "Unassigned"}
                </div>
            ),
        },
        {
            accessorKey: "paymentStatus",
            header: "Payment",
            Cell: ({ row }) => {
                const priceLabel = formatMoney(row.original.priceCents, row.original.currency);
                const paymentStatus = row.original.paymentStatus ?? "not_required";
                const paymentRequired = Boolean(row.original.requiresPayment);
                const paymentLabel = paymentRequired
                    ? `${paymentStatus}${priceLabel ? ` · ${priceLabel}` : ""}`
                    : "Not required";
                return (
                    <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                            {paymentLabel}
                        </div>
                        {row.original.paymentPolicy && (
                            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Policy: {row.original.paymentPolicy}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            Cell: ({ row }) => (
                <Badge variant={row.original.status as BookingStatus}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: "actions",
            header: "Actions",
            Cell: ({ row }) => (
                <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/scheduling/bookings/${row.original.id}`}>
                        View details
                    </Link>
                </Button>
            ),
        },
    ], [timezone]);

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
                chips={
                    <span className="text-xs text-gray-500">
                        Times shown in {timezoneDisplay}.
                    </span>
                }
            />

            <FilterBar>
                <select
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                    <option value="canceled">Canceled</option>
                    <option value="completed">Completed</option>
                </select>
                <select
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
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
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={meetingTypeFilter}
                    onChange={(e) => setMeetingTypeFilter(e.target.value)}
                >
                    <option value="all">All Types</option>
                    {meetingTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                            {type.title}
                        </option>
                    ))}
                </select>
                <select
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                >
                    <option value="all">All Staff</option>
                    {staffUsers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                            {staff.name || staff.email}
                        </option>
                    ))}
                </select>
                <Input
                    type="date"
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                    type="date"
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <Input
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, phone..."
                />
                <select
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span className="text-xs text-gray-500">Total: {total}</span>
            </FilterBar>

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

            <MrtCardTable
                title="Bookings"
                subtitle={`${filtered.length} of ${total} bookings`}
                headerRight={
                    <div className="text-sm text-gray-500">
                        Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                    </div>
                }
                table={{
                    columns,
                    data: paginated,
                    manualPagination: true,
                    manualSorting: true,
                    manualFiltering: true,
                    state: {
                        pagination: {
                            pageIndex: page - 1,
                            pageSize,
                        },
                    },
                    onPaginationChange: (updater) => {
                        const newPagination = typeof updater === 'function'
                            ? updater({ pageIndex: page - 1, pageSize })
                            : updater;
                        setPage(newPagination.pageIndex + 1);
                    },
                    renderEmptyRowsFallback: () => (
                        <div className="p-4 text-sm text-gray-600">
                            No bookings found.
                        </div>
                    ),
                }}
            />

            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Showing {paginated.length} of {filtered.length} results
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= Math.ceil(total / pageSize)}
                        variant="outline"
                        size="sm"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
