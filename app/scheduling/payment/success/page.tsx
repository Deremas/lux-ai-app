"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type ViewStatus = "idle" | "polling" | "done" | "error";

type StatusResponse = {
  bookingAttempt: {
    id: string;
    status:
      | "payment_pending"
      | "payment_processing"
      | "paid"
      | "booking_confirmed"
      | "booking_failed"
      | "payment_failed"
      | "expired"
      | "cancelled";
    paymentStatus: "unpaid" | "paid" | "not_required";
    mode: string;
    startLocal: string;
    requestedTimezone: string;
    startAtUtc: string;
    endAtUtc: string;
    priceCents: number;
    currency: string;
    reservedUntil: string | null;
    failureReason: string | null;
    canResumePayment: boolean;
    notes: string | null;
    meetingType: {
      id: string;
      key: string;
      durationMin: number;
    } | null;
    reservation: {
      id: string;
      status: string;
      staffUserId: string | null;
      reservedUntil: string;
      startAtUtc: string;
      endAtUtc: string;
    } | null;
  };
  payment: {
    status: string;
    amountCents: number;
    currency: string;
    stripeCheckoutSessionId: string | null;
    stripePaymentIntentId: string | null;
    paidAt: string | null;
    failedAt: string | null;
  } | null;
  appointment: {
    id: string;
    status: string;
    startAtUtc: string;
    endAtUtc: string;
    mode: string;
    paymentStatus: string | null;
    priceCents: number | null;
    currency: string | null;
    meetingLink: string | null;
  } | null;
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
  return [
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
  ].join("\r\n");
}

