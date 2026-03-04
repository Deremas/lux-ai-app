// app/admin/scheduling/audit/AuditLogClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import FilterBar from "@/components/scheduling/FilterBar";
import ProductHero from "@/components/scheduling/ProductHero";

type Props = {
  orgId: string;
  orgName: string | null;
  tz: string;
};

type AuditRow = {
  id: string;
  orgId: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before: unknown | null;
  after: unknown | null;
  createdAt: string | Date;
  actor?: { id: string; name: string | null; email: string | null } | null;
};

function formatWhen(value: string | Date, tz: string) {
  const dt = DateTime.fromJSDate(value instanceof Date ? value : new Date(value)).setZone(tz);
  return dt.toFormat("LLL dd, yyyy · HH:mm");
}

function jsonString(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "Unable to render JSON";
  }
}

function resolvePagination(
  updaterOrValue: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState),
  prev: MRT_PaginationState
) {
  return typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
}

export default function AuditLogClient({ orgId, orgName, tz }: Props) {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MRT uses 0-based pageIndex; API uses 1-based page
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(h);
  }, [query]);

  // reset page on filter changes
  useEffect(() => {
    setPageIndex(0);
  }, [debouncedQuery, entityType, action, actorUserId, from, to, pageSize]);

  const summary = useMemo(() => {
    if (!total) return "No audit entries yet.";
    return `${total} entries`;
  }, [total]);

  const entityTypeOptions = useMemo(() => {
    const set = new Set(items.map((r) => r.entityType).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const actionOptions = useMemo(() => {
    const set = new Set(items.map((r) => r.action).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL("/api/scheduling/admin/audit", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("page", String(pageIndex + 1));
    url.searchParams.set("pageSize", String(pageSize));

    if (debouncedQuery) url.searchParams.set("q", debouncedQuery);
    if (entityType) url.searchParams.set("entityType", entityType);
    if (action) url.searchParams.set("action", action);
    if (actorUserId) url.searchParams.set("actorUserId", actorUserId);
    if (from) url.searchParams.set("from", from);
    if (to) url.searchParams.set("to", to);

    fetch(url.toString(), { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load audit log");
          return;
        }
        setItems((data?.items ?? []) as AuditRow[]);
        setTotal(Number(data?.total ?? 0));
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load audit log");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, pageIndex, pageSize, debouncedQuery, entityType, action, actorUserId, from, to]);

  const columns = useMemo<MRT_ColumnDef<AuditRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "When",
        size: 180,
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {formatWhen(row.original.createdAt, tz)}
          </span>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        size: 220,
        Cell: ({ row }) => {
          const a = row.original.actor;
          return (
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900 dark:text-white">
                {a?.name ?? "System"}
              </div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                {a?.email ?? row.original.actorUserId ?? "n/a"}
              </div>
            </div>
          );
        },
      },
      { accessorKey: "action", header: "Action", size: 220 },
      { accessorKey: "entityType", header: "Entity", size: 160 },
      {
        accessorKey: "entityId",
        header: "Entity ID",
        size: 260,
        Cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-700 dark:text-gray-200">
            {row.original.entityId}
          </span>
        ),
      },
    ],
    [tz]
  );

  return (
    <div className="space-y-8">
      <ProductHero
        eyebrow="Scheduling Admin"
        title="Audit log"
        subtitle={`${orgName ? `${orgName} · ` : ""}Times shown in ${tz}.`}
        chips={<span className="text-xs text-gray-500">{summary}</span>}
      />

      <FilterBar>
        <Input
          className="h-9"
          placeholder="Search entity, action, actor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">All entity types</option>
          {entityTypeOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="h-9 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">All actions</option>
          {actionOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <Input
          className="h-9"
          placeholder="Actor user id"
          value={actorUserId}
          onChange={(e) => setActorUserId(e.target.value)}
        />

        <Input type="date" className="h-9" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" className="h-9" value={to} onChange={(e) => setTo(e.target.value)} />
      </FilterBar>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <MrtCardTable
        title="Audit entries"
        subtitle={total ? `Showing ${items.length} of ${total}` : "No audit entries found."}
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

          renderDetailPanel: ({ row }) => (
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Before</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/70 bg-white/80 p-3 text-xs text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                  {jsonString(row.original.before)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">After</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/70 bg-white/80 p-3 text-xs text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                  {jsonString(row.original.after)}
                </pre>
              </div>
            </div>
          ),

          renderEmptyRowsFallback: () => (
            <div className="p-4 text-sm text-gray-600">No audit entries found.</div>
          ),
        }}
      />
    </div>
  );
}
