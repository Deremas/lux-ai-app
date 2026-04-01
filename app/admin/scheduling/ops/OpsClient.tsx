"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { MRT_ColumnDef } from "material-react-table";

import MrtCardTable from "@/components/scheduling/MrtCardTable";
import ProductHero from "@/components/scheduling/ProductHero";
import { Button } from "@/components/ui/button";

type Props = {
  orgId: string;
  orgName: string | null;
  tz: string;
};

type ReviewMeta = {
  reviewedAt: string;
  reviewedByName: string | null;
  reviewedByEmail: string | null;
} | null;

type OpsAttemptRow = {
  id: string;
  category: "paid_without_booking" | "booking_failed" | "expired";
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string | null;
  meetingTypeKey: string | null;
  startAtUtc: string;
  endAtUtc: string;
  amountCents: number | null;
  currency: string | null;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  appointmentId: string | null;
  appointmentStatus: string | null;
  reservationStatus: string | null;
  reservedUntil: string | null;
  failureReason: string | null;
  updatedAt: string;
  retryable: boolean;
  review: ReviewMeta;
};

type OpsStripeEventRow = {
  eventId: string;
  eventType: string;
  status: string;
  bookingAttemptId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  meetingTypeKey: string | null;
  startAtUtc: string | null;
  endAtUtc: string | null;
  appointmentId: string | null;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  lastError: string | null;
  updatedAt: string;
  retryable: boolean;
  review: ReviewMeta;
};

type OpsPayload = {
  summary: {
    paidWithoutBookingCount: number;
    bookingFailedCount: number;
    expiredAttemptCount: number;
    failedStripeEventCount: number;
    stuckStripeEventCount: number;
  };
  attempts: OpsAttemptRow[];
  stripeEvents: OpsStripeEventRow[];
};

function formatWhen(value: string, tz: string) {
  return DateTime.fromISO(value).setZone(tz).toFormat("LLL dd, yyyy · HH:mm");
}

function formatSlot(startAtUtc: string | null, endAtUtc: string | null, tz: string) {
  if (!startAtUtc || !endAtUtc) return "n/a";
  const start = DateTime.fromISO(startAtUtc).setZone(tz);
  const end = DateTime.fromISO(endAtUtc).setZone(tz);
  if (!start.isValid || !end.isValid) return "n/a";
  return `${start.toFormat("LLL dd · HH:mm")} - ${end.toFormat("HH:mm")}`;
}