function buildGoogleCalendarUrl(args: {
  title: string;
  details: string;
  startUtc: string;
  endUtc: string;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    details: args.details,
    dates: `${formatIcsUtc(args.startUtc)}/${formatIcsUtc(args.endUtc)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function PaymentSuccessPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = (searchParams.get("attempt_id") ?? "").trim();
  const isAuthed = authStatus === "authenticated";

  const [status, setStatus] = useState<ViewStatus>("idle");
  const [message, setMessage] = useState("Preparing payment status…");
  const [data, setData] = useState<StatusResponse | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "loading") return;

    if (!isAuthed) {
      setStatus("error");
      setMessage("Please sign in to view your payment status.");
      return;
    }

    if (!attemptId) {
      setStatus("error");
      setMessage("Missing booking attempt. Please contact support.");
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    const poll = async () => {
      setStatus((current) => (current === "done" ? current : "polling"));
      setErrorDetail(null);

      const res = await fetch(
        `/api/scheduling/payment/status?attemptId=${encodeURIComponent(attemptId)}`,
        { cache: "no-store" }
      );
      const json = (await res.json().catch(() => ({}))) as Partial<StatusResponse> & {
        error?: string;
      };

      if (cancelled) return;

      if (!res.ok || !json.bookingAttempt) {
        setStatus("error");
        setMessage(json.error ?? "Could not load booking status.");
        return;
      }

      const next = json as StatusResponse;
      setData(next);

      if (next.bookingAttempt.status === "booking_confirmed" && next.appointment) {
        setStatus("done");
        setMessage(
          next.appointment.status === "pending"
            ? "Payment received. Your booking request is pending approval."
            : "Payment received. Your booking is confirmed."
        );
        return;
      }

      if (next.bookingAttempt.status === "payment_failed") {
        setStatus("error");
        setMessage("Payment failed for this booking attempt.");
        return;
      }

      if (next.bookingAttempt.status === "expired") {
        setStatus("error");
        setMessage("Your reservation expired before payment was completed.");
        setErrorDetail("Please choose a slot again to continue.");
        return;
      }

      if (next.bookingAttempt.status === "cancelled") {
        setStatus("error");
        setMessage("This payment attempt was cancelled.");
        return;
      }

      if (next.bookingAttempt.status === "booking_failed") {
        setStatus("error");
        setMessage("Payment was received, but the booking could not be finalized.");
        setErrorDetail(
          next.bookingAttempt.failureReason ??
            "Support review or a manual refund may be required."
        );
        return;
      }

      if (next.bookingAttempt.status === "paid") {
        setMessage("Payment received. Finalizing your booking…");
      } else if (next.bookingAttempt.status === "payment_processing") {
        setMessage("Payment is processing. We are checking confirmation…");
      } else if (next.bookingAttempt.canResumePayment) {
        setMessage("Your slot is still reserved while Stripe confirms your payment…");
      } else {
        setMessage("Waiting for Stripe confirmation…");
      }

      timer = window.setTimeout(() => {
        void poll();
      }, 2500);
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [attemptId, authStatus, isAuthed]);

  useEffect(() => {
    const appointmentId = data?.appointment?.id;
    if (status !== "done" || !appointmentId) return;
    const timer = window.setTimeout(() => {
      router.replace(`/scheduling/my?booking=${appointmentId}`);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [status, data?.appointment?.id, router]);

  const displayTz =
    data?.bookingAttempt.requestedTimezone || "Europe/Luxembourg";
  const startUtc =
    data?.appointment?.startAtUtc ?? data?.bookingAttempt.startAtUtc ?? "";
  const endUtc =
    data?.appointment?.endAtUtc ?? data?.bookingAttempt.endAtUtc ?? "";

  const formattedTime = useMemo(() => {
    if (!startUtc || !endUtc) return null;
    const start = DateTime.fromISO(startUtc).setZone(displayTz);
    const end = DateTime.fromISO(endUtc).setZone(displayTz);
    return `${start.toFormat("ccc, LLL dd · HH:mm")} – ${end.toFormat("HH:mm")}`;
  }, [displayTz, endUtc, startUtc]);

  const paymentLabel = formatPrice(
    data?.appointment?.priceCents ??
      data?.payment?.amountCents ??
      data?.bookingAttempt.priceCents ??
      null,
    data?.appointment?.currency ??
      data?.payment?.currency ??
      data?.bookingAttempt.currency ??
      null
  );

  const completionBadgeLabel =
    status === "done"
      ? data?.appointment?.status === "pending"
        ? "Pending approval"
        : "Confirmed"
      : status === "error"
        ? "Needs attention"
        : "Processing";

  const reservationDeadline = useMemo(() => {
    const reservedUntil = data?.bookingAttempt.reservedUntil;
    if (!reservedUntil) return null;
    const dt = DateTime.fromISO(reservedUntil).setZone(displayTz);
    return dt.isValid ? dt.toFormat("ccc, LLL dd · HH:mm") : null;
  }, [data?.bookingAttempt.reservedUntil, displayTz]);

  const calendarLinks = useMemo(() => {
    if (status !== "done" || !startUtc || !endUtc) return null;
    const title = data?.bookingAttempt.meetingType?.key ?? "Lux AI Session";
    const details = [
      `Mode: ${data?.appointment?.mode ?? data?.bookingAttempt.mode ?? "tbd"}`,
      data?.appointment?.meetingLink
        ? `Meeting link: ${data.appointment.meetingLink}`
        : "",
      data?.bookingAttempt.notes ? `Notes: ${data.bookingAttempt.notes}` : "",
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
  }, [data, endUtc, startUtc, status]);

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
              {completionBadgeLabel}
            </span>
          </div>

          {data && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Meeting
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {data.bookingAttempt.meetingType?.key ?? "Lux AI Session"}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {data.bookingAttempt.meetingType?.durationMin ?? 60} min ·{" "}
                  {data.appointment?.mode ?? data.bookingAttempt.mode}
                </p>
                {data.appointment?.meetingLink &&
                  data.appointment.status === "confirmed" && (
                    <a
                      className="mt-3 inline-flex text-xs font-semibold text-emerald-600"
                      href={data.appointment.meetingLink}
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
                  Attempt ID: {data.bookingAttempt.id}
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
                  Status: {data.payment?.status ?? data.bookingAttempt.paymentStatus}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
                  Booking
                </p>
                <p className="mt-2 text-sm text-emerald-900">
                  Attempt: {data.bookingAttempt.status}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Appointment: {data.appointment?.status ?? "not created yet"}
                </p>
                {reservationDeadline && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Reserved until: {reservationDeadline}
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "done" && calendarLinks && (
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

          {status === "error" && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {message}
              {errorDetail && <div className="mt-1 text-[11px]">{errorDetail}</div>}
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
