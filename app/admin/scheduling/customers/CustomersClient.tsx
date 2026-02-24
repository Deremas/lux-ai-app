// app/admin/scheduling/customers/CustomersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { useSession, signIn } from "next-auth/react";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import ProductHero from "@/components/scheduling/ProductHero";

type Props = {
  orgId: string;
  tz?: string;
};

type Customer = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  timezone: string | null;
  role: string;
  createdAt: string | Date;
};

function resolvePagination(
  updaterOrValue: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState),
  prev: MRT_PaginationState
) {
  return typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
}

export default function CustomersClient({ orgId, tz }: Props) {
  const { status } = useSession();

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return "UTC";
  }, [tz]);

  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pageIndex, setPageIndex] = useState(0); // MRT 0-based
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(h);
  }, [query]);

  useEffect(() => {
    setPageIndex(0);
  }, [pageSize, debouncedQuery]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL("/api/scheduling/admin/users", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("role", "customer");
    url.searchParams.set("page", String(pageIndex + 1));
    url.searchParams.set("pageSize", String(pageSize));
    if (debouncedQuery) url.searchParams.set("q", debouncedQuery);

    fetch(url.toString(), { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load customers");
          return;
        }
        setItems((data?.items ?? []) as Customer[]);
        setTotal(Number(data?.total ?? 0));
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load customers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status, pageIndex, pageSize, debouncedQuery]);

  const columns = useMemo<MRT_ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-white">
              {row.original.name || row.original.email}
            </div>
            <div className="truncate text-xs text-gray-600 dark:text-gray-300">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "timezone",
        header: "Timezone",
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.original.timezone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        Cell: ({ row }) => {
          const created = DateTime.fromJSDate(
            row.original.createdAt instanceof Date ? row.original.createdAt : new Date(row.original.createdAt)
          ).setZone(timezone);
          return <span className="text-sm text-gray-700 dark:text-gray-200">{created.toFormat("LLL dd, yyyy")}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/scheduling/customers/${row.original.id}`}>View</Link>
          </Button>
        ),
      },
    ],
    [timezone]
  );

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sign in to view customers</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Admin access is required.</p>
          <Button className="mt-6" onClick={() => signIn(undefined, { callbackUrl: "/admin/scheduling/customers" })}>
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
        eyebrow="Customers"
        title="Customer management"
        subtitle="View and manage customer accounts"
        chips={<span className="text-xs text-gray-500">Times shown in {timezone}.</span>}
      />

      <FilterBar>
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <MrtCardTable
        title="Customers"
        subtitle={total ? `Showing ${items.length} of ${total}` : "No customers found."}
        table={{
          columns,
          data: items,
          enableSorting: false,
          enableColumnFilters: false,
          enableGlobalFilter: false,

          manualPagination: true,
          rowCount: total,

          state: {
            isLoading: loading,
            pagination: { pageIndex, pageSize },
          },

          onPaginationChange: (updaterOrValue) => {
            const next = resolvePagination(updaterOrValue, { pageIndex, pageSize });
            if (next.pageSize !== pageSize) setPageSize(next.pageSize);
            if (next.pageIndex !== pageIndex) setPageIndex(next.pageIndex);
          },

          renderEmptyRowsFallback: () => (
            <div className="p-4 text-sm text-gray-600">No customers found.</div>
          ),
        }}
      />
    </div>
  );
}
