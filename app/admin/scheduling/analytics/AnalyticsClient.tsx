"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { ArrowLeft, CalendarDays, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  orgId: string;
  tz: string;
};

type AnalyticsResponse = {
  tz: string;
  baseCurrency: string | null;
  range: { from: string | null; to: string | null };
  totals: { appointments: number };
  byStatus: Array<{ status: string; count: number }>;
  byMode: Array<{ mode: string; count: number }>;
  revenueByCurrency: Array<{
    currency: string | null;
    count: number;
    totalCents: number;
  }>;
  expectedRevenueByCurrency?: Array<{
    currency: string | null;
    count: number;
    totalCents: number;
  }>;
  meetingTypes: Array<{
    meetingTypeId: string;
    meetingTypeKey: string;
    count: number;
  }>;
  timeline: Array<{
    date: string;
    appointments: number;
    revenueCents: number;
    pending: number;
    confirmed: number;
    completed: number;
    declined: number;
    canceled: number;
  }>;
  staff: Array<{
    id: string;
    name: string | null;
    email: string | null;
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    declined: number;
    canceled: number;
  }>;
};

type AnalyticsListItem = {
  id: string;
  startAtUtc: string;
  endAtUtc: string;
  status: string;
  mode: string;
  priceCents: number | null;
  currency: string | null;
  paymentStatus: string | null;
  meetingTypeKey: string;
  customerName: string | null;
  customerEmail: string | null;
};

type StaffRow = AnalyticsResponse["staff"][number];

