"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";
import {
  Bell,
  MailCheck,
  MailX,
  Clock,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import KpiCard from "@/components/scheduling/KpiCard";
import Badge, { BookingStatus } from "@/components/scheduling/Badge";
import type { MRT_ColumnDef } from "material-react-table";

type Props = {
  orgId: string;
  orgName: string | null;
  tz: string;
};

type Booking = {
  id: string;
  status: string;
  startAtUtc: string | Date;
  endAtUtc: string | Date;
  meetingTypeKey: string | null;
  durationMin: number | null;
  mode: string;
};

type Profile = {
  name: string | null;
  phone: string | null;
  timezone: string | null;
  email: string | null;
};

function buildLink(base: string) {
  return base;
}

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

export default function AdminDashboardClient({ orgId, orgName, tz }: Props) {
  const { status, data: session } = useSession();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedNotifs, setFailedNotifs] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<
    Array<{
      id: string;
      appointmentId: string;
      toAddress: string | null;
      templateKey: string | null;
      status: string;
      error: string | null;
      createdAt: string | Date;
      meetingTypeKey: string | null;
      apptStatus: string;
      startAtUtc: string | Date;
      seen: boolean;
    }>
  >([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<null | {
    id: string;
    appointmentId: string;
    toAddress: string | null;
    templateKey: string | null;
    status: string;
    error: string | null;
    createdAt: string | Date;
    meetingTypeKey: string | null;
    apptStatus: string;
    startAtUtc: string | Date;
    seen: boolean;
  }>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const notifPanelRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);
  const notifModalRef = useRef<HTMLDivElement | null>(null);
  const bodyOverflowRef = useRef<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    timezone: "",
  });

  const timezone = useMemo(() => {
    if (profile?.timezone) return profile.timezone;
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [profile?.timezone, tz]);

  const timezones = useMemo(() => {
    const fallback = [
      "UTC",
      "Africa/Addis_Ababa",
      "Europe/Luxembourg",
      "Europe/London",
      "America/New_York",
      "Asia/Dubai",
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

    fetch(`/api/scheduling/admin/appointments?orgId=${orgId}`, {
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
  }, [orgId, status]);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifPanelRef.current?.contains(target)) return;
      if (notifButtonRef.current?.contains(target)) return;
      setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [notifOpen]);

  useEffect(() => {
    if (!selectedNotif) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifModalRef.current?.contains(target)) return;
      setSelectedNotif(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [selectedNotif]);

  useEffect(() => {
    const shouldLock = Boolean(selectedNotif);
    if (shouldLock) {
      if (bodyOverflowRef.current === null) {
        bodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = "hidden";
      document.body.setAttribute("data-scroll-locked", "true");
      return;
    }
    if (bodyOverflowRef.current !== null) {
      document.body.style.overflow = bodyOverflowRef.current;
      bodyOverflowRef.current = null;
    }
    document.body.removeAttribute("data-scroll-locked");
  }, [selectedNotif]);

  const handleNotifListWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      if (element.scrollHeight <= element.clientHeight) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      element.scrollTop += event.deltaY;
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  useEffect(() => {
    return () => {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
      document.body.removeAttribute("data-scroll-locked");
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);

    fetch("/api/me/profile", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setProfileError(data?.error ?? "Failed to load profile");
          return;
        }
        const next = (data?.profile ?? null) as Profile | null;
        setProfile(next);
        setProfileForm({
          name: next?.name ?? "",
          phone: next?.phone ?? "",
          timezone: next?.timezone ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setProfileError("Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;

    fetch(`/api/scheduling/admin/notifications?orgId=${orgId}&status=failed`, {
      cache: "no-store",
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) return;
        setFailedNotifs(Number(data?.total ?? data?.items?.length ?? 0));
      })
      .catch(() => {
        if (!cancelled) setFailedNotifs(0);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setNotifLoading(true);
    setNotifError(null);

    const url = new URL(
      "/api/scheduling/admin/notifications",
      window.location.origin,
    );
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "5");
    url.searchParams.set("seen", "false");

    fetch(url.toString(), { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setNotifError(data?.error ?? "Failed to load notifications");
          return;
        }
        setNotifItems((data?.items ?? []) as typeof notifItems);
        setNotifTotal(Number(data?.total ?? data?.items?.length ?? 0));
      })
      .catch(() => {
        if (!cancelled) setNotifError("Failed to load notifications");
      })
      .finally(() => {
        if (!cancelled) setNotifLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  useEffect(() => {
    if (!selectedNotif) return;
    if (!selectedNotif.appointmentId) {
      setSelectedDetail({ error: "Missing appointment id" });
      return;
    }
    let cancelled = false;
    setSelectedDetail(null);
    setActionError(null);
    setNote("");

    fetch(
      `/api/scheduling/admin/appointments/${selectedNotif.appointmentId}?orgId=${encodeURIComponent(
        orgId,
      )}`,
      { cache: "no-store" },
    )
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setSelectedDetail({
            error: data?.error ?? "Failed to load booking details",
          });
          return;
        }
        setSelectedDetail(data?.appointment ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedDetail({ error: "Failed to load booking details" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNotif, orgId]);

  const displayName = useMemo(() => {
    if (profile?.name) return profile.name;
    if (typeof session?.user?.name === "string" && session.user.name) {
      return session.user.name;
    }
    if (typeof session?.user?.email === "string" && session.user.email) {
      return session.user.email.split("@")[0];
    }
    return "";
  }, [profile?.name, session?.user?.name, session?.user?.email]);

  const upcomingColumns = useMemo<MRT_ColumnDef<Booking>[]>(
    () => [
      {
        header: "Meeting",
        accessorKey: "meetingTypeKey",
        Cell: ({ row }) => (
          <div className="text-sm font-semibold text-gray-900">
            {formatKeyLabel(row.original.meetingTypeKey ?? "Meeting") +
              " · " +
              row.original.mode}
          </div>
        ),
      },
      {
        header: "Time",
        accessorKey: "startAtUtc",
        Cell: ({ row }) => {
          const start = DateTime.fromJSDate(
            row.original.startAtUtc instanceof Date
              ? row.original.startAtUtc
              : new Date(row.original.startAtUtc),
          ).setZone(timezone);
          const end = DateTime.fromJSDate(
            row.original.endAtUtc instanceof Date
              ? row.original.endAtUtc
              : new Date(row.original.endAtUtc),
          ).setZone(timezone);
          return (
            <div className="text-xs text-gray-600">
              {start.toFormat("ccc, LLL dd · HH:mm")}–{end.toFormat("HH:mm")}
            </div>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        Cell: ({ cell }) => (
          <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
            {cell.getValue<string>()}
          </span>
        ),
      },
    ],
    [timezone],
  );

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage scheduling
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin or staff access is required.
          </p>
          <Button className="mt-6" onClick={() => signIn()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;
  const todayCount = items.filter((i) => {
    const itemDate = new Date(i.startAtUtc);
    const today = new Date();
    return itemDate.toDateString() === today.toDateString();
  }).length;

  const upcoming = items
    .filter((item) => {
      const start = DateTime.fromJSDate(
        item.startAtUtc instanceof Date
          ? item.startAtUtc
          : new Date(item.startAtUtc),
      );
      return start > DateTime.utc().minus({ minutes: 1 });
    })
    .slice(0, 5);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(json?.error ?? "Failed to save profile");
        return;
      }
      setProfile(json.profile as Profile);
    } catch {
      setProfileError("Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <div
          className={[
            "relative overflow-visible rounded-2xl border border-white/70 bg-white/85 px-5 py-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70",
            notifOpen ? "z-40" : "z-10",
          ].join(" ")}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-accent-500" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                Times shown in {timezone}.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {displayName && (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Welcome, {displayName}
                </span>
              )}
              <div className="relative z-20">
                <Button
                  variant="outline"
                  className="relative h-10 w-10 p-0"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  aria-label="Notifications"
                  ref={notifButtonRef}
                >
                  {notifTotal > 0 && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500/60" />
                  )}
                  <Bell className="h-5 w-5" />
                  {notifTotal > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {notifTotal > 99 ? "99+" : notifTotal}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div
                    ref={notifPanelRef}
                    className="fixed inset-x-4 z-[120] mt-2 flex max-h-[min(70dvh,32rem)] w-auto flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur overscroll-contain touch-pan-y dark:border-slate-700/60 dark:bg-slate-900/90 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
                    onWheelCapture={(event) => event.stopPropagation()}
                    onTouchMoveCapture={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </p>
                      <Link
                        className="text-xs text-blue-600 hover:underline"
                        href={buildLink("/admin/scheduling/notifications/logs")}
                        onClick={() => setNotifOpen(false)}
                      >
                        View all
                      </Link>
                    </div>
                    {notifLoading && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                        Loading notifications...
                      </p>
                    )}
                    {notifError && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {notifError}
                      </div>
                    )}
                    {!notifLoading && !notifError && notifItems.length === 0 && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                        No unseen notifications.
                      </p>
                    )}
                    {!notifLoading && !notifError && notifItems.length > 0 && (
                      <div
                        className="mt-3 min-h-0 space-y-3 overflow-y-auto overscroll-contain touch-pan-y pr-1"
                        onWheel={handleNotifListWheel}
                        onWheelCapture={(event) => event.stopPropagation()}
                        onTouchMoveCapture={(event) => event.stopPropagation()}
                      >
                        {notifItems.map((item) => {
                          const when = DateTime.fromJSDate(
                            item.createdAt instanceof Date
                              ? item.createdAt
                              : new Date(item.createdAt),
                          ).setZone(timezone);
                          const start = DateTime.fromJSDate(
                            item.startAtUtc instanceof Date
                              ? item.startAtUtc
                              : new Date(item.startAtUtc),
                          ).setZone(timezone);
                          const Icon =
                            item.status === "failed" ? MailX : MailCheck;
                          return (
                            <div
                              key={item.id}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs text-gray-700 transition hover:border-primary-200 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200"
                              onClick={async () => {
                                setSelectedNotif(item);
                                setSelectedDetail(null);
                                setActionError(null);
                                setNote("");
                                setNotifOpen(false);
                                if (!item.seen) {
                                  await fetch("/api/scheduling/admin/notifications", {
                                    method: "PATCH",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({ ids: [item.id] }),
                                  });
                                  setNotifItems((prev) =>
                                    prev.filter((n) => n.id !== item.id),
                                  );
                                  setNotifTotal((prev) => Math.max(0, prev - 1));
                                }
                              }}
                            >
                              <Icon
                                className={`mt-0.5 h-4 w-4 ${item.status === "failed"
                                  ? "text-red-500"
                                  : "text-emerald-500"
                                  }`}
                              />
                              <div className="flex-1">
                                <div className="font-semibold">
                                  {formatKeyLabel(item.meetingTypeKey ?? "Meeting")} ·{" "}
                                  {item.templateKey ?? "notification"}
                                </div>
                                <div className="text-gray-500">
                                  To: {item.toAddress ?? "n/a"}
                                </div>
                                <div className="text-gray-500">
                                  {start.toFormat("ccc, LLL dd · HH:mm")} ·{" "}
                                  {item.apptStatus}
                                </div>
                                {item.error && (
                                  <div className="mt-1 text-red-600">
                                    {item.error}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock className="h-3.5 w-3.5" />
                                {when.toFormat("LLL dd · HH:mm")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Loading admin summary...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          <KpiCard
            label="Pending"
            value={pendingCount}
            trend={{ value: 12, isPositive: false }}
          />
          <KpiCard
            label="Confirmed"
            value={confirmedCount}
            trend={{ value: 8, isPositive: true }}
          />
          <KpiCard
            label="Today's Bookings"
            value={todayCount}
            icon={
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            }
          />
        </div>

        <MrtCardTable
          title="Upcoming bookings"
          subtitle="Next confirmed or pending appointments."
          table={{
            columns: upcomingColumns,
            data: upcoming,
            enablePagination: false,
            enableSorting: false,
            enableColumnActions: true,
            enableColumnFilters: false,
            enableGlobalFilter: false,
            enableDensityToggle: true,
            enableFullScreenToggle: true,
            enableColumnResizing: false,
            enableHiding: true,
            enableTopToolbar: true,
            enableBottomToolbar: false,
            renderEmptyRowsFallback: () => (
              <div className="p-4 text-sm text-gray-600">
                No upcoming bookings yet.
              </div>
            ),
          }}
        />
      </div>
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotif(null);
            }
          }}
        >
          <div
            ref={notifModalRef}
            className="w-full max-w-lg rounded-2xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notification detail
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedNotif(null)}
              >
                Close
              </Button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
              {selectedDetail ? (
                selectedDetail.error ? (
                  <div className="text-red-600">{selectedDetail.error}</div>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold">Meeting:</span>{" "}
                      {formatKeyLabel(selectedDetail.meetingTypeKey ?? "Meeting")} ·{" "}
                      {selectedDetail.mode ?? "mode"}
                    </p>
                    <p>
                      <span className="font-semibold">User:</span>{" "}
                      {selectedDetail.userFullName ||
                        selectedDetail.userName ||
                        selectedDetail.userId}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {selectedDetail.userEmail || "n/a"}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      {selectedDetail.userPhone || "n/a"}
                    </p>
                    <p>
                      <span className="font-semibold">Company:</span>{" "}
                      {selectedDetail.userCompany || "n/a"}
                      {selectedDetail.userCompanyRole
                        ? ` · ${selectedDetail.userCompanyRole}`
                        : ""}
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      {selectedDetail.status}
                    </p>
                    <p>
                      <span className="font-semibold">Payment:</span>{" "}
                      {selectedDetail.paymentStatus ?? "not_required"}
                      {selectedDetail.requiresPayment ? "" : " (not required)"}
                      {formatMoney(
                        selectedDetail.priceCents,
                        selectedDetail.currency
                      )
                        ? ` · ${formatMoney(
                          selectedDetail.priceCents,
                          selectedDetail.currency
                        )}`
                        : ""}
                    </p>
                    <p>
                      <span className="font-semibold">Appointment:</span>{" "}
                      {DateTime.fromJSDate(
                        selectedDetail.startAtUtc instanceof Date
                          ? selectedDetail.startAtUtc
                          : new Date(selectedDetail.startAtUtc),
                      )
                        .setZone(timezone)
                        .toFormat("ccc, LLL dd · HH:mm")}{" "}
                      · {selectedDetail.status}
                    </p>
                    <p>
                      <span className="font-semibold">Notes:</span>{" "}
                      {selectedDetail.notes || "No notes"}
                    </p>
                    <p>
                      <span className="font-semibold">Created:</span>{" "}
                      {DateTime.fromJSDate(
                        selectedDetail.createdAt instanceof Date
                          ? selectedDetail.createdAt
                          : new Date(selectedDetail.createdAt),
                      )
                        .setZone(timezone)
                        .toFormat("LLL dd · HH:mm")}
                    </p>
                  </>
                )
              ) : (
                <div>Loading booking details...</div>
              )}
              {selectedDetail &&
                !selectedDetail.error &&
                selectedDetail.status === "pending" && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Approval required</p>
                    <p className="mt-1 text-xs text-amber-800">
                      This booking is pending approval. You can approve or
                      decline it here.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        className="h-9 flex-1"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note"
                      />
                      <Button
                        className="min-w-[110px]"
                        disabled={actioning}
                        onClick={async () => {
                          setActioning(true);
                          setActionError(null);
                          try {
                            const res = await fetch(
                              `/api/scheduling/admin/appointments/${selectedDetail.id}/approve?orgId=${orgId}`,
                              {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  reason: note.trim() || undefined,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setActionError(data?.error ?? "Approve failed");
                              return;
                            }
                            setSelectedNotif(null);
                            setSelectedDetail(null);
                          } catch {
                            setActionError("Approve failed");
                          } finally {
                            setActioning(false);
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="min-w-[110px]"
                        disabled={actioning}
                        onClick={async () => {
                          setActioning(true);
                          setActionError(null);
                          try {
                            const res = await fetch(
                              `/api/scheduling/admin/appointments/${selectedDetail.id}/decline?orgId=${orgId}`,
                              {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  reason: note.trim() || undefined,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setActionError(data?.error ?? "Decline failed");
                              return;
                            }
                            setSelectedNotif(null);
                            setSelectedDetail(null);
                          } catch {
                            setActionError("Decline failed");
                          } finally {
                            setActioning(false);
                          }
                        }}
                      >
                        Decline
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/admin/scheduling/bookings">
                          Open approvals
                        </Link>
                      </Button>
                    </div>
                    {actionError && (
                      <div className="mt-2 text-xs text-red-600">
                        {actionError}
                      </div>
                    )}
                  </div>
                )}
              {selectedDetail &&
                !selectedDetail.error &&
                (selectedDetail.status === "pending" ||
                  selectedDetail.status === "confirmed") && (
                  <div className="mt-5 rounded-xl border border-white/70 bg-white/80 p-4 text-sm text-gray-800 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                    <p className="font-semibold">Need to cancel?</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Canceling will notify the customer and free the slot.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        className="h-9 flex-1"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note"
                      />
                      <Button
                        variant="outline"
                        disabled={actioning}
                        onClick={async () => {
                          setActioning(true);
                          setActionError(null);
                          try {
                            const res = await fetch(
                              `/api/scheduling/appointments/${selectedDetail.id}/cancel?orgId=${orgId}`,
                              {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  reason: note.trim() || undefined,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setActionError(data?.error ?? "Cancel failed");
                              return;
                            }
                            setSelectedNotif(null);
                            setSelectedDetail(null);
                          } catch {
                            setActionError("Cancel failed");
                          } finally {
                            setActioning(false);
                          }
                        }}
                      >
                        Cancel booking
                      </Button>
                    </div>
                    {actionError && (
                      <div className="mt-2 text-xs text-red-600">
                        {actionError}
                      </div>
                    )}
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedNotif(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
