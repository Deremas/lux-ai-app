"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import AvailabilityCalendar from "@/components/scheduling/AvailabilityCalendar";
import Link from "next/link";
import Badge, { type BookingStatus, getStatusDisplay } from "@/components/scheduling/Badge";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import type { MRT_ColumnDef, MRT_PaginationState } from "material-react-table";

type Props = {
  orgId: string;
  tz?: string;
};

type Booking = {
  id: string;
  status: string;
  startAtUtc: string | Date;
  endAtUtc: string | Date;
  meetingTypeId: string;
  staffUserId?: string | null;
  meetingTypeKey: string | null;
  meetingTypeTitle?: string | null;
  durationMin: number | null;
  mode: string;
  meetingLink?: string | null;
  phone?: string | null;
  notes?: string | null;
  paymentPolicy?: string | null;
  paymentStatus?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  createdAt: string | Date;
};

function formatIcsUtc(dtIso: string) {
  return DateTime.fromISO(dtIso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function buildGoogleCalendarUrl(args: {
  title: string;
  details: string;
  startUtc: string;
  endUtc: string;
}) {
  const start = formatIcsUtc(args.startUtc);
  const end = formatIcsUtc(args.endUtc);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    details: args.details,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatPrice(priceCents: number | null, currency: string | null) {
  if (!priceCents || !currency) return null;
  try {
    return new Intl.NumberFormat("en", {
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

function resolvePagination(
  updaterOrValue: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState),
  prev: MRT_PaginationState
) {
  return typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
}

export default function DashboardClient({ orgId }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<{
    startUtc: string;
    endUtc: string;
  } | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [requestTarget, setRequestTarget] = useState<Booking | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailTarget, setDetailTarget] = useState<Booking | null>(null);
  const modalOpen = Boolean(rescheduleTarget || detailTarget || requestTarget);

  const timezone = useMemo(() => "Europe/Luxembourg", []);
  const displayName = "Lux AI Admin";

  const bookingColumns = useMemo<MRT_ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "meetingTypeKey",
        header: "Meeting",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-white">
              {formatKeyLabel(
                row.original.meetingTypeTitle ??
                  row.original.meetingTypeKey ??
                  "Meeting"
              )}{" "}
              · {row.original.mode}
            </div>
            {row.original.durationMin && (
              <div className="text-xs text-gray-500">
                {row.original.durationMin} min
              </div>
            )}
          </div>
        ),
      },
      {
        id: "time",
        header: "Time",
        Cell: ({ row }) => {
          const start = DateTime.fromJSDate(
            row.original.startAtUtc instanceof Date
              ? row.original.startAtUtc
              : new Date(row.original.startAtUtc)
          ).setZone(timezone);
          const end = DateTime.fromJSDate(
            row.original.endAtUtc instanceof Date
              ? row.original.endAtUtc
              : new Date(row.original.endAtUtc)
          ).setZone(timezone);
          return (
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {start.toFormat("ccc, LLL dd")} · {start.toFormat("HH:mm")}–
              {end.toFormat("HH:mm")}
            </div>
          );
        },
      },
      {
        id: "links",
        header: "Links",
        Cell: ({ row }) => {
          const item = row.original;
          const calendarLink = buildGoogleCalendarUrl({
            title: `${formatKeyLabel(
              item.meetingTypeTitle ?? item.meetingTypeKey ?? "Meeting"
            )} · ${item.mode}`,
            details: [
              `Mode: ${item.mode}`,
              item.meetingLink && item.status === "confirmed"
                ? `Meeting link: ${item.meetingLink}`
                : "",
              item.phone ? `Phone: ${item.phone}` : "",
              "Lux AI meeting",
            ]
              .filter(Boolean)
              .join("\n"),
            startUtc:
              item.startAtUtc instanceof Date
                ? item.startAtUtc.toISOString()
                : new Date(item.startAtUtc).toISOString(),
            endUtc:
              item.endAtUtc instanceof Date
                ? item.endAtUtc.toISOString()
                : new Date(item.endAtUtc).toISOString(),
          });

          return (
            <div className="space-y-1 text-xs">
              {item.mode === "phone" && item.phone && (
                <a className="text-blue-600 hover:underline" href={`tel:${item.phone}`}>
                  Call {item.phone}
                </a>
              )}
              {item.mode !== "phone" &&
                item.mode !== "in_person" &&
                item.meetingLink &&
                item.status === "confirmed" && (
                  <a
                    className="block text-blue-600 hover:underline"
                    href={item.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join meeting link
                  </a>
                )}
              <a
                className="block text-blue-600 hover:underline"
                href={calendarLink}
                target="_blank"
                rel="noreferrer"
              >
                Add to calendar
              </a>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          const status = row.original.status as BookingStatus;
          return (
            <Badge variant={status}>
              {getStatusDisplay(status)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => {
          const item = row.original;
          const createdAt = DateTime.fromJSDate(
            item.createdAt instanceof Date
              ? item.createdAt
              : new Date(item.createdAt)
          ).toUTC();
          const canReschedule =
            ["pending", "confirmed"].includes(item.status) &&
            DateTime.utc() <= createdAt.plus({ hours: 1 });

          return (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDetailTarget(item)}>
                View details
              </Button>
              {["pending", "confirmed"].includes(item.status) && (
                <>
                  {canReschedule ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRescheduleTarget(item);
                        setRescheduleSlot(null);
                        setRescheduleError(null);
                      }}
                    >
                      Reschedule
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRequestTarget(item);
                        setRequestNote("");
                        setRequestError(null);
                      }}
                    >
                      Request reschedule
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      },
    ],
    [timezone]
  );

  const pagination = useMemo(
    () => ({ pageIndex: page - 1, pageSize }),
    [page, pageSize]
  );

  const detailCalendarLink = useMemo(() => {
    if (!detailTarget) return null;
    const startUtc =
      detailTarget.startAtUtc instanceof Date
        ? detailTarget.startAtUtc.toISOString()
        : new Date(detailTarget.startAtUtc).toISOString();
    const endUtc =
      detailTarget.endAtUtc instanceof Date
        ? detailTarget.endAtUtc.toISOString()
        : new Date(detailTarget.endAtUtc).toISOString();
    return buildGoogleCalendarUrl({
      title: `${formatKeyLabel(
        detailTarget.meetingTypeTitle ?? detailTarget.meetingTypeKey ?? "Meeting"
      )} · ${detailTarget.mode}`,
      details: [
        `Mode: ${detailTarget.mode}`,
        detailTarget.meetingLink && detailTarget.status === "confirmed"
          ? `Meeting link: ${detailTarget.meetingLink}`
          : "",
        detailTarget.phone ? `Phone: ${detailTarget.phone}` : "",
        "Lux AI meeting",
      ]
        .filter(Boolean)
        .join("\n"),
      startUtc,
      endUtc,
    });
  }, [detailTarget]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL("/api/scheduling/me/appointments", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));

    fetch(url.toString(), {
      cache: "no-store",
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load bookings");
          return;
        }
        setItems((data?.items as Booking[]) ?? []);
        setTotal(Number(data?.total ?? data?.items?.length ?? 0));
        setTotalPages(Number(data?.totalPages ?? 1));
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
  }, [orgId, status, page, pageSize]);

  useEffect(() => {
    if (!rescheduleTarget && !requestTarget && !detailTarget) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setRescheduleTarget(null);
      setRescheduleSlot(null);
      setRescheduleError(null);
      setDetailTarget(null);
      setRequestTarget(null);
      setRequestNote("");
      setRequestError(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [rescheduleTarget, requestTarget, detailTarget]);

  useEffect(() => {
    if (!modalOpen) return;
    const html = document.documentElement;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [modalOpen]);

  const handleRescheduleConfirm = async () => {
    if (!rescheduleTarget || !rescheduleSlot) return;
    setRescheduleLoading(true);
    setRescheduleError(null);
    try {
      const res = await fetch(
        `/api/scheduling/appointments/${rescheduleTarget.id}/reschedule`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orgId,
            startUtc: rescheduleSlot.startUtc,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRescheduleError(json?.error ?? "Reschedule failed");
        return;
      }
      setRescheduleTarget(null);
      setRescheduleSlot(null);
      const refreshUrl = new URL(
        "/api/scheduling/me/appointments",
        window.location.origin
      );
      refreshUrl.searchParams.set("orgId", orgId);
      refreshUrl.searchParams.set("page", String(page));
      refreshUrl.searchParams.set("pageSize", String(pageSize));
      await fetch(refreshUrl.toString(), { cache: "no-store" })
        .then((res2) => res2.json().then((data) => ({ ok: res2.ok, data })))
        .then(({ ok, data }) => {
          if (ok) {
            setItems((data?.items as Booking[]) ?? []);
            setTotal(Number(data?.total ?? data?.items?.length ?? 0));
            setTotalPages(Number(data?.totalPages ?? 1));
          }
        });
    } catch {
      setRescheduleError("Reschedule failed");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRequestReschedule = async () => {
    if (!requestTarget) return;
    setRequestLoading(true);
    setRequestError(null);
    try {
      const res = await fetch(
        `/api/scheduling/appointments/${requestTarget.id}/reschedule-request`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orgId,
            reason: requestNote.trim() || undefined,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(json?.error ?? "Request failed");
        return;
      }
      setRequestTarget(null);
      setRequestNote("");
    } catch {
      setRequestError("Request failed");
    } finally {
      setRequestLoading(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to view your bookings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Access your appointment history and upcoming sessions.
          </p>
          <Button
            className="mt-6"
            onClick={() => signIn(undefined, { callbackUrl: "/scheduling/my" })}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Bookings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          Your booking history
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Times shown in Europe/Luxembourg.
        </p>
        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Welcome, {displayName}
        </p>
      </div>

      <section className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <MrtCardTable
          title="Booking history"
          subtitle="Review upcoming and past sessions."
          table={{
            columns: bookingColumns,
            data: items,
            manualPagination: true,
            rowCount: total,
            enableColumnActions: false,
            enableColumnFilters: false,
            enableGlobalFilter: false,
            enableDensityToggle: false,
            enableFullScreenToggle: false,
            enableTopToolbar: false,
            state: {
              isLoading: loading,
              pagination,
            },
            onPaginationChange: (updaterOrValue) => {
              const next = resolvePagination(updaterOrValue, pagination);
              if (next.pageSize !== pageSize) {
                setPageSize(next.pageSize);
                setPage(1);
                return;
              }
              if (next.pageIndex !== pagination.pageIndex) {
                setPage(next.pageIndex + 1);
              }
            },
            renderEmptyRowsFallback: () => (
              <div className="p-4 text-sm text-gray-600">
                No bookings yet. Ready to schedule one?
              </div>
            ),
          }}
        />
      </section>
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="flex max-h-[85vh] flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/70 px-6 py-5 dark:border-slate-700/60">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Reschedule
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                    Choose a new time
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Pick a new slot for{" "}
                    {formatKeyLabel(
                      rescheduleTarget.meetingTypeKey ?? "your meeting"
                    )}
                    .
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRescheduleTarget(null);
                    setRescheduleSlot(null);
                    setRescheduleError(null);
                  }}
                >
                  Close
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                <div>
                  <AvailabilityCalendar
                    orgId={orgId}
                    meetingTypeId={rescheduleTarget.meetingTypeId}
                    staffUserId={rescheduleTarget.staffUserId ?? undefined}
                    tz={timezone}
                    displayTz={timezone}
                    minLeadMinutes={120}
                    initialDate={
                      rescheduleTarget.startAtUtc instanceof Date
                        ? rescheduleTarget.startAtUtc.toISOString()
                        : new Date(rescheduleTarget.startAtUtc).toISOString()
                    }
                    onSelectSlot={(slot) => {
                      setRescheduleSlot({
                        startUtc: slot.startUtc,
                        endUtc: slot.endUtc,
                      });
                    }}
                  />
                </div>

                {rescheduleError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {rescheduleError}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    {rescheduleSlot ? (
                      <>
                        Selected:{" "}
                        {DateTime.fromISO(rescheduleSlot.startUtc)
                          .setZone(timezone)
                          .toFormat("ccc, LLL dd HH:mm")}{" "}
                        –{" "}
                        {DateTime.fromISO(rescheduleSlot.endUtc)
                          .setZone(timezone)
                          .toFormat("HH:mm")}
                      </>
                    ) : (
                      "Select a slot to continue."
                    )}
                  </div>
                  <Button
                    onClick={handleRescheduleConfirm}
                    disabled={!rescheduleSlot || rescheduleLoading}
                  >
                    {rescheduleLoading ? "Rescheduling..." : "Confirm reschedule"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="flex max-h-[85vh] flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/70 px-6 py-5 dark:border-slate-700/60">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Booking details
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatKeyLabel(
                      detailTarget.meetingTypeTitle ??
                        detailTarget.meetingTypeKey ??
                        "Meeting"
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Status: {detailTarget.status}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setDetailTarget(null)}
                >
                  Close
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                      Time
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                      {DateTime.fromJSDate(
                        detailTarget.startAtUtc instanceof Date
                          ? detailTarget.startAtUtc
                          : new Date(detailTarget.startAtUtc)
                      )
                        .setZone(timezone)
                        .toFormat("ccc, LLL dd · HH:mm")}
                      {" – "}
                      {DateTime.fromJSDate(
                        detailTarget.endAtUtc instanceof Date
                          ? detailTarget.endAtUtc
                          : new Date(detailTarget.endAtUtc)
                      )
                        .setZone(timezone)
                        .toFormat("HH:mm")}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{timezone}</p>
                    {detailTarget.durationMin && (
                      <p className="mt-2 text-xs text-gray-500">
                        Duration: {detailTarget.durationMin} min
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                      Mode
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                      {detailTarget.mode}
                    </p>
                    {detailTarget.meetingLink &&
                      detailTarget.status === "confirmed" && (
                      <a
                        className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                        href={detailTarget.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join meeting link
                      </a>
                    )}
                    {detailTarget.mode === "phone" && detailTarget.phone && (
                      <a
                        className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                        href={`tel:${detailTarget.phone}`}
                      >
                        Call {detailTarget.phone}
                      </a>
                    )}
                    {detailCalendarLink && (
                      <a
                        className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                        href={detailCalendarLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Add to calendar
                      </a>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
                      Payment
                    </p>
                    <p className="mt-2 text-base font-semibold text-emerald-900">
                      {formatPrice(detailTarget.priceCents ?? null, detailTarget.currency ?? null) ??
                        "—"}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Status: {detailTarget.paymentStatus ?? "n/a"}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Policy: {detailTarget.paymentPolicy ?? "n/a"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white/80 p-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                      Notes
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {detailTarget.notes ?? "No notes captured."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/scheduling">
                      Book another session
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
            <div className="text-lg font-semibold text-gray-900">
              Request reschedule
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Send a reschedule request to the admin/staff. They will contact you.
            </p>
            <div className="mt-4 rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-gray-700 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
              <div className="font-semibold text-gray-900">
                {formatKeyLabel(
                  requestTarget.meetingTypeTitle ??
                    requestTarget.meetingTypeKey ??
                    "Meeting"
                )}{" "}
                · {requestTarget.mode}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {DateTime.fromJSDate(
                  requestTarget.startAtUtc instanceof Date
                    ? requestTarget.startAtUtc
                    : new Date(requestTarget.startAtUtc)
                )
                  .setZone(timezone)
                  .toFormat("ccc, LLL dd · HH:mm")}
                {" – "}
                {DateTime.fromJSDate(
                  requestTarget.endAtUtc instanceof Date
                    ? requestTarget.endAtUtc
                    : new Date(requestTarget.endAtUtc)
                )
                  .setZone(timezone)
                  .toFormat("HH:mm")}{" "}
                · {timezone}
              </div>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Note (optional)
            </label>
            <textarea
              className="mt-2 w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-100"
              rows={4}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
            />
            {requestError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {requestError}
              </div>
            )}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setRequestTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleRequestReschedule} disabled={requestLoading}>
                {requestLoading ? "Sending..." : "Send request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

