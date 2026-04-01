"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar, { FilterField } from "@/components/scheduling/FilterBar";
import Badge, { BookingStatus, PaymentStatus, getStatusDisplay } from "@/components/scheduling/Badge";
import ProductHero from "@/components/scheduling/ProductHero";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

type Props = {
    orgId: string;
    tz?: string;
    view?: "all" | "approvals";
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

type ApprovalAction = "approve" | "decline";

const STATUS_OPTIONS = [
    "all",
    "pending",
    "confirmed",
    "declined",
    "canceled",
    "completed",
] as const;

const filterControlClassName =
    "h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700/60 dark:bg-slate-900/75 dark:text-slate-100";

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

function formatPaymentPolicyLabel(policy: string | null | undefined) {
  if (!policy || policy === "FREE") return "Free";
  return "Paid";
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

export default function BookingsClient({ orgId, tz, view = "all" }: Props) {
    const { status } = useSession();
    const isApprovalsView = view === "approvals";
    const defaultStatusFilter: (typeof STATUS_OPTIONS)[number] = isApprovalsView
        ? "pending"
        : "all";
    const [items, setItems] = useState<Booking[]>([]);
    const [meetingTypes, setMeetingTypes] = useState<MeetingTypeOption[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>(
        defaultStatusFilter
    );
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
    const [refreshKey, setRefreshKey] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);
    const [approvalTarget, setApprovalTarget] = useState<Booking | null>(null);
    const [approvalAction, setApprovalAction] = useState<ApprovalAction>("approve");
    const [approvalNote, setApprovalNote] = useState("");
    const [approvalError, setApprovalError] = useState<string | null>(null);
    const [approvalSubmitting, setApprovalSubmitting] = useState(false);

    const timezoneDisplay = useMemo(() => {
        if (tz) return tz;
        if (typeof Intl !== "undefined") {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        }
        return "UTC";
    }, [tz]);

    const approvalDialogOpen = Boolean(approvalTarget);

    useEffect(() => {
        setStatusFilter(defaultStatusFilter);
        setPage(1);
    }, [defaultStatusFilter]);

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
    }, [orgId, statusFilter, modeFilter, meetingTypeFilter, staffFilter, startDate, endDate, debouncedQuery, page, pageSize, refreshKey, status]);

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

    function handleApprovalDialogOpenChange(nextOpen: boolean) {
        if (nextOpen) return;
        if (approvalSubmitting) return;
        setApprovalTarget(null);
        setApprovalNote("");
        setApprovalError(null);
    }

    function openApprovalDialog(item: Booking, action: ApprovalAction) {
        setApprovalTarget(item);
        setApprovalAction(action);
        setApprovalNote("");
        setApprovalError(null);
    }

    async function submitApprovalAction() {
        if (!approvalTarget || !orgId) return;
        setApprovalSubmitting(true);
        setApprovalError(null);
        setNotice(null);

        try {
            const res = await fetch(
                `/api/scheduling/admin/appointments/${approvalTarget.id}/${approvalAction}?orgId=${orgId}`,
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        reason: approvalNote.trim() || undefined,
                    }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setApprovalError(data?.error ?? "Action failed");
                return;
            }

            setNotice(
                data?.emailError
                    ? `${approvalAction === "approve" ? "Approved" : "Declined"}; email failed: ${data.emailError}`
                    : approvalAction === "approve"
                    ? "Booking approved."
                    : "Booking declined."
            );

            const shouldGoBackPage = items.length === 1 && page > 1;
            setApprovalTarget(null);
            setApprovalNote("");
            setApprovalError(null);

            if (shouldGoBackPage) {
                setPage((prev) => Math.max(1, prev - 1));
            } else {
                setRefreshKey((prev) => prev + 1);
            }
        } catch {
            setApprovalError("Action failed");
        } finally {
            setApprovalSubmitting(false);
        }
    }

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
                const paymentRequired =
                    row.original.paymentPolicy !== "FREE" &&
                    Boolean(row.original.requiresPayment);
                const priceLabel = paymentRequired
                    ? formatMoney(row.original.priceCents, row.original.currency)
                    : null;
                const paymentStatus = normalizePaymentStatus(
                    row.original.paymentStatus ?? null,
                    row.original.requiresPayment
                );
                return (
                    <div className="space-y-2">
                        <Badge variant={paymentStatus}>
                            {getStatusDisplay(paymentStatus)}
                        </Badge>
                        {priceLabel && (
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                {priceLabel}
                            </div>
                        )}
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
                isApprovalsView ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            onClick={() => openApprovalDialog(row.original, "approve")}
                        >
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openApprovalDialog(row.original, "decline")}
                        >
                            Decline
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/scheduling/bookings/${row.original.id}`}>
                                View details
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/scheduling/bookings/${row.original.id}`}>
                            View details
                        </Link>
                    </Button>
                )
            ),
        },
    ], [isApprovalsView, meetingTypeLookup, staffLookup, timezoneDisplay]);

    const activeFilterCount = [
        !isApprovalsView && statusFilter !== "all",
        modeFilter !== "all",
        meetingTypeFilter !== "all",
        staffFilter !== "all",
        Boolean(startDate),
        Boolean(endDate),
        Boolean(query.trim()),
    ].filter(Boolean).length;

    const heroTitle = isApprovalsView ? "Booking approvals" : "Bookings";
    const heroSubtitle = isApprovalsView
        ? "Review booking requests that are waiting for approval."
        : "Review, filter, and manage bookings across all statuses.";
    const filterSubtitle = isApprovalsView
        ? "Review pending requests by meeting type, staff, date range, or customer search."
        : "Narrow the booking list by status, meeting type, staff, date range, or customer search.";
    const tableTitle = isApprovalsView ? "Pending approvals" : "All bookings";
    const tableSubtitle = isApprovalsView
        ? `Showing ${filtered.length} of ${total} pending booking requests`
        : `Showing ${filtered.length} of ${total} matching bookings`;

    function resetFilters() {
        setStatusFilter(defaultStatusFilter);
        setModeFilter("all");
        setMeetingTypeFilter("all");
        setStaffFilter("all");
        setStartDate("");
        setEndDate("");
        setQuery("");
        setDebouncedQuery("");
        setPage(1);
    }

    return (
        <div className="space-y-8">
            <ProductHero
                eyebrow="Bookings"
                title={heroTitle}
                subtitle={heroSubtitle}
                chips={
                    <span className="text-xs text-gray-500">
                        Times shown in {timezoneDisplay}.
                    </span>
                }
            />

            <FilterBar
                title="Filters"
                description={filterSubtitle}
                activeCount={activeFilterCount}
                onReset={resetFilters}
                contentClassName="xl:grid-cols-4"
            >
                {isApprovalsView ? (
                    <FilterField label="Status">
                        <div className={`${filterControlClassName} flex items-center font-medium`}>
                            Pending approval only
                        </div>
                    </FilterField>
                ) : (
                    <FilterField label="Status">
                        <select
                            className={filterControlClassName}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number]);
                                setPage(1);
                            }}
                        >
                            <option value="all">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="declined">Declined</option>
                            <option value="canceled">Canceled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </FilterField>
                )}

                <FilterField label="Mode">
                    <select
                        className={filterControlClassName}
                        value={modeFilter}
                        onChange={(e) => {
                            setModeFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All modes</option>
                        <option value="google_meet">Google Meet</option>
                        <option value="zoom">Zoom</option>
                        <option value="phone">Phone</option>
                        <option value="in_person">In person</option>
                    </select>
                </FilterField>

                <FilterField label="Meeting type">
                    <select
                        className={filterControlClassName}
                        value={meetingTypeFilter}
                        onChange={(e) => {
                            setMeetingTypeFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All meeting types</option>
                        {meetingTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.title}
                            </option>
                        ))}
                    </select>
                </FilterField>

                <FilterField label="Staff">
                    <select
                        className={filterControlClassName}
                        value={staffFilter}
                        onChange={(e) => {
                            setStaffFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All staff</option>
                        {staffUsers.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.name || staff.email}
                            </option>
                        ))}
                    </select>
                </FilterField>

                <FilterField
                    label="Date range"
                    className="xl:col-span-2"
                    hint="Leave either side empty to keep the range open."
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            type="date"
                            className={filterControlClassName}
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                        />
                        <Input
                            type="date"
                            className={filterControlClassName}
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </FilterField>

                <FilterField
                    label="Search"
                    className="xl:col-span-2"
                    hint="Customer name, email, phone, or meeting type."
                >
                    <Input
                        className={filterControlClassName}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search bookings..."
                    />
                </FilterField>
            </FilterBar>

            {loading && (
                <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
                    Loading bookings...
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {notice && (
                <div className="mt-6 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700">
                    {notice}
                </div>
            )}

            <MrtCardTable
                title={tableTitle}
                subtitle={tableSubtitle}
                table={{
                    columns,
                    data: filtered,
                    enablePagination: true,
                    enableSorting: true,
                    enableFilters: false,
                    enableColumnActions: true,
                    enableGlobalFilter: false,
                    enableDensityToggle: true,
                    enableFullScreenToggle: true,
                    enableTopToolbar: true,
                    enableHiding: true,
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

            {isApprovalsView && approvalTarget && (
                <Dialog open={approvalDialogOpen} onOpenChange={handleApprovalDialogOpenChange}>
                    <DialogContent className="w-[min(720px,94vw)] max-w-2xl top-[calc(var(--site-header-height)+1rem)] max-h-[calc(100dvh-var(--site-header-height)-2rem)] translate-y-0 overflow-y-auto overscroll-contain rounded-2xl border border-white/70 bg-white/95 p-0 shadow-2xl backdrop-blur data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4 dark:border-slate-700/60 dark:bg-slate-900/90">
                        <DialogHeader className="sticky top-0 z-10 space-y-2 border-b border-white/70 bg-white/95 px-6 pb-4 pt-5 pr-14 text-left backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/95">
                            <DialogTitle>
                                {approvalAction === "approve" ? "Approve booking" : "Decline booking"}
                            </DialogTitle>
                            <DialogDescription>
                                Confirm the decision for this pending booking request.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 px-6 py-5">
                            <div className="grid gap-4 rounded-2xl border border-white/70 bg-white/80 p-4 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                            Meeting
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                            {meetingTypeLookup.get(approvalTarget.meetingTypeId) ??
                                                formatKeyLabel(approvalTarget.meetingTypeKey ?? "Meeting")}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {formatModeLabel(approvalTarget.mode)}
                                            {approvalTarget.durationMin ? ` · ${approvalTarget.durationMin} min` : ""}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                            Customer
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                            {approvalTarget.userFullName || approvalTarget.userName || "Booking user"}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {approvalTarget.userEmail || "No email"}
                                            {approvalTarget.userPhone ? ` · ${approvalTarget.userPhone}` : ""}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                            Time
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                            {DateTime.fromJSDate(
                                                approvalTarget.startAtUtc instanceof Date
                                                    ? approvalTarget.startAtUtc
                                                    : new Date(approvalTarget.startAtUtc)
                                            )
                                                .setZone(timezoneDisplay)
                                                .toFormat("ccc, LLL dd · HH:mm")}
                                            {" - "}
                                            {DateTime.fromJSDate(
                                                approvalTarget.endAtUtc instanceof Date
                                                    ? approvalTarget.endAtUtc
                                                    : new Date(approvalTarget.endAtUtc)
                                            )
                                                .setZone(timezoneDisplay)
                                                .toFormat("HH:mm")}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {timezoneDisplay}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                            Payment
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                                            {getStatusDisplay(
                                                normalizePaymentStatus(
                                                    approvalTarget.paymentStatus ?? null,
                                                    approvalTarget.requiresPayment
                                                )
                                            )}
                                            {approvalTarget.paymentPolicy !== "FREE" &&
                                            formatMoney(
                                                approvalTarget.priceCents,
                                                approvalTarget.currency
                                            )
                                                ? ` · ${formatMoney(
                                                      approvalTarget.priceCents,
                                                      approvalTarget.currency
                                                  )}`
                                                : ""}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            Policy: {formatPaymentPolicyLabel(approvalTarget.paymentPolicy)}
                                        </p>
                                    </div>
                                </div>

                                {approvalAction === "approve" &&
                                    approvalTarget.paymentPolicy !== "FREE" &&
                                    approvalTarget.paymentStatus !== "paid" && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                            This paid booking cannot be approved until payment is confirmed.
                                        </div>
                                    )}
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Internal note
                                </label>
                                <Input
                                    className={filterControlClassName}
                                    value={approvalNote}
                                    onChange={(event) => setApprovalNote(event.target.value)}
                                    placeholder="Optional approval note"
                                    maxLength={300}
                                />
                            </div>

                            {approvalError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {approvalError}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="sticky bottom-0 border-t border-white/70 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/95">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleApprovalDialogOpenChange(false)}
                                disabled={approvalSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant={approvalAction === "approve" ? "default" : "destructive"}
                                onClick={submitApprovalAction}
                                disabled={approvalSubmitting}
                            >
                                {approvalSubmitting
                                    ? approvalAction === "approve"
                                        ? "Approving..."
                                        : "Declining..."
                                    : approvalAction === "approve"
                                    ? "Approve booking"
                                    : "Decline booking"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
