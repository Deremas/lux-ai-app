"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import Badge, { BookingStatus } from "@/components/scheduling/Badge";
import ProductHero from "@/components/scheduling/ProductHero";
import CompactSectionNav from "@/components/scheduling/CompactSectionNav";
import type { MRT_ColumnDef } from "material-react-table";

type Props = {
    orgId: string;
    tz?: string;
};

type StaffUser = {
    id: string;
    orgId: string;
    userId: string;
    role: "admin" | "staff" | "customer";
    name: string | null;
    email: string | null;
    phone: string | null;
    timezone: string | null;
    createdAt: string;
};

const ROLE_OPTIONS = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "staff", label: "Staff" },
    { value: "customer", label: "Customer" },
] as const;

export default function StaffCalendarsClient({ orgId, tz }: Props) {
    const { status } = useSession();
    const [items, setItems] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("all");
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
        setSuccess(null);

        const params = new URLSearchParams({
            orgId,
            role: roleFilter === "all" ? "" : roleFilter,
            query: debouncedQuery,
            page: String(page),
            pageSize: String(pageSize),
        });

        fetch(`/api/scheduling/admin/staff-users?${params}`, {
            cache: "no-store",
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (cancelled) return;
                if (!ok) {
                    setError(data?.error ?? "Failed to load staff users");
                    return;
                }
                setItems((data?.items ?? []) as StaffUser[]);
                setTotal(data?.total ?? 0);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load staff users");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [orgId, roleFilter, debouncedQuery, page, pageSize, status]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (roleFilter !== "all" && item.role !== roleFilter) return false;
            if (debouncedQuery) {
                const q = debouncedQuery.toLowerCase();
                return (
                    (item.name?.toLowerCase() || "").includes(q) ||
                    (item.email?.toLowerCase() || "").includes(q) ||
                    (item.phone?.toLowerCase() || "").includes(q)
                );
            }
            return true;
        });
    }, [items, roleFilter, debouncedQuery]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const columns = useMemo<MRT_ColumnDef<StaffUser>[]>(() => [
        {
            accessorKey: "name",
            header: "Name",
            Cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {row.original.name || "No name"}
                    </div>
                    {row.original.email && (
                        <div className="text-xs text-gray-500">
                            {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            Cell: ({ row }) => (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                    {row.original.email || "—"}
                </div>
            ),
        },
        {
            accessorKey: "phone",
            header: "Phone",
            Cell: ({ row }) => (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                    {row.original.phone || "—"}
                </div>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            Cell: ({ row }) => (
                <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
                    {row.original.role}
                </Badge>
            ),
        },
        {
            accessorKey: "timezone",
            header: "Timezone",
            Cell: ({ row }) => (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                    {row.original.timezone || "UTC"}
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Joined",
            Cell: ({ row }) => {
                const created = new Date(row.original.createdAt);
                return (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        {created.toLocaleDateString()}
                    </div>
                );
            },
        },
        {
            accessorKey: "actions",
            header: "Actions",
            Cell: ({ row }) => (
                <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/scheduling/staff/${row.original.id}`}>
                        View details
                    </Link>
                </Button>
            ),
        },
    ], [timezoneDisplay]);

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
                eyebrow="Staff Management"
                title="Staff Users"
                subtitle="Manage staff accounts and permissions"
                chips={
                    <span className="text-xs text-gray-500">
                        Times shown in {timezoneDisplay}.
                    </span>
                }
            />

            <CompactSectionNav
                items={[
                    {
                        id: "staff-users",
                        label: "Staff Users",
                        href: "/admin/scheduling/staff#staff-users",
                        isActive: true,
                    },
                    {
                        id: "staff-calendars",
                        label: "Staff Calendars",
                        href: "/admin/scheduling/staff#staff-calendars",
                        isActive: false,
                    },
                    {
                        id: "customers",
                        label: "Customers",
                        href: "/admin/scheduling/customers",
                        isActive: false,
                    },
                ]}
            />

            <FilterBar>
                <select
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
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
                    Loading staff users...
                </div>
            )}

            {success && (
                <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <MrtCardTable
                title="Staff Users"
                subtitle={`${filtered.length} of ${total} users`}
                table={{
                    columns,
                    data: filtered,
                    enablePagination: true,
                    enableSorting: true,
                    enableFilters: true,
                    initialState: {
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
                            No staff users found.
                        </div>
                    ),
                }}
            />
        </div>
    );
}