function formatMoney(amountCents: number | null, currency: string | null) {
  if (typeof amountCents !== "number" || !currency) return "n/a";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function formatAttemptCategory(value: OpsAttemptRow["category"]) {
  if (value === "paid_without_booking") return "Paid without booking";
  if (value === "booking_failed") return "Booking failed";
  return "Expired";
}

function reviewLabel(review: ReviewMeta, tz: string) {
  if (!review) return "Not reviewed";
  const when = formatWhen(review.reviewedAt, tz);
  const who = review.reviewedByName || review.reviewedByEmail || "Staff";
  return `${who} · ${when}`;
}

export default function OpsClient({ orgId, orgName, tz }: Props) {
  const [data, setData] = useState<OpsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actioningKey, setActioningKey] = useState<string | null>(null);

  async function loadData() {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/ops?orgId=${encodeURIComponent(orgId)}`,
        { cache: "no-store" }
      );
      const json = (await res.json().catch(() => ({}))) as Partial<OpsPayload> & {
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Failed to load payment ops.");
        return;
      }
      setData(json as OpsPayload);
    } catch {
      setError("Failed to load payment ops.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [orgId]);

  async function runAction(
    actionKey: string,
    body:
      | { action: "run_cleanup" }
      | { action: "retry_attempt"; attemptId: string }
      | { action: "retry_event"; eventId: string }
      | { action: "mark_reviewed"; targetType: "attempt" | "event"; targetId: string },
    successMessage: string
  ) {
    setActioningKey(actionKey);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/ops?orgId=${encodeURIComponent(orgId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Action failed.");
        return;
      }
      setNotice(successMessage);
      await loadData();
    } catch {
      setError("Action failed.");
    } finally {
      setActioningKey(null);
    }
  }

  const summary = data?.summary ?? {
    paidWithoutBookingCount: 0,
    bookingFailedCount: 0,
    expiredAttemptCount: 0,
    failedStripeEventCount: 0,
    stuckStripeEventCount: 0,
  };

  const attemptColumns = useMemo<MRT_ColumnDef<OpsAttemptRow>[]>(
    () => [
      {
        accessorKey: "category",
        header: "Category",
        Cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatAttemptCategory(row.original.category)}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-white">
              {row.original.customerName}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {row.original.customerEmail ?? "n/a"}
            </div>
          </div>
        ),
      },
      {
        id: "slot",
        header: "Slot",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-white">
              {row.original.meetingTypeKey ?? "Meeting"}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {formatSlot(row.original.startAtUtc, row.original.endAtUtc, tz)}
            </div>
          </div>
        ),
      },
      {
        id: "payment",
        header: "Payment",
        Cell: ({ row }) => (
          <div className="min-w-0 text-sm text-gray-700 dark:text-gray-200">
            <div>{formatMoney(row.original.amountCents, row.original.currency)}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              PI: {row.original.paymentIntentId ?? "n/a"}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              Session: {row.original.checkoutSessionId ?? "n/a"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        Cell: ({ row }) => (
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <div>Attempt: {row.original.status}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Payment: {row.original.paymentStatus}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Reservation: {row.original.reservationStatus ?? "n/a"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "failureReason",
        header: "Failure",
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.original.failureReason ?? "n/a"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {formatWhen(row.original.updatedAt, tz)}
          </span>
        ),
      },
      {
        id: "review",
        header: "Review",
        Cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {reviewLabel(row.original.review, tz)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        Cell: ({ row }) => {
          const item = row.original;
          const retryKey = `attempt:${item.id}:retry`;
          const reviewKey = `attempt:${item.id}:review`;
          return (
            <div className="flex flex-wrap gap-2">
              {item.retryable ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actioningKey === retryKey}
                  onClick={() =>
                    void runAction(
                      retryKey,
                      { action: "retry_attempt", attemptId: item.id },
                      "Retry sent for booking attempt."
                    )
                  }
                >
                  Retry finalize
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                disabled={actioningKey === reviewKey}
                onClick={() =>
                  void runAction(
                    reviewKey,
                    { action: "mark_reviewed", targetType: "attempt", targetId: item.id },
                    "Attempt marked as reviewed."
                  )
                }
              >
                Mark reviewed
              </Button>
              {item.appointmentId ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/scheduling/bookings/${item.appointmentId}`}>
                    Open booking
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [actioningKey, tz]
  );

  const stripeEventColumns = useMemo<MRT_ColumnDef<OpsStripeEventRow>[]>(
    () => [
      {
        accessorKey: "eventType",
        header: "Event",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-white">
              {row.original.eventType}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {row.original.eventId}
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-white">
              {row.original.customerName ?? "n/a"}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {row.original.customerEmail ?? "n/a"}
            </div>
          </div>
        ),
      },
      {
        id: "related",
        header: "Related",
        Cell: ({ row }) => (
          <div className="min-w-0 text-sm text-gray-700 dark:text-gray-200">
            <div>Attempt: {row.original.bookingAttemptId ?? "n/a"}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {formatSlot(row.original.startAtUtc, row.original.endAtUtc, tz)}
            </div>
          </div>
        ),
      },
      {
        id: "payment",
        header: "Payment IDs",
        Cell: ({ row }) => (
          <div className="min-w-0 text-sm text-gray-700 dark:text-gray-200">
            <div className="truncate">PI: {row.original.paymentIntentId ?? "n/a"}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              Session: {row.original.checkoutSessionId ?? "n/a"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        Cell: ({ row }) => (
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <div>{row.original.status}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.lastError ?? "n/a"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {formatWhen(row.original.updatedAt, tz)}
          </span>
        ),
      },
      {
        id: "review",
        header: "Review",
        Cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {reviewLabel(row.original.review, tz)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        Cell: ({ row }) => {
          const item = row.original;
          const retryKey = `event:${item.eventId}:retry`;
          const reviewKey = `event:${item.eventId}:review`;
          return (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={actioningKey === retryKey}
                onClick={() =>
                  void runAction(
                    retryKey,
                    { action: "retry_event", eventId: item.eventId },
                    "Retry sent for Stripe event."
                  )
                }
              >
                Retry event
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actioningKey === reviewKey}
                onClick={() =>
                  void runAction(
                    reviewKey,
                    { action: "mark_reviewed", targetType: "event", targetId: item.eventId },
                    "Stripe event marked as reviewed."
                  )
                }
              >
                Mark reviewed
              </Button>
              {item.appointmentId ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/scheduling/bookings/${item.appointmentId}`}>
                    Open booking
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [actioningKey, tz]
  );

  const chips = (
    <>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
        {summary.paidWithoutBookingCount} paid without booking
      </span>
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-800">
        {summary.bookingFailedCount} booking failed
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
        {summary.expiredAttemptCount} expired
      </span>
      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800">
        {summary.failedStripeEventCount} failed Stripe events
      </span>
      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
        {summary.stuckStripeEventCount} stuck processing events
      </span>
    </>
  );

  return (
    <div className="space-y-8">
      <ProductHero
        eyebrow="Scheduling Admin"
        title="Payment ops"
        subtitle={`${orgName ? `${orgName} · ` : ""}Monitor paid booking recovery, expiry, and Stripe event failures. Times shown in ${tz}.`}
        chips={chips}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void loadData()}
              disabled={loading || Boolean(actioningKey)}
            >
              Refresh
            </Button>
            <Button
              onClick={() =>
                void runAction(
                  "cleanup",
                  { action: "run_cleanup" },
                  "Cleanup jobs ran successfully."
                )
              }
              disabled={loading || actioningKey === "cleanup"}
            >
              Run cleanup
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Paid without booking", summary.paidWithoutBookingCount, "amber"],
          ["Booking failed", summary.bookingFailedCount, "red"],
          ["Expired attempts", summary.expiredAttemptCount, "slate"],
          ["Failed Stripe events", summary.failedStripeEventCount, "rose"],
          ["Stuck Stripe events", summary.stuckStripeEventCount, "blue"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <MrtCardTable
        title="Booking attempts"
        subtitle="Failed, expired, or paid attempts that still need operator attention."
        table={{
          columns: attemptColumns,
          data: data?.attempts ?? [],
          state: {
            isLoading: loading,
          },
          enableGlobalFilter: false,
          enableColumnActions: false,
          enableDensityToggle: false,
          enableFullScreenToggle: false,
          initialState: {
            pagination: { pageSize: 25, pageIndex: 0 },
          },
        }}
      />

      <MrtCardTable
        title="Stripe events"
        subtitle="Failed or stuck webhook events that may need replay or inspection."
        table={{
          columns: stripeEventColumns,
          data: data?.stripeEvents ?? [],
          state: {
            isLoading: loading,
          },
          enableGlobalFilter: false,
          enableColumnActions: false,
          enableDensityToggle: false,
          enableFullScreenToggle: false,
          initialState: {
            pagination: { pageSize: 25, pageIndex: 0 },
          },
        }}
      />
    </div>
  );
}
