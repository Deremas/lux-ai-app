"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function CustomersClient({ orgId, tz }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL("/api/scheduling/admin/users", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("role", "customer");
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (debouncedQuery) {
      url.searchParams.set("q", debouncedQuery);
    }
    fetch(url.toString(), {
      cache: "no-store",
    })
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
  }, [orgId, status, page, pageSize, debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to view customers
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required.
          </p>
          <Button
            className="mt-6"
            onClick={() => signIn(undefined, { callbackUrl: "/admin/scheduling/customers" })}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Registered customers in this org. Times shown in {timezone}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/scheduling?orgId=${encodeURIComponent(orgId)}`}>
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {total ? `Total customers: ${total}` : "No customers yet."}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Input
              className="h-9 w-56"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone..."
            />
            <span className="text-gray-500">Rows:</span>
            <select
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900"
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
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Loading customers...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            No customers yet.
          </div>
        )}

        <div className="mt-4 grid gap-4">
          {items.map((item) => {
            const created = DateTime.fromJSDate(
              item.createdAt instanceof Date
                ? item.createdAt
                : new Date(item.createdAt)
            ).setZone(timezone);
            return (
              <Link
                key={item.id}
                href={`/admin/scheduling/customers/${item.id}?orgId=${encodeURIComponent(
                  orgId
                )}`}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm transition hover:border-gray-400 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name || item.email}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {item.email}
                    </p>
                    {item.phone && (
                      <a
                        className="mt-1 block text-xs text-blue-600 hover:underline"
                        href={`tel:${item.phone}`}
                      >
                        {item.phone}
                      </a>
                    )}
                    {item.timezone && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        TZ: {item.timezone}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">
                    Joined {created.toFormat("LLL dd, yyyy")}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            Page {page} of {totalPages}
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
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
