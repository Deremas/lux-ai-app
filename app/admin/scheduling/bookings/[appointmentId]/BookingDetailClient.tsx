"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";

type Booking = {
  id: string;
  orgId: string;
  userId: string;
  staffUserId: string | null;
  meetingTypeId: string;
  meetingTypeKey: string | null;
  durationMin: number | null;
  status: string;
  mode: string;
  paymentPolicy?: string | null;
  paymentStatus?: string | null;
  requiresPayment?: boolean | null;
  priceCents?: number | null;
  currency?: string | null;
  startAtUtc: string | Date;
  endAtUtc: string | Date;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  userName?: string | null;
  userFullName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userCompany?: string | null;
  userCompanyRole?: string | null;
};

type BookingDetail = {
  appointment: Booking;
  history: Array<{
    id: string;
    actorUserId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    action: string;
    createdAt: string | Date;
  }>;
};

type HistoryEntry = BookingDetail["history"][number];

type Props = {
  orgId: string;
  appointmentId: string;
  tz?: string;
};

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

function extractNoteValue(notes: string | null | undefined, key: string) {
  if (!notes) return null;
  const line = notes
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  if (!line) return null;
  const value = line.slice(key.length + 1).trim();
  return value || null;
}

const baseRowHoverSx = (theme: any) => ({
  "&:hover > td": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(148,163,184,0.08)"
        : "rgba(2,132,199,0.06)",
  },
});

