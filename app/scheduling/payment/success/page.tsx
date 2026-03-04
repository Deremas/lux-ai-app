"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type Status = "idle" | "verifying" | "booking" | "done" | "error";

type PendingBooking = {
  orgId: string;
  meetingTypeId: string;
  mode: string;
  startLocal: string;
  tz?: string;
  staffUserId?: string;
  meetingTitle?: string;
  durationMin?: number;
  displayTz?: string;
};

type BookingResponse = {
  appointment?: {
    id: string;
    status: string;
    startAtUtc: string;
    endAtUtc: string;
    mode: string;
    paymentStatus?: string | null;
  };
  meetingLink?: string | null;
  payment?: {
    status: string;
    priceCents: number | null;
    currency: string | null;
  };
};

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

function formatIcsUtc(dtIso: string) {
  return DateTime.fromISO(dtIso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function buildIcsContent(args: {
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
}) {
  const uid = `${crypto.randomUUID()}@luxai`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lux AI//Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date().toISOString())}`,
    `DTSTART:${formatIcsUtc(args.startUtc)}`,
    `DTEND:${formatIcsUtc(args.endUtc)}`,
    `SUMMARY:${args.title}`,
    `DESCRIPTION:${args.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
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

export default function PaymentSuccessPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const isAuthed = authStatus === "authenticated";
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>(
    "Preparing payment confirmation…"
  );
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!isAuthed) {
      setStatus("error");
      setMessage("Please sign in to finalize your booking.");
      return;
    }

    const run = async () => {
      setStatus("verifying");
      setErrorDetail(null);
      const url = new URL(window.location.href);
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) {
        setStatus("error");
        setMessage("Missing payment session. Please try again.");
        return;
      }

      const pendingRaw = sessionStorage.getItem("pendingBooking");
      const parsed = pendingRaw ? (JSON.parse(pendingRaw) as PendingBooking) : null;
      if (parsed) setPending(parsed);

      const verifyRes = await fetch("/api/scheduling/payment/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyJson?.paid) {
        setStatus("error");
        setMessage("Payment is not confirmed. Please contact support.");
        setErrorDetail(verifyJson?.error ?? null);
        return;
      }

      const meta = (verifyJson?.metadata ?? {}) as Record<string, string>;
      const metaOrgId = (meta.orgId ?? "").trim();
      const metaMeetingTypeId = (meta.meetingTypeId ?? "").trim();
      const metaMode = (meta.mode ?? "").trim();
      const metaStartLocal = (meta.startLocal ?? "").trim();
      const metaTz = (meta.tz ?? "").trim();
      const metaStaffUserId = (meta.staffUserId ?? "").trim();

      if (!metaOrgId || !metaMeetingTypeId || !metaMode || !metaStartLocal) {
        setStatus("error");
        setMessage("Missing booking details from payment session.");
        return;
      }

      if (parsed) {
        const mismatch =
          (parsed.orgId && parsed.orgId !== metaOrgId) ||
          (parsed.meetingTypeId && parsed.meetingTypeId !== metaMeetingTypeId) ||
          (parsed.mode && parsed.mode !== metaMode) ||
          (parsed.startLocal && parsed.startLocal !== metaStartLocal) ||
          (parsed.tz && metaTz && parsed.tz !== metaTz) ||
          (parsed.staffUserId && metaStaffUserId && parsed.staffUserId !== metaStaffUserId);
        if (mismatch) {
          setStatus("error");
          setMessage("Payment details do not match this booking.");
          return;
        }
      } else {
        setPending({
          orgId: metaOrgId,
          meetingTypeId: metaMeetingTypeId,
          mode: metaMode,
          startLocal: metaStartLocal,
          tz: metaTz || undefined,
          staffUserId: metaStaffUserId || undefined,
          meetingTitle: "Lux AI Session",
          displayTz: metaTz || undefined,
        });
      }

      setStatus("booking");
      setMessage("Finalizing your booking…");

      const bookingRes = await fetch("/api/scheduling/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId: metaOrgId,
          meetingTypeId: metaMeetingTypeId,
          mode: metaMode,
          startLocal: metaStartLocal,
          tz: metaTz || undefined,
          staffUserId: metaStaffUserId || undefined,
          paymentConfirmed: true,
          paymentSessionId: sessionId,
        }),
      });

      const bookingJson = (await bookingRes.json().catch(() => ({}))) as BookingResponse;
      if (!bookingRes.ok) {
        setStatus("error");
        setMessage((bookingJson as any)?.error ?? "Booking failed.");
        setErrorDetail((bookingJson as any)?.details ?? null);
        return;
      }

      sessionStorage.removeItem("pendingBooking");
      setBooking(bookingJson);
      setStatus("done");
      setMessage("Payment received. Your booking is confirmed.");
    };

    void run();
  }, [authStatus, isAuthed]);

  const displayTz = pending?.displayTz || pending?.tz || "Europe/Luxembourg";
  const startUtc = booking?.appointment?.startAtUtc ?? "";
  const endUtc = booking?.appointment?.endAtUtc ?? "";

  const formattedTime = useMemo(() => {
    if (!startUtc || !endUtc) return null;
    const start = DateTime.fromISO(startUtc).setZone(displayTz);
    const end = DateTime.fromISO(endUtc).setZone(displayTz);
    return `${start.toFormat("ccc, LLL dd · HH:mm")} – ${end.toFormat("HH:mm")}`;
  }, [startUtc, endUtc, displayTz]);

  const paymentLabel = formatPrice(
    booking?.payment?.priceCents ?? null,
    booking?.payment?.currency ?? null
  );

  const calendarLinks = useMemo(() => {
    if (!startUtc || !endUtc) return null;
    const title = pending?.meetingTitle ?? "Lux AI Session";
      const details = [
        `Mode: ${pending?.mode ?? "tbd"}`,
        booking?.meetingLink && booking?.appointment?.status === "confirmed"
          ? `Meeting link: ${booking.meetingLink}`
          : "",
        "Lux AI booking confirmation",
      ]
        .filter(Boolean)
        .join("\n");
    return {
      google: buildGoogleCalendarUrl({
        title,
        details,
        startUtc,
        endUtc,
      }),
      ics: buildIcsContent({
        title,
        description: details,
        startUtc,
        endUtc,
      }),
    };
  }, [startUtc, endUtc, pending?.meetingTitle, pending?.mode, booking?.meetingLink]);

  useEffect(() => {
    const appointmentId = booking?.appointment?.id;
    if (status !== "done" || !appointmentId) return;
    const timer = window.setTimeout(() => {
      router.replace(`/scheduling/my?booking=${appointmentId}`);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [status, booking?.appointment?.id, router]);

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-white via-emerald-50/40 to-white px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-emerald-100 bg-white p-10 shadow-[0_20px_60px_-40px_rgba(16,185,129,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Payment
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                Payment confirmation
              </h1>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {status === "done"
                ? "Confirmed"
                : status === "error"
                ? "Needs attention"
                : "Processing"}
            </span>
          </div>

          {status === "done" && (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    Meeting
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {pending?.meetingTitle ?? "Lux AI Session"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {pending?.durationMin ?? 60} min · {pending?.mode ?? "—"}
                  </p>
                  {booking?.meetingLink &&
                    booking?.appointment?.status === "confirmed" && (
                    <a
                      className="mt-3 inline-flex text-xs font-semibold text-emerald-600"
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join meeting link
                    </a>
                  )}
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    Time
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formattedTime ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{displayTz}</p>
                  <p className="mt-3 text-xs text-gray-500">
                    Booking ID: {booking?.appointment?.id ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
                    Payment
                  </p>
                  <p className="mt-2 text-base font-semibold text-emerald-900">
                    {paymentLabel ?? "Paid"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Status: {booking?.payment?.status ?? "paid"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
                    Notifications
                  </p>
                  <p className="mt-2 text-sm text-emerald-900">
                    Confirmation sent in-app and by email to you. Admin/staff
                    were also notified.
                  </p>
                </div>
              </div>

              {calendarLinks && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <a href={calendarLinks.google} target="_blank" rel="noreferrer">
                      Add to Google Calendar
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([calendarLinks.ics], {
                        type: "text/calendar;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "booking.ics";
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download ICS
                  </Button>
                </div>
              )}
            </>
          )}

          {status === "error" && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {message}
              {errorDetail && <div className="mt-1 text-[11px]">{errorDetail}</div>}
              {message.toLowerCase().includes("slot") && (
                <div className="mt-1">Please pick another time.</div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/scheduling/my">My bookings</Link>
            </Button>
            {!isAuthed && (
              <Button variant="outline" onClick={() => signIn()}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
