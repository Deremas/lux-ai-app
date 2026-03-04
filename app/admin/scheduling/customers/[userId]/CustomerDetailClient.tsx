"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Booking = {
  id: string;
  status: string;
  startAtUtc: string | Date;
  endAtUtc: string | Date;
  meetingTypeKey: string | null;
  durationMin: number | null;
  mode: string | null;
  createdAt: string | Date;
};

type UserDetail = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  timezone: string | null;
  role: string;
  createdAt: string | Date;
  company: string | null;
  companyRole: string | null;
  notes: string | null;
};

type Props = {
  orgId: string;
  userId: string;
  tz?: string;
};

function formatDate(value: string | Date, tz: string) {
  const date = value instanceof Date ? value : new Date(value);
  return DateTime.fromJSDate(date).setZone(tz);
}

export default function CustomerDetailClient({ orgId, userId, tz }: Props) {
  const { status } = useSession();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [tz]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = new URL(
      `/api/scheduling/admin/users/${userId}`,
      window.location.origin
    );
    url.searchParams.set("orgId", orgId);
    fetch(url.toString(), { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load customer");
          return;
        }
        setUser(data?.user ?? null);
        setBookings((data?.bookings ?? []) as Booking[]);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load customer");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, userId, status]);

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to view customer details
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required.
          </p>
          <Button
            className="mt-6"
            onClick={() =>
              signIn(undefined, {
                callbackUrl: `/admin/scheduling/customers/${userId}`,
              })
            }
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Customer details
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Full profile and booking history. Times shown in {timezone}.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Loading customer...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && user && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    Customer
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                    {user.name || user.email}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {user.email}
                  </p>
                </div>
                <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
                  {user.role}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-gray-700 dark:text-gray-300">
                {user.phone && (
                  <p>
                    Phone:{" "}
                    <a className="text-blue-600 hover:underline" href={`tel:${user.phone}`}>
                      {user.phone}
                    </a>
                  </p>
                )}
                {user.timezone && <p>Timezone: {user.timezone}</p>}
                {user.company && <p>Company: {user.company}</p>}
                {user.companyRole && <p>Role: {user.companyRole}</p>}
                {user.notes && <p>Notes: {user.notes}</p>}
                <p>
                  Joined{" "}
                  {formatDate(user.createdAt, timezone).toFormat("LLL dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Bookings summary
              </p>
              <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300">
                <p>Total bookings: {bookings.length}</p>
                <p>
                  Upcoming:{" "}
                  {bookings.filter((b) => ["pending", "confirmed"].includes(b.status)).length}
                </p>
                <p>
                  Completed:{" "}
                  {bookings.filter((b) => b.status === "completed").length}
                </p>
                <p>
                  Canceled:{" "}
                  {bookings.filter((b) => b.status === "canceled").length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bookings
          </h2>
          <Link
            className="text-sm text-blue-600 hover:underline"
            href="/admin/scheduling/bookings"
          >
            View approvals
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            No bookings yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {bookings.map((booking) => {
              const start = formatDate(booking.startAtUtc, timezone);
              const end = formatDate(booking.endAtUtc, timezone);
              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {booking.meetingTypeKey || "meeting"} · {booking.mode || "mode"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {start.toFormat("ccc, LLL dd")} ·{" "}
                        {start.toFormat("HH:mm")}–{end.toFormat("HH:mm")} ·{" "}
                        {booking.durationMin ?? 60} min
                      </p>
                    </div>
                    <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                    Created {formatDate(booking.createdAt, timezone).toFormat("LLL dd, yyyy")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