const baseRowHoverSx = (theme: any) => ({
  "&:hover > td": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(148,163,184,0.08)" // subtle
        : "rgba(2,132,199,0.06)", // subtle sky tint
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
      borderRadius: 16,
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
      fontSize: "0.75rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
  muiTableBodyCellProps: {
    sx: (theme: any) => ({
      fontSize: "0.875rem",
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
  muiTopToolbarProps: {
    sx: (theme: any) => ({
      backgroundColor: "transparent",
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
  muiBottomToolbarProps: {
    sx: (theme: any) => ({
      backgroundColor: "transparent",
      borderTop: `1px solid ${theme.palette.divider}`,
    }),
  },
};

type AnalyticsListResponse = {
  items: AnalyticsListItem[];
  total: number;
  hasMore: boolean;
};

type ListType = "all" | "paid" | "expected";

const RANGE_OPTIONS = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "custom", label: "Custom range", days: null },
  { id: "all", label: "All time", days: null },
];

const trendConfig = {
  appointments: { label: "Appointments", color: "#2563eb" },
  revenue: { label: "Revenue", color: "#16a34a" },
};

const meetingTypeConfig = {
  count: { label: "Bookings", color: "#14b8a6" },
};

const staffConfig = {
  total: { label: "Bookings", color: "#06b6d4" },
};

const CHART_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#94a3b8",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#16a34a",
  declined: "#ef4444",
  canceled: "#94a3b8",
};

const MODE_COLORS: Record<string, string> = {
  google_meet: "#2563eb",
  zoom: "#0ea5e9",
  phone: "#f59e0b",
  in_person: "#10b981",
};

function formatCurrency(valueCents: number, currency: string | null) {
  if (!currency) return valueCents.toLocaleString();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(valueCents / 100);
  } catch {
    return `${(valueCents / 100).toFixed(2)} ${currency}`;
  }
}

function formatCompact(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function hashKey(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function colorForKey(
  key: string,
  overrides: Record<string, string> = {}
): string {
  if (overrides[key]) return overrides[key];
  const index = hashKey(key) % CHART_COLORS.length;
  return CHART_COLORS[index];
}

export default function AnalyticsClient({ orgId, tz }: Props) {
  const [rangeId, setRangeId] = useState("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = DateTime.now().setZone(tz);
  const currentYear = now.year;
  const [yearWindowCenter, setYearWindowCenter] = useState(currentYear);
  const [yearJump, setYearJump] = useState(String(currentYear));
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    now.startOf("month").toJSDate()
  );
  const monthsToShow = 2;
  const [listOpen, setListOpen] = useState(false);
  const [listType, setListType] = useState<ListType>("all");
  const [listStaff, setListStaff] = useState<{
    id: string;
    name: string;
    email?: string | null;
  } | null>(null);
  const [listLabelOverride, setListLabelOverride] = useState<string | null>(
    null
  );
  const [listItems, setListItems] = useState<AnalyticsListItem[]>([]);
  const [listTotal, setListTotal] = useState<number | null>(null);
  const [listHasMore, setListHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const router = useRouter();

  const range = useMemo(() => {
    if (rangeId === "custom") {
      if (!customRange?.from || !customRange?.to) return null;
      const from = DateTime.fromJSDate(customRange.from)
        .setZone(tz)
        .startOf("day");
      const to = DateTime.fromJSDate(customRange.to)
        .setZone(tz)
        .endOf("day");
      return { from: from.toISO(), to: to.toISO() };
    }
    const opt = RANGE_OPTIONS.find((o) => o.id === rangeId) ?? RANGE_OPTIONS[1];
    if (!opt.days) return null;
    const to = DateTime.now().setZone(tz);
    const from = to.minus({ days: opt.days });
    return { from: from.toISO(), to: to.toISO() };
  }, [rangeId, tz, customRange]);

  useEffect(() => {
    if (rangeId === "custom" && (!customRange?.from || !customRange?.to)) {
      setRangeDialogOpen(true);
    }
  }, [rangeId, customRange?.from, customRange?.to]);

  useEffect(() => {
    if (rangeDialogOpen) {
      setDraftRange(customRange);
    }
  }, [rangeDialogOpen, customRange]);

  useEffect(() => {
    if (!customRange?.from) return;
    setCalendarMonth(customRange.from);
    const year = DateTime.fromJSDate(customRange.from).year;
    setYearWindowCenter(year);
    setYearJump(String(year));
  }, [customRange?.from]);

  useEffect(() => {
    if (!rangeDialogOpen) return;
    setYearJump(String(yearWindowCenter));
  }, [rangeDialogOpen, yearWindowCenter]);

  // Always show two months; small screens will stack vertically.

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ orgId, tz });
    if (range?.from) params.set("from", range.from);
    if (range?.to) params.set("to", range.to);
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    fetch(`/api/scheduling/admin/analytics?${params.toString()}`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (!ok) {
          setError(json?.error ?? "Failed to load analytics.");
          setData(null);
          return;
        }
        setData(json as AnalyticsResponse);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, tz, range?.from, range?.to, statusFilter]);

  const listQueryKey = `${listType}:${listStaff?.id ?? ""}`;
  const stopScrollPropagation = (event: React.WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (!listOpen || !orgId) return;
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    setListItems([]);
    setListTotal(null);
    setListHasMore(false);

    const params = new URLSearchParams({ orgId, type: listType, tz });
    if (range?.from) params.set("from", range.from);
    if (range?.to) params.set("to", range.to);
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (listStaff?.id) {
      params.set("staffUserId", listStaff.id);
    }

    fetch(`/api/scheduling/admin/analytics/list?${params.toString()}`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (!ok) {
          setListError(json?.error ?? "Failed to load appointments.");
          setListItems([]);
          setListTotal(null);
          setListHasMore(false);
          return;
        }
        const payload = json as AnalyticsListResponse;
        setListItems(payload.items ?? []);
        setListTotal(payload.total ?? null);
        setListHasMore(Boolean(payload.hasMore));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setListError(
          err instanceof Error ? err.message : "Failed to load appointments."
        );
        setListItems([]);
        setListTotal(null);
        setListHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listOpen, listQueryKey, orgId, tz, range?.from, range?.to, statusFilter]);

  useEffect(() => {
    if (!listOpen) return;
    const originalBody = document.body.style.overflow;
    const originalHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBody;
      document.documentElement.style.overflow = originalHtml;
    };
  }, [listOpen]);

  const openList = (type: ListType, labelOverride?: string | null) => {
    setListType(type);
    setListStaff(null);
    setListLabelOverride(labelOverride ?? null);
    setListOpen(true);
  };

  const openStaffList = (staff: {
    id: string;
    name: string;
    email?: string | null;
  }) => {
    setListType("all");
    setListStaff(staff);
    setListLabelOverride(null);
    setListOpen(true);
  };

  const chartTz = data?.tz || tz;

  const rangeLabel = useMemo(() => {
    const fromIso = data?.range?.from ?? range?.from ?? null;
    const toIso = data?.range?.to ?? range?.to ?? null;
    if (rangeId === "custom" && (!fromIso || !toIso)) return "Custom range";
    if (!fromIso || !toIso) return "All time";
    const from = DateTime.fromISO(fromIso).setZone(chartTz);
    const to = DateTime.fromISO(toIso).setZone(chartTz);
    if (!from.isValid || !to.isValid) return "All time";
    return `${from.toFormat("LLL dd")} – ${to.toFormat("LLL dd")}`;
  }, [data?.range?.from, data?.range?.to, range?.from, range?.to, chartTz]);

  const timeline = useMemo(() => {
    return (data?.timeline ?? []).map((item) => ({
      ...item,
      label: DateTime.fromISO(item.date).setZone(chartTz).toFormat("LLL dd"),
      revenue: item.revenueCents / 100,
    }));
  }, [data?.timeline, chartTz]);

  const baseCurrency = data?.baseCurrency ?? null;
  const baseRevenue =
    data?.revenueByCurrency.find((row) => row.currency === baseCurrency) ??
    data?.revenueByCurrency[0];
  const baseExpectedRevenue =
    data?.expectedRevenueByCurrency?.find(
      (row) => row.currency === baseCurrency
    ) ?? data?.expectedRevenueByCurrency?.[0];

  const totalCompleted =
    data?.byStatus.find((row) => row.status === "completed")?.count ?? 0;
  const completionRate = data?.totals.appointments
    ? Math.round((totalCompleted / data.totals.appointments) * 100)
    : 0;

  const staffChartData = useMemo(
    () =>
      (data?.staff ?? [])
        .map((row) => ({
          name: row.name ?? row.email ?? "Staff",
          total: row.total,
        }))
        .sort((a, b) => b.total - a.total),
    [data?.staff]
  );

  const topMeetingTypes = useMemo(
    () => (data?.meetingTypes ?? []).slice(0, 6),
    [data?.meetingTypes]
  );

  const modeData = useMemo(
    () =>
      (data?.byMode ?? [])
        .map((row) => ({
          key: row.mode,
          name: titleCase(row.mode),
          value: row.count,
          fill: colorForKey(row.mode, MODE_COLORS),
        }))
        .sort((a, b) => b.value - a.value),
    [data?.byMode]
  );
  const modeChartData = useMemo(
    () => modeData.filter((entry) => entry.value > 0),
    [modeData]
  );
  const hasZeroMode = useMemo(
    () => modeData.some((entry) => entry.value === 0),
    [modeData]
  );

  const maxStaffTotal = Math.max(
    1,
    ...(data?.staff ?? []).map((row) => row.total)
  );

  const statusKeys = useMemo(
    () => (data?.byStatus ?? []).map((row) => row.status),
    [data?.byStatus]
  );

  const statusOptions = useMemo(() => {
    const base = [
      "all",
      "pending",
      "confirmed",
      "completed",
      "declined",
      "canceled",
    ];
    const fromData = (data?.byStatus ?? [])
      .map((row) => row.status)
      .filter(Boolean);
    const set = new Set([...base, ...fromData]);
    return Array.from(set);
  }, [data?.byStatus]);

  const applyQuickRange = (from: DateTime, to: DateTime) => {
    const next = {
      from: from.toJSDate(),
      to: to.toJSDate(),
    };
    setCustomRange(next);
    setDraftRange(next);
    setRangeId("custom");
    setRangeDialogOpen(false);
  };

  const applyDraftRange = () => {
    if (!draftRange?.from || !draftRange?.to) return;
    setCustomRange(draftRange);
    setRangeId("custom");
    setRangeDialogOpen(false);
  };

  const applyYearJump = () => {
    const nextYear = Number(yearJump);
    if (!Number.isFinite(nextYear) || nextYear < 1 || nextYear > 9999) {
      return;
    }
    setYearWindowCenter(nextYear);
    const currentMonth = DateTime.fromJSDate(calendarMonth);
    const month = currentMonth.isValid ? currentMonth.month : 1;
    const nextMonth = DateTime.fromObject({
      year: nextYear,
      month,
      day: 1,
    }).toJSDate();
    setCalendarMonth(nextMonth);
  };

  const statusConfig = useMemo(() => {
    return statusKeys.reduce<Record<string, { label: string; color: string }>>(
      (acc, status) => {
        acc[status] = {
          label: titleCase(status),
          color: colorForKey(status, STATUS_COLORS),
        };
        return acc;
      },
      {}
    );
  }, [statusKeys]);

  const modeConfig = useMemo(() => {
    return (data?.byMode ?? []).reduce<
      Record<string, { label: string; color: string }>
    >((acc, row) => {
      const key = row.mode || "unknown";
      acc[key] = {
        label: titleCase(key),
        color: colorForKey(key, MODE_COLORS),
      };
      return acc;
    }, {});
  }, [data?.byMode]);

  const listTitle = useMemo(() => {
    if (listLabelOverride) return listLabelOverride;
    const staffLabel = listStaff?.name
      ? ` · ${listStaff.name}`
      : listStaff?.email
      ? ` · ${listStaff.email}`
      : "";
    if (listType === "paid") return `Paid revenue appointments${staffLabel}`;
    if (listType === "expected") return `Expected revenue appointments${staffLabel}`;
    return `All appointments${staffLabel}`;
  }, [listType, listStaff, listLabelOverride]);

  const listContextLabel = useMemo(() => {
    const statusLabel =
      statusFilter === "all" ? "All statuses" : titleCase(statusFilter);
    return `${rangeLabel} · ${statusLabel}`;
  }, [rangeLabel, statusFilter]);

  const formatListDate = (iso: string) =>
    DateTime.fromISO(iso)
      .setZone(chartTz)
      .toFormat("LLL dd, yyyy · HH:mm");

  const openBookingDetail = (appointmentId: string) => {
    const params = new URLSearchParams();
    if (chartTz) params.set("tz", chartTz);
    const query = params.toString();
    router.push(
      query
        ? `/admin/scheduling/bookings/${appointmentId}?${query}`
        : `/admin/scheduling/bookings/${appointmentId}`
    );
  };

  const listColumns = useMemo<MRT_ColumnDef<AnalyticsListItem>[]>(
    () => [
      {
        accessorKey: "startAtUtc",
        header: "Date/time",
        Cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-slate-600">
            {formatListDate(row.original.startAtUtc)}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-semibold text-slate-900">
              {row.original.customerName ?? "Customer"}
            </div>
            {row.original.customerEmail && (
              <div className="text-xs text-slate-500">
                {row.original.customerEmail}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "meetingTypeKey",
        header: "Meeting type",
        Cell: ({ row }) => (
          <span>{titleCase(row.original.meetingTypeKey)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {titleCase(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "mode",
        header: "Mode",
        Cell: ({ row }) => <span>{titleCase(row.original.mode)}</span>,
      },
      {
        id: "price",
        header: "Price",
        Cell: ({ row }) => (
          <span className="block text-right">
            {row.original.priceCents !== null
              ? formatCurrency(row.original.priceCents, row.original.currency)
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "currency",
        header: "Currency",
        Cell: ({ row }) => (
          <span className="block text-center">{row.original.currency ?? "—"}</span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment status",
        Cell: ({ row }) => (
          <span>
            {row.original.paymentStatus
              ? titleCase(row.original.paymentStatus)
              : "Unpaid"}
          </span>
        ),
      },
    ],
    [chartTz]
  );

  const staffColumns = useMemo<MRT_ColumnDef<StaffRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Staff",
        Cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900">
              {row.original.name ?? "Staff member"}
            </p>
            {row.original.email && (
              <p className="text-xs text-gray-500">{row.original.email}</p>
            )}
          </div>
        ),
      },
      {
        id: "utilization",
        header: "Utilization",
        Cell: ({ row }) => {
          const completion =
            row.original.total > 0
              ? Math.round((row.original.completed / row.original.total) * 100)
              : 0;
          const utilization = Math.round(
            (row.original.total / maxStaffTotal) * 100
          );
          return (
            <div className="min-w-[180px]">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{utilization}%</span>
                <span className="text-gray-300">·</span>
                <span>{completion}% completed</span>
              </div>
              <Progress value={utilization} className="mt-2" />
            </div>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        Cell: ({ row }) => (
          <span className="block text-right font-semibold">{row.original.total}</span>
        ),
      },
      {
        accessorKey: "pending",
        header: "Pending",
        Cell: ({ row }) => (
          <span className="block text-right">{row.original.pending}</span>
        ),
      },
      {
        accessorKey: "confirmed",
        header: "Confirmed",
        Cell: ({ row }) => (
          <span className="block text-right">{row.original.confirmed}</span>
        ),
      },
      {
        accessorKey: "completed",
        header: "Completed",
        Cell: ({ row }) => (
          <span className="block text-right">{row.original.completed}</span>
        ),
      },
      {
        accessorKey: "declined",
        header: "Declined",
        Cell: ({ row }) => (
          <span className="block text-right">{row.original.declined}</span>
        ),
      },
      {
        accessorKey: "canceled",
        header: "Canceled",
        Cell: ({ row }) => (
          <span className="block text-right">{row.original.canceled}</span>
        ),
      },
    ],
    [maxStaffTotal]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Analytics
                </h1>
                <Link
                  className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                    href="/admin/scheduling"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600"
                >
                  TZ {chartTz}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600"
                >
                  {rangeLabel}
                </Badge>
                {statusFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600"
                  >
                    {titleCase(statusFilter)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Track appointment volume, revenue, and staff activity.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:w-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Range
                </span>
                <select
                  className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
                  value={rangeId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setRangeId(next);
                    if (next === "custom") setRangeDialogOpen(true);
                  }}
                >
                  {RANGE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className={[
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold sm:w-auto",
                      "border-slate-200 bg-white text-slate-900 shadow-sm",
                      "hover:bg-slate-100 transition",
                    ].join(" ")}
                  >
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span className="flex-1 text-left">
                      {customRange?.from && customRange?.to
                        ? `${DateTime.fromJSDate(customRange.from)
                            .setZone(tz)
                            .toFormat("LLL dd")} – ${DateTime.fromJSDate(
                            customRange.to
                          )
                            .setZone(tz)
                            .toFormat("LLL dd")}`
                        : "Custom range"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-none w-[min(1040px,94vw)] max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl dark:bg-slate-900">
                  <div className="p-6">
                    <DialogHeader>
                      <DialogTitle>Choose a custom range</DialogTitle>
                      <DialogDescription>
                        Select a start and end date. Use the month/year dropdowns
                        to jump quickly.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="pt-4 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() =>
                            applyQuickRange(
                              now.startOf("month"),
                              now.endOf("month")
                            )
                          }
                        >
                          This month
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            const lastMonth = now.minus({ months: 1 });
                            applyQuickRange(
                              lastMonth.startOf("month"),
                              lastMonth.endOf("month")
                            );
                          }}
                        >
                          Last month
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() =>
                            applyQuickRange(
                              now.startOf("year"),
                              now.endOf("year")
                            )
                          }
                        >
                          This year
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            const lastYear = now.minus({ years: 1 });
                            applyQuickRange(
                              lastYear.startOf("year"),
                              lastYear.endOf("year")
                            );
                          }}
                        >
                          Last year
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() =>
                            applyQuickRange(
                              now.minus({ months: 12 }).startOf("day"),
                              now.endOf("day")
                            )
                          }
                        >
                          Last 12 months
                        </button>
                        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold uppercase tracking-wide">
                            Jump to year
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="h-8 w-24 rounded-md border border-slate-200 px-2 text-sm text-slate-900"
                            value={yearJump}
                            onChange={(e) => setYearJump(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") applyYearJump();
                            }}
                            placeholder="YYYY"
                          />
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={applyYearJump}
                          >
                            Go
                          </button>
                        </div>
                      </div>
                      <Calendar
                        mode="range"
                        numberOfMonths={monthsToShow}
                        captionLayout="dropdown"
                        hideNavigation
                        fromYear={yearWindowCenter - 100}
                        toYear={yearWindowCenter + 100}
                        className="w-full [--cell-size:2.25rem] sm:[--cell-size:2.5rem]"
                        classNames={{
                          root: "w-full",
                          months:
                            monthsToShow > 1
                              ? "grid w-full gap-6 lg:grid-cols-2"
                              : "grid w-full gap-6",
                          nav: "hidden",
                          month: "w-full",
                          table: "w-full border-collapse",
                        }}
                        selected={draftRange}
                        month={calendarMonth}
                        onMonthChange={(next) => {
                          setCalendarMonth(next);
                          const yr = DateTime.fromJSDate(next).year;
                          if (Number.isFinite(yr)) setYearWindowCenter(yr);
                        }}
                        onSelect={(next) => {
                          setDraftRange(next);
                          if (next?.from && next?.to) {
                            setCustomRange(next);
                            setRangeId("custom");
                            setRangeDialogOpen(false);
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-4 text-xs text-slate-500">
                      <span>Select a start and end date.</span>
                      <div className="flex items-center gap-2">
                        {draftRange?.from && (
                          <button
                            type="button"
                            className="text-slate-600 hover:text-slate-900"
                            onClick={() => {
                              setDraftRange(undefined);
                              if (rangeId === "custom") {
                                setCustomRange(undefined);
                                setRangeId("30d");
                              }
                            }}
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          className={[
                            "rounded-md border px-3 py-1 text-xs font-semibold",
                            "border-slate-200 text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                          onClick={() => setRangeDialogOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!draftRange?.from || !draftRange?.to}
                          className={[
                            "rounded-md border px-3 py-1 text-xs font-semibold",
                            draftRange?.from && draftRange?.to
                              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                              : "border-slate-200 text-slate-400 cursor-not-allowed",
                          ].join(" ")}
                          onClick={applyDraftRange}
                        >
                          Apply range
                        </button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:w-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </span>
                <select
                  className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All" : titleCase(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={listOpen} onOpenChange={setListOpen}>
          <DialogContent className="max-w-none w-[min(1100px,94vw)] h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-hidden bg-white p-0 shadow-2xl dark:bg-slate-900 top-16 sm:top-20 translate-y-0 flex flex-col [&>button]:right-6 [&>button]:top-6 [&>button]:rounded-full [&>button]:bg-white [&>button]:shadow [&>button]:opacity-100 [&>button]:z-10">
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-slate-200 bg-white px-6 pt-6 pb-4 dark:bg-slate-900">
                <DialogHeader className="pr-12 text-left">
                  <DialogTitle>{listTitle}</DialogTitle>
                  <DialogDescription>{listContextLabel}</DialogDescription>
                </DialogHeader>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {listTotal !== null
                      ? `${listTotal} appointments`
                      : "Appointments"}
                  </span>
                  {listHasMore && <span>Showing first 200 results</span>}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden px-6 py-4 pb-6 flex flex-col gap-4">
                {listLoading && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Loading appointments...
                  </div>
                )}
                {listError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {listError}
                  </div>
                )}
                {!listLoading && !listError && (
                  <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white">
                    <div
                      className="h-full min-h-0 overflow-auto overscroll-contain"
                      onWheelCapture={stopScrollPropagation}
                    >
                      <MaterialReactTable
                        columns={listColumns}
                        data={listItems}
                        enablePagination={false}
                        enableSorting={false}
                        enableColumnActions={false}
                        enableColumnFilters={false}
                        enableGlobalFilter={false}
                        enableDensityToggle={false}
                        enableFullScreenToggle={false}
                        enableTopToolbar={false}
                        enableBottomToolbar={false}
                        muiTableBodyRowProps={({ row }) => ({
                          role: "button",
                          tabIndex: 0,
                          onClick: () => openBookingDetail(row.original.id),
                          onKeyDown: (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openBookingDetail(row.original.id);
                            }
                          },
                          sx: (theme) => ({
                            ...baseRowHoverSx(theme),
                            cursor: "pointer",
                          }),
                        })}
                        renderEmptyRowsFallback={() => (
                          <div className="py-6 text-center text-sm text-slate-500">
                            No appointments found for this selection.
                          </div>
                        )}
                        {...mrtSurfaceProps}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading analytics...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card
              className="relative overflow-hidden border-slate-200 cursor-pointer transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
              role="button"
              tabIndex={0}
              onClick={() => openList("all")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openList("all");
                }
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-400" />
              <CardHeader className="pb-2">
                <CardDescription>Total appointments</CardDescription>
                <CardTitle className="text-3xl">
                  {data.totals.appointments}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="secondary"
                  className="bg-blue-50 text-blue-700"
                >
                  Completion {completionRate}%
                </Badge>
                <Progress value={completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-slate-200 cursor-pointer transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
              role="button"
              tabIndex={0}
              onClick={() => openList("paid")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openList("paid");
                }
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-lime-400" />
              <CardHeader className="pb-2">
                <CardDescription>Paid revenue</CardDescription>
                <CardTitle className="text-3xl">
                  {baseRevenue
                    ? formatCurrency(
                        baseRevenue.totalCents,
                        baseRevenue.currency
                      )
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700"
                >
                  {baseRevenue
                    ? `${baseRevenue.count} payments`
                    : "No paid revenue yet"}
                </Badge>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-slate-200 cursor-pointer transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
              role="button"
              tabIndex={0}
              onClick={() => openList("expected")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openList("expected");
                }
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-400" />
              <CardHeader className="pb-2">
                <CardDescription>Expected revenue</CardDescription>
                <CardTitle className="text-3xl">
                  {baseExpectedRevenue
                    ? formatCurrency(
                        baseExpectedRevenue.totalCents,
                        baseExpectedRevenue.currency
                      )
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700"
                >
                  {baseExpectedRevenue
                    ? `${baseExpectedRevenue.count} unpaid`
                    : "No unpaid revenue"}
                </Badge>
              </CardContent>
            </Card>

            <Card
              className="relative overflow-hidden border-slate-200 cursor-pointer transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
              role="button"
              tabIndex={0}
              onClick={() => openList("all", "Avg per day appointments")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openList("all", "Avg per day appointments");
                }
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
              <CardHeader className="pb-2">
                <CardDescription>Avg per day</CardDescription>
                <CardTitle className="text-3xl">
                  {timeline.length
                    ? formatCompact(
                        Math.round(
                          timeline.reduce(
                            (sum, day) => sum + day.appointments,
                            0
                          ) / timeline.length
                        )
                      )
                    : "0"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="secondary"
                  className="bg-amber-50 text-amber-700"
                >
                  Based on {timeline.length} days
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Appointments & revenue</CardTitle>
                  <CardDescription>
                    Daily volume with paid revenue overlay.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600"
                >
                  Trend
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <ChartContainer
                  config={trendConfig}
                  className="h-[320px] w-full"
                >
                  <AreaChart data={timeline} margin={{ left: 8, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    {baseCurrency && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                    )}
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) => `Date ${label}`}
                          formatter={(value, name) => {
                            if (name === "Revenue") {
                              return baseCurrency
                                ? formatCurrency(
                                    Number(value) * 100,
                                    baseCurrency
                                  )
                                : `${Number(value).toFixed(0)}`;
                            }
                            return Number(value).toLocaleString();
                          }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="appointments"
                      yAxisId="left"
                      stroke="var(--color-appointments)"
                      fill="var(--color-appointments)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    {baseCurrency && (
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        yAxisId="right"
                        stroke="var(--color-revenue)"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Status by day</CardTitle>
                <CardDescription>Stacked breakdown of appointment states.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <ChartContainer config={statusConfig} className="h-[280px] w-full">
                    <BarChart data={timeline} margin={{ left: 8, right: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {statusKeys.map((status) => (
                        <Bar
                          key={status}
                          dataKey={status}
                          stackId="status"
                          fill={`var(--color-${status})`}
                        />
                      ))}
                      <ChartLegend content={<ChartLegendContent />} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Mode share</CardTitle>
                <CardDescription>Which booking modes dominate.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <ChartContainer config={modeConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
                      <Pie
                        data={modeChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {modeChartData.map((entry) => (
                          <Cell key={entry.key} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend
                        payload={modeData.map((entry) => ({
                          value: entry.key,
                          dataKey: entry.key,
                          type: "square",
                          color: entry.fill,
                        }))}
                        content={<ChartLegendContent />}
                      />
                    </PieChart>
                  </ChartContainer>
                  {hasZeroMode && (
                    <p className="mt-2 text-xs text-slate-500">
                      Modes with 0 bookings in this range are listed but not shown in
                      the chart.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Top meeting types</CardTitle>
                <CardDescription>Most requested meeting types.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <ChartContainer
                    config={meetingTypeConfig}
                    className="h-[280px] w-full"
                  >
                    <BarChart
                      data={topMeetingTypes.map((row) => ({
                        name: titleCase(row.meetingTypeKey),
                        count: row.count,
                      }))}
                      layout="vertical"
                      margin={{ left: 24, right: 12 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Staff volume</CardTitle>
                <CardDescription>Bookings handled by staff.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <ChartContainer config={staffConfig} className="h-[280px] w-full">
                    <BarChart
                      data={staffChartData}
                      layout="vertical"
                      margin={{ left: 24, right: 12 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="var(--color-total)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Staff performance</CardTitle>
              <CardDescription>Volume, status mix, and completion rate.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-auto">
                <MaterialReactTable
                  columns={staffColumns}
                  data={data.staff}
                  enablePagination={false}
                  enableSorting={false}
                  enableColumnActions={false}
                  enableColumnFilters={false}
                  enableGlobalFilter={false}
                  enableDensityToggle={false}
                  enableFullScreenToggle={false}
                  enableTopToolbar={false}
                  enableBottomToolbar={false}
                  muiTableBodyRowProps={({ row }) => ({
                    role: "button",
                    tabIndex: 0,
                    onClick: () =>
                      openStaffList({
                        id: row.original.id,
                        name: row.original.name ?? "Staff member",
                        email: row.original.email,
                      }),
                    onKeyDown: (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openStaffList({
                          id: row.original.id,
                          name: row.original.name ?? "Staff member",
                          email: row.original.email,
                        });
                      }
                    },
                    sx: (theme) => ({
                      ...baseRowHoverSx(theme),
                      cursor: "pointer",
                    }),
                  })}
                  renderEmptyRowsFallback={() => (
                    <div className="py-4 text-sm text-gray-500">
                      No staff members found.
                    </div>
                  )}
                  {...mrtSurfaceProps}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
