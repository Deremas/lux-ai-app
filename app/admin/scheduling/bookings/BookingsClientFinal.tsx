"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import Badge, { BookingStatus, PaymentStatus, getStatusDisplay } from "@/components/scheduling/Badge";
import ProductHero from "@/components/scheduling/ProductHero";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

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

function formatKeyLabel(value: string) {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatModeLabel(mode: string) {
    switch (mode) {
        case "google_meet":
            return "Google Meet";
        case "zoom":
            return "Zoom";
        case "phone":
            return "Phone";
        case "in_person":
            return "In person";
        default:
            return formatKeyLabel(mode);
    }
}

function normalizePaymentStatus(
    status: string | null | undefined,
    requiresPayment: boolean | null | undefined
): PaymentStatus {
    if (status === "paid" || status === "unpaid" || status === "not_required") {
        return status;
    }
    return requiresPayment ? "unpaid" : "not_required";
}

function resolvePagination(
    updaterOrValue: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState),
    prev: MRT_PaginationState
) {
    return typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
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

    const pagination = useMemo(
        () => ({ pageIndex: page - 1, pageSize }),
        [page, pageSize]
    );

    const meetingTypeLookup = useMemo(() => {
        return new Map(meetingTypes.map((type) => [type.id, type.title]));
    }, [meetingTypes]);

    const staffLookup = useMemo(() => {
        return new Map(
            staffUsers.map((staff) => [staff.id, staff.name || staff.email])
        );
    }, [staffUsers]);

    const columns = useMemo<MRT_ColumnDef<Booking>[]>(() => [
        {
            accessorKey: "meetingTypeKey",
            header: "Meeting",
            Cell: ({ row }) => (
                <div className="space-y-2">
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {meetingTypeLookup.get(row.original.meetingTypeId) ??
                            formatKeyLabel(row.original.meetingTypeKey ?? "Meeting")}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="uppercase tracking-wide">
                            {formatModeLabel(row.original.mode)}
                        </Badge>
                        {row.original.durationMin && (
                            <span className="text-xs text-gray-500">
                                {row.original.durationMin} min
                            </span>
                        )}
                    </div>
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
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {start.toFormat("ccc, LLL dd")}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                            {start.toFormat("HH:mm")} – {end.toFormat("HH:mm")} · {timezoneDisplay}
                        </div>
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
                    <div className="space-y-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                            {displayName}
                        </div>
                        {row.original.userEmail && (
                            <a
                                className="text-xs text-blue-600 hover:underline"
                                href={`mailto:${row.original.userEmail}`}
                            >
                                {row.original.userEmail}
                            </a>
                        )}
                        {row.original.userPhone && (
                            <a
                                className="text-xs text-blue-600 hover:underline"
                                href={`tel:${row.original.userPhone}`}
                            >
                                {row.original.userPhone}
                            </a>
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
                    {row.original.staffUserId
                        ? staffLookup.get(row.original.staffUserId) ?? row.original.staffUserId
                        : "Unassigned"}
                </div>
            ),
        },
        {
            accessorKey: "paymentStatus",
            header: "Payment",
            Cell: ({ row }) => {
                const priceLabel = formatMoney(row.original.priceCents, row.original.currency);
                const paymentStatus = normalizePaymentStatus(
                    row.original.paymentStatus ?? null,
                    row.original.requiresPayment
                );
                return (
                    <div className="space-y-2">
                        <Badge variant={paymentStatus}>
                            {getStatusDisplay(paymentStatus)}
                        </Badge>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                            {priceLabel ? priceLabel : "—"}
                        </div>
                        {row.original.paymentPolicy && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                Payment: {row.original.paymentPolicy === "FREE" ? "Free" : "Paid"}
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
                    {getStatusDisplay(row.original.status as BookingStatus)}
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
    ], [timezoneDisplay, meetingTypeLookup, staffLookup]);

    return (
        <div className="space-y-8">
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                    type="date"
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <Input
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, phone..."
                />
            </FilterBar>

            {loading && (
                <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
                    Loading bookings...
                </div>
            )}

            {notice && (
                <div className="mt-6 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700 backdrop-blur">
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
                table={{
                    columns,
                    data: filtered,
                    enablePagination: true,
                    enableSorting: true,
                    enableFilters: true,
                    manualPagination: true,
                    rowCount: total,
                    state: {
                        isLoading: loading,
                        pagination,
                    },
                    onPaginationChange: (updaterOrValue) => {
                        const next = resolvePagination(updaterOrValue, pagination);
                        if (next.pageSize !== pageSize) {
                            setPageSize(next.pageSize);
                            setPage(1);
                        }
                        if (next.pageIndex !== pagination.pageIndex) {
                            setPage(next.pageIndex + 1);
                        }
                    },
                    renderEmptyRowsFallback: () => (
                        <div className="p-4 text-sm text-gray-600">
                            No bookings found.
                        </div>
                    ),
                }}
            />
        </div>
    );
}
