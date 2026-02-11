"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { DateTime } from "luxon";

import { Button } from "@/components/ui/button";
import AvailabilityCalendar from "@/components/scheduling/AvailabilityCalendar";
import Link from "next/link";

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

type Profile = {
  name: string | null;
  phone: string | null;
  timezone: string | null;
  email: string | null;
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

export default function DashboardClient({ orgId, tz }: Props) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    timezone: "",
  });
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

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [tz]);

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
      title: `${detailTarget.meetingTypeKey ?? "Meeting"} · ${detailTarget.mode}`,
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
    if (!rescheduleTarget && !requestTarget) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setRescheduleTarget(null);
      setRescheduleSlot(null);
      setRescheduleError(null);
      setRequestTarget(null);
      setRequestNote("");
      setRequestError(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [rescheduleTarget, requestTarget]);

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
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Bookings
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Your booking history
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Times shown in {timezone}.
          </p>
          {profile?.name && (
            <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Welcome, {profile.name}
            </p>
          )}
          {!profile?.name && typeof session?.user?.email === "string" && (
            <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Welcome, {session.user.email.split("@")[0]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/scheduling?orgId=${encodeURIComponent(orgId)}`}>
              Book another session
            </Link>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Log out
          </Button>
        </div>
      </div>

      <section className="mt-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Update your name, phone, and timezone.
          </p>
          {profileLoading && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Loading profile...
            </p>
          )}
          {profileError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </div>
          )}
          {!profileLoading && (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Full name
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Phone
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Timezone
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                  value={profileForm.timezone}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                >
                  <option value="">Select timezone</option>
                  {timezones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Booking history
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Review upcoming and past sessions.
              </p>
            </div>
          </div>
        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Loading bookings...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            No bookings yet. Ready to schedule one?
          </div>
        )}

        <div className="mt-4 grid gap-4">
          {items.map((item) => {
            const start = DateTime.fromJSDate(
              item.startAtUtc instanceof Date
                ? item.startAtUtc
                : new Date(item.startAtUtc)
            ).setZone(timezone);
            const end = DateTime.fromJSDate(
              item.endAtUtc instanceof Date ? item.endAtUtc : new Date(item.endAtUtc)
            ).setZone(timezone);
            const createdAt = DateTime.fromJSDate(
              item.createdAt instanceof Date
                ? item.createdAt
                : new Date(item.createdAt)
            ).toUTC();
            const canReschedule =
              ["pending", "confirmed"].includes(item.status) &&
              DateTime.utc() <= createdAt.plus({ hours: 1 });
            const label = `${start.toFormat("ccc, LLL dd")} · ${start.toFormat(
              "HH:mm"
            )}–${end.toFormat("HH:mm")}`;
            const calendarLink = buildGoogleCalendarUrl({
              title: `${item.meetingTypeKey ?? "Meeting"} · ${item.mode}`,
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
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.meetingTypeKey ?? "Meeting"} · {item.mode}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {label}
                    {item.durationMin ? ` · ${item.durationMin} min` : ""}
                  </p>
                  {item.mode === "phone" && item.phone && (
                    <a
                      className="mt-1 block text-xs text-blue-600 hover:underline"
                      href={`tel:${item.phone}`}
                    >
                      Call {item.phone}
                    </a>
                  )}
                  {item.mode !== "phone" &&
                    item.mode !== "in_person" &&
                    item.meetingLink && item.status === "confirmed" && (
                      <a
                        className="mt-1 block text-xs text-blue-600 hover:underline"
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join meeting link
                      </a>
                    )}
                  <a
                    className="mt-1 block text-xs text-blue-600 hover:underline"
                    href={calendarLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Add to calendar
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200">
                    {item.status}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setDetailTarget(item)}
                  >
                    View details
                  </Button>
                  {["pending", "confirmed"].includes(item.status) && (
                    <>
                      {canReschedule ? (
                        <Button
                          variant="outline"
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
              </div>
            );
          })}
        </div>
        {!loading && !error && total > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-500">
              Total: {total} · Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Rows</label>
              <select
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
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
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </div>
      </section>
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="max-h-[85vh] overflow-y-auto p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                  Reschedule
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  Choose a new time
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Pick a new slot for{" "}
                  {rescheduleTarget.meetingTypeKey ?? "your meeting"}.
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

            <div className="mt-6">
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
      )}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-6">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Booking details
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                    {detailTarget.meetingTypeTitle ??
                      detailTarget.meetingTypeKey ??
                      "Meeting"}
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

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
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

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
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

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
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

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
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
                  <Link href={`/scheduling?orgId=${encodeURIComponent(orgId)}`}>
                    Book another session
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-lg font-semibold text-gray-900">
              Request reschedule
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Send a reschedule request to the admin/staff. They will contact you.
            </p>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">
                {requestTarget.meetingTypeKey ?? "Meeting"} · {requestTarget.mode}
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
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
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
