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
import SearchablePhoneInput from "@/components/PhoneInputField";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

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

type UserForm = {
    name: string;
    email: string;
    phone: string;
    timezone: string;
    role: "admin" | "staff" | "customer";
    password: string;
};

function emptyUserForm(): UserForm {
    return {
        name: "",
        email: "",
        phone: "",
        timezone: "Europe/Luxembourg",
        role: "staff",
        password: "",
    };
}

function resolvePagination(
    updaterOrValue: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState),
    prev: MRT_PaginationState
) {
    return typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
}

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
    const [reloadKey, setReloadKey] = useState(0);
    const [timezone, setTimezone] = useState(tz || "UTC");
    const [form, setForm] = useState<UserForm>(emptyUserForm());
    const [creating, setCreating] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const timezoneDisplay = useMemo(() => {
        if (tz) return tz;
        if (typeof Intl !== "undefined") {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        }
        return "UTC";
    }, [tz]);

    const timezones = useMemo<string[]>(() => {
        const fallback = [
            "UTC",
            "Europe/Luxembourg",
            "Europe/Paris",
            "Africa/Nairobi",
            "Africa/Addis_Ababa",
            "America/New_York",
            "Asia/Dubai",
            "Asia/Singapore",
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

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!orgId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setSuccess(null);

        const params = new URLSearchParams({
            orgId,
            page: String(page),
            pageSize: String(pageSize),
        });
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (debouncedQuery) params.set("q", debouncedQuery);

        fetch(`/api/scheduling/admin/users?${params}`, {
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
    }, [orgId, roleFilter, debouncedQuery, page, pageSize, status, reloadKey]);

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

    const pagination = useMemo(
        () => ({ pageIndex: page - 1, pageSize }),
        [page, pageSize]
    );

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

    async function handleCreateUser() {
        if (!orgId) return;
        setActionError(null);
        setActionSuccess(null);

        const email = form.email.trim().toLowerCase();
        const password = form.password.trim();
        if (!email) {
            setActionError("Email is required.");
            return;
        }
        if (!password || password.length < 8) {
            setActionError("Temporary password must be at least 8 characters.");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/scheduling/admin/users", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    email,
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    timezone: form.timezone.trim(),
                    role: form.role,
                    password,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setActionError(data?.error ?? "Failed to add user");
                return;
            }
            setActionSuccess("User created.");
            setForm(emptyUserForm());
            setPage(1);
            setReloadKey((k) => k + 1);
        } catch {
            setActionError("Failed to add user");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="space-y-8">
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
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
                    className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, phone..."
                />
            </FilterBar>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-4">
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
                                    No staff users found.
                                </div>
                            ),
                        }}
                    />
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add user
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Create admin, staff, or customer accounts.
                    </p>
                    <div className="mt-4 space-y-3 text-sm">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Full name
                            </label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="Full name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Email
                            </label>
                            <Input
                                value={form.email}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Phone
                            </label>
                            <SearchablePhoneInput
                                value={form.phone}
                                onChange={(value) =>
                                    setForm((prev) => ({ ...prev, phone: value }))
                                }
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Timezone
                            </label>
                            <select
                                className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={form.timezone}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        timezone: e.target.value,
                                    }))
                                }
                            >
                                {timezones.map((zone) => (
                                    <option key={zone} value={zone}>
                                        {zone}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Role
                            </label>
                            <select
                                className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={form.role}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        role: e.target.value as UserForm["role"],
                                    }))
                                }
                            >
                                <option value="admin">admin</option>
                                <option value="staff">staff</option>
                                <option value="customer">customer</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Temporary password
                            </label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, password: e.target.value }))
                                }
                                placeholder="Min 8 characters"
                            />
                        </div>

                        {actionError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {actionError}
                            </div>
                        )}
                        {actionSuccess && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                {actionSuccess}
                            </div>
                        )}

                        <div className="flex items-center justify-end">
                            <Button type="button" onClick={handleCreateUser} disabled={creating}>
                                {creating ? "Creating..." : "Add user"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