const mrtSurfaceProps = {
  muiTablePaperProps: {
    elevation: 0,
    sx: (theme: any) => ({
      backgroundColor: "transparent",
      boxShadow: "none",
      color: theme.palette.text.primary,
    }),
  },
  muiTableContainerProps: {
    sx: (theme: any) => ({
      borderRadius: 10,
      border: `1px solid ${theme.palette.divider}`,
      overflow: "auto",
    }),
  },
  muiTableHeadCellProps: {
    sx: (theme: any) => ({
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(15,23,42,0.6)"
          : "rgba(248,250,252,1)",
      color: theme.palette.text.secondary,
      fontSize: "0.7rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
  muiTableBodyCellProps: {
    sx: (theme: any) => ({
      fontSize: "0.75rem",
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
};

export default function BookingDetailClient({ orgId, appointmentId, tz }: Props) {
  const { status } = useSession();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [reason, setReason] = useState("");

  const timezone = useMemo(() => {
    if (tz) return tz;
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, [tz]);


  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId || !appointmentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/scheduling/admin/appointments/${appointmentId}?orgId=${orgId}`, {
      cache: "no-store",
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load booking");
          return;
        }
        setDetail(data as BookingDetail);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, appointmentId, status]);

  async function runAction(action: "approve" | "decline") {
    if (!orgId || !appointmentId) return;
    setActioning(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/appointments/${appointmentId}/${action}?orgId=${orgId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Action failed");
        return;
      }
      if (data?.emailError) {
        setNotice(
          `${action === "approve" ? "Approved" : "Declined"}; email failed: ${
            data.emailError
          }`
        );
      } else {
        setNotice(action === "approve" ? "Approved." : "Declined.");
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              appointment: {
                ...prev.appointment,
                status: action === "approve" ? "confirmed" : "declined",
              },
            }
          : prev
      );
    } catch {
      setError("Action failed");
    } finally {
      setActioning(false);
    }
  }

  async function runCancel() {
    if (!orgId || !appointmentId) return;
    setActioning(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/scheduling/appointments/${appointmentId}/cancel?orgId=${orgId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Cancel failed");
        return;
      }
      setNotice("Canceled.");
      setDetail((prev) =>
        prev
          ? { ...prev, appointment: { ...prev.appointment, status: "canceled" } }
          : prev
      );
    } catch {
      setError("Cancel failed");
    } finally {
      setActioning(false);
    }
  }

  async function runRestore() {
    if (!orgId || !appointmentId) return;
    setActioning(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/appointments/${appointmentId}/restore?orgId=${orgId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Restore failed");
        return;
      }
      setNotice(
        data?.emailError ? `Restored; email failed: ${data.emailError}` : "Restored."
      );
      setDetail((prev) =>
        prev
          ? { ...prev, appointment: { ...prev.appointment, status: "confirmed" } }
          : prev
      );
    } catch {
      setError("Restore failed");
    } finally {
      setActioning(false);
    }
  }

  async function runPaymentUpdate(nextStatus: "paid" | "unpaid") {
    if (!orgId || !appointmentId) return;
    setActioning(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/scheduling/admin/appointments/${appointmentId}/payment?orgId=${orgId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Payment update failed");
        return;
      }
      setNotice(nextStatus === "paid" ? "Marked as paid." : "Marked as unpaid.");
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              appointment: { ...prev.appointment, paymentStatus: nextStatus },
            }
          : prev
      );
    } catch {
      setError("Payment update failed");
    } finally {
      setActioning(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to view booking details
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

  const appointment = detail?.appointment;
  const start = appointment
    ? DateTime.fromJSDate(
        appointment.startAtUtc instanceof Date
          ? appointment.startAtUtc
          : new Date(appointment.startAtUtc)
      ).setZone(timezone)
    : null;
  const end = appointment
    ? DateTime.fromJSDate(
        appointment.endAtUtc instanceof Date
          ? appointment.endAtUtc
          : new Date(appointment.endAtUtc)
      ).setZone(timezone)
    : null;
  const priceLabel = appointment
    ? formatMoney(appointment.priceCents, appointment.currency)
    : null;
  const paymentStatus = appointment?.paymentStatus ?? "not_required";
  const paymentRequired = Boolean(appointment?.requiresPayment);
  const canMarkPaid = paymentRequired && paymentStatus !== "paid";
  const canMarkUnpaid = paymentRequired && paymentStatus === "paid";
  const paymentSession = appointment
    ? extractNoteValue(appointment.notes, "payment_session_id")
    : null;
  const paymentIntent = appointment
    ? extractNoteValue(appointment.notes, "payment_intent_id")
    : null;

  const historyColumns = useMemo<MRT_ColumnDef<HistoryEntry>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Time",
        Cell: ({ row }) => {
          const created = DateTime.fromJSDate(
            row.original.createdAt instanceof Date
              ? row.original.createdAt
              : new Date(row.original.createdAt)
          ).setZone(timezone);
          return (
            <span className="text-xs text-gray-700 dark:text-gray-200">
              {created.toFormat("LLL dd, HH:mm")}
            </span>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action",
        Cell: ({ row }) => (
          <span className="font-semibold text-gray-800 dark:text-gray-100">
            {row.original.action}
          </span>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        Cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {row.original.actorName || row.original.actorEmail || "System"}
          </span>
        ),
      },
    ],
    [timezone]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Booking details
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Full booking context and actions. Times shown in {timezone}.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Loading booking...
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700 backdrop-blur">
            {notice}
          </div>
        )}

        {!loading && !error && appointment && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr]">
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    Meeting
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                    {formatKeyLabel(appointment.meetingTypeKey ?? "Meeting")}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {appointment.mode}
                  </p>
                </div>
                <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
                  {appointment.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-gray-700 dark:text-gray-300">
                {start && end && (
                  <p>
                    Time: {start.toFormat("ccc, LLL dd")} · {start.toFormat("HH:mm")}–{end.toFormat("HH:mm")}
                  </p>
                )}
                <p>Duration: {appointment.durationMin ?? 60} min</p>
                {appointment.staffUserId && <p>Staff: {appointment.staffUserId}</p>}
                <p>Booking ID: {appointment.id}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Booker
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {appointment.userFullName || appointment.userName || appointment.userEmail}
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {appointment.userEmail && (
                  <p>
                    Email:{" "}
                    <a className="text-blue-600 hover:underline" href={`mailto:${appointment.userEmail}`}>
                      {appointment.userEmail}
                    </a>
                  </p>
                )}
                {appointment.userPhone && (
                  <p>
                    Phone:{" "}
                    <a className="text-blue-600 hover:underline" href={`tel:${appointment.userPhone}`}>
                      {appointment.userPhone}
                    </a>
                  </p>
                )}
                {appointment.userCompany && <p>Company: {appointment.userCompany}</p>}
                {appointment.userCompanyRole && <p>Role: {appointment.userCompanyRole}</p>}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && appointment && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {appointment.notes ?? "No notes"}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Payment</p>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Payment:{" "}
                  {appointment.paymentPolicy
                    ? appointment.paymentPolicy === "FREE"
                      ? "Free"
                      : "Paid"
                    : "n/a"}
                </p>
                <p>Status: {paymentStatus}</p>
                {priceLabel && <p>Price: {priceLabel}</p>}
                {paymentSession && <p>Session: {paymentSession}</p>}
                {paymentIntent && <p>Intent: {paymentIntent}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {canMarkPaid && (
                  <Button size="sm" onClick={() => runPaymentUpdate("paid")} disabled={actioning}>
                    Mark paid
                  </Button>
                )}
                {canMarkUnpaid && (
                  <Button size="sm" variant="outline" onClick={() => runPaymentUpdate("unpaid")} disabled={actioning}>
                    Mark unpaid
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && detail && (
          <div className="mt-6 rounded-xl border border-white/70 bg-white/80 p-5 text-sm shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Status history
              </p>
              <span className="text-xs text-gray-500">
                {detail.history.length} updates
              </span>
            </div>
            {detail.history.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No status history yet.</p>
            ) : (
              <div className="mt-3">
                <MaterialReactTable
                  columns={historyColumns}
                  data={detail.history}
                  enablePagination={false}
                  enableSorting={false}
                  enableColumnActions={false}
                  enableColumnFilters={false}
                  enableGlobalFilter={false}
                  enableDensityToggle={false}
                  enableFullScreenToggle={false}
                  enableTopToolbar={false}
                  enableBottomToolbar={false}
                  muiTableBodyRowProps={{
                    sx: (theme) => baseRowHoverSx(theme),
                  }}
                  {...mrtSurfaceProps}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !error && appointment && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Input
              className="min-w-[220px] flex-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional note"
            />
            {appointment.status === "pending" && (
              <>
                <Button onClick={() => runAction("approve")} disabled={actioning}>
                  {actioning ? "Working..." : "Approve"}
                </Button>
                <Button variant="outline" onClick={() => runAction("decline")} disabled={actioning}>
                  Decline
                </Button>
              </>
            )}
            {(appointment.status === "pending" || appointment.status === "confirmed") && (
              <Button variant="outline" onClick={runCancel} disabled={actioning}>
                Cancel
              </Button>
            )}
            {appointment.status === "canceled" && (
              <Button variant="outline" onClick={runRestore} disabled={actioning}>
                Restore
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

