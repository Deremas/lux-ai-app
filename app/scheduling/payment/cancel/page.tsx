"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type StatusResponse = {
  reservationHoldMinutes: number;
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
    requestedTimezone: string;
    reservedUntil: string | null;
    failureReason: string | null;
    canResumePayment: boolean;
  };
  appointment: {
    id: string;
  } | null;
};

export default function PaymentCancelPage() {
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const attemptId = (searchParams.get("attempt_id") ?? "").trim();
  const isAuthed = authStatus === "authenticated";

  const [data, setData] = useState<StatusResponse | null>(null);
  const [message, setMessage] = useState(
    attemptId
      ? "Checking whether your payment attempt can be resumed..."
      : "Your payment was canceled. No booking was created."
  );
  const [error, setError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    if (!attemptId || authStatus !== "authenticated") return;

    let cancelled = false;
    let timer: number | null = null;

    const poll = async () => {
      const res = await fetch(
        `/api/scheduling/payment/status?attemptId=${encodeURIComponent(attemptId)}`,
        { cache: "no-store" }
      );
      const json = (await res.json().catch(() => ({}))) as Partial<StatusResponse> & {
        error?: string;
      };

      if (cancelled) return;

      if (!res.ok || !json.bookingAttempt) {
        setError(json.error ?? "Could not load payment attempt.");
        return;
      }

      const next = json as StatusResponse;
      setData(next);
      setError(null);

      if (next.bookingAttempt.status === "payment_pending") {
        setMessage(
          next.bookingAttempt.canResumePayment
            ? "Your slot is still reserved. You can continue the same payment attempt."
            : "Your payment attempt is still pending."
        );
        return;
      }

      if (next.bookingAttempt.status === "payment_processing") {
        setMessage("Payment is processing. We are checking confirmation.");
        timer = window.setTimeout(() => {
          void poll();
        }, 2500);
        return;
      }

      if (next.bookingAttempt.status === "paid") {
        setMessage("Payment received. We are confirming your booking.");
        timer = window.setTimeout(() => {
          void poll();
        }, 2500);
        return;
      }

      if (next.bookingAttempt.status === "booking_confirmed") {
        setMessage("Your booking is already confirmed.");
        return;
      }

      if (next.bookingAttempt.status === "expired") {
        setMessage(
          next.reservationHoldMinutes
            ? `Your reservation expired because payment was not completed within ${next.reservationHoldMinutes} minutes.`
            : "Your reservation expired before payment was completed."
        );
        return;
      }

      if (next.bookingAttempt.status === "payment_failed") {
        setMessage("Your payment failed. Please choose a slot again to retry.");
        return;
      }

      if (next.bookingAttempt.status === "booking_failed") {
        setMessage("Payment was received, but the booking could not be finalized.");
        setError(
          next.bookingAttempt.failureReason ??
            "Support review may be required for this payment."
        );
        return;
      }

      if (next.bookingAttempt.status === "cancelled") {
        setMessage("This payment attempt was cancelled.");
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [attemptId, authStatus]);

  const reservedUntilLabel = useMemo(() => {
    const reservedUntil = data?.bookingAttempt.reservedUntil;
    if (!reservedUntil) return null;
    const zone = data?.bookingAttempt.requestedTimezone || "UTC";
    const dt = DateTime.fromISO(reservedUntil).setZone(zone);
    return dt.isValid ? `${dt.toFormat("ccc, LLL dd · HH:mm")} (${zone})` : null;
  }, [data?.bookingAttempt.requestedTimezone, data?.bookingAttempt.reservedUntil]);
  const reservationWindowHint = useMemo(() => {
    const holdMinutes = data?.reservationHoldMinutes;
    if (typeof holdMinutes !== "number" || !Number.isFinite(holdMinutes)) {
      return null;
    }
    return `We hold payment slots for up to ${holdMinutes} minutes before releasing them.`;
  }, [data?.reservationHoldMinutes]);

  async function handleResume() {
    if (!attemptId || resuming) return;
    setResuming(true);
    setError(null);
    try {
      const res = await fetch("/api/scheduling/payment/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };

      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not resume payment.");
        return;
      }

      window.location.href = json.url;
    } catch {
      setError("Could not resume payment.");
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#ffffff_75%)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_55%,_#0b1120_100%)]">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900">
            Payment canceled
          </h1>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          {reservationWindowHint && (
            <p className="mt-2 text-xs text-gray-500">{reservationWindowHint}</p>
          )}

          {!attemptId && (
            <div className="mt-6">
              <Button asChild>
                <Link href="/scheduling">Return to scheduling</Link>
              </Button>
            </div>
          )}

          {attemptId && authStatus === "loading" && (
            <p className="mt-6 text-sm text-gray-600">Loading payment attempt…</p>
          )}

          {attemptId && authStatus !== "loading" && !isAuthed && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => signIn()}>Sign in to continue</Button>
              <Button variant="outline" asChild>
                <Link href="/scheduling">Back to scheduling</Link>
              </Button>
            </div>
          )}

          {attemptId && isAuthed && data?.bookingAttempt.canResumePayment && (
            <div className="mt-6 space-y-3">
              {reservedUntilLabel && (
                <p className="text-sm text-gray-600">
                  Reserved until {reservedUntilLabel}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void handleResume()} disabled={resuming}>
                  {resuming ? "Opening Stripe..." : "Continue payment"}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/scheduling">Choose another slot</Link>
                </Button>
              </div>
            </div>
          )}

          {attemptId &&
            isAuthed &&
            (data?.bookingAttempt.status === "payment_processing" ||
              data?.bookingAttempt.status === "paid" ||
              data?.bookingAttempt.status === "booking_confirmed") && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/scheduling/payment/success?attempt_id=${attemptId}`}>
                    Check booking status
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/scheduling/my">My bookings</Link>
                </Button>
              </div>
            )}

          {attemptId &&
            isAuthed &&
            data &&
            !data.bookingAttempt.canResumePayment &&
            data.bookingAttempt.status !== "payment_processing" &&
            data.bookingAttempt.status !== "paid" &&
            data.bookingAttempt.status !== "booking_confirmed" && (
              <div className="mt-6">
                <Button asChild>
                  <Link href="/scheduling">Return to scheduling</Link>
                </Button>
              </div>
            )}

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
