"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  orgId: string;
  orgName: string | null;
  tz: string;
  returnTo: string;
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
  const dt = DateTime.fromJSDate(
    value instanceof Date ? value : new Date(value),
  ).setZone(tz);
  return dt.toFormat("LLL dd, yyyy · HH:mm");
}

function jsonString(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "Unable to render JSON";
  }
}

export default function AuditLogClient({ orgId, orgName, tz, returnTo }: Props) {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const summary = useMemo(() => {
    if (!total) return "No audit entries yet.";
    return `${total} entries`;
  }, [total]);

  const entityTypeOptions = useMemo(() => {
    const set = new Set(items.map((row) => row.entityType).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const actionOptions = useMemo(() => {
    const set = new Set(items.map((row) => row.action).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL(
      "/api/scheduling/admin/audit",
      window.location.origin,
    );
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (query) url.searchParams.set("q", query);
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
  }, [orgId, page, pageSize, query, entityType, action, actorUserId, from, to]);

  if (!orgId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No org found for this account.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Scheduling Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              Audit log
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {orgName ? `${orgName} · ` : ""}
              Times shown in {tz}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={returnTo}>Back to dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search entity, action, or actor"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All entity types</option>
            {entityTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Input
            placeholder="Actor user id"
            value={actorUserId}
            onChange={(e) => {
              setActorUserId(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Loading audit log...
          </p>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            No audit entries found.
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Id</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const expanded = expandedId === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 bg-white">
                        <td className="px-4 py-3 text-gray-700">
                          {formatWhen(row.createdAt, tz)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-medium">
                            {row.actor?.name ?? "System"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.actor?.email ?? row.actorUserId ?? "n/a"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.action}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.entityType}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.entityId}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedId(expanded ? null : row.id)
                            }
                          >
                            {expanded ? "Hide" : "View"}
                          </Button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-t border-gray-100 bg-gray-50/60">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="text-xs font-semibold uppercase text-gray-500">
                                  Before
                                </p>
                                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">
                                  {jsonString(row.before)}
                                </pre>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase text-gray-500">
                                  After
                                </p>
                                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">
                                  {jsonString(row.after)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span>{summary}</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Rows
            </label>
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
