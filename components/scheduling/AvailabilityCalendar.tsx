"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { DateTime } from "luxon";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type Props = {
  orgId: string;
  meetingTypeId: string;
  staffUserId?: string;
  tz?: string;
  displayTz?: string;
  canBook?: boolean;
  onSelectSlot?: (slot: AvailabilitySlot) => void;
  minLeadMinutes?: number;
  initialDate?: string;
};

type AvailabilitySlot = {
  startUtc: string;
  endUtc: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
  staffUserId?: string | null;
};

type AvailabilityResponse = {
  results: Array<{
    staffUserId: string;
    timezone: string;
    bufferMin: number;
    durationMin: number;
    slotStepMin: number;
    slots: AvailabilitySlot[];
  }>;
};

type CalendarEvent = {
  id: string;
  type: "appointment" | "blocked" | "google_busy" | "slot" | "buffer";
  staffUserId?: string | null;
  title: string;
  startUtc: string;
  endUtc: string;
  startLocal: string;
  endLocal: string;
  status?: string;
  appointmentId?: string;
  userEmail?: string | null;
};

type CalendarApiResponse = {
  tz: string;
  events: CalendarEvent[];
  includeBuffer?: boolean;
};

function isoNoMs(dt: DateTime) {
  return dt.toISO({ suppressMilliseconds: true })!;
}

export default function AvailabilityCalendar({
  orgId,
  meetingTypeId,
  staffUserId,
  tz: tzProp,
  displayTz: displayTzProp,
  canBook = true,
  onSelectSlot,
  minLeadMinutes = 180,
  initialDate,
}: Props) {
  const tz = tzProp || "Europe/Luxembourg";
  const displayTz = displayTzProp || tz;
  const { data: session, status } = useSession();
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [busyEvents, setBusyEvents] = useState<CalendarEvent[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const lastFetchAtRef = useRef(0);
  const lastFetchKeyRef = useRef("");
  const inflightRef = useRef<AbortController | null>(null);
  const inflightKeyRef = useRef("");
  const dayHeaderFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    []
  );
  const minBookableDate = useMemo(
    () =>
      DateTime.now()
        .setZone(displayTz)
        .plus({ minutes: minLeadMinutes }),
    [displayTz, minLeadMinutes]
  );
  const timeBounds = useMemo(
    () => ({ min: "08:00:00", max: "17:00:00" }),
    []
  );

  const fetchEverything = useCallback(
    async (fromIso: string, toIso: string, force = false) => {
      const key = [
        orgId,
        meetingTypeId,
        staffUserId ?? "org",
        displayTz,
        fromIso,
        toIso,
      ].join("|");
      const now = Date.now();
      if (!force && key === lastFetchKeyRef.current) {
        if (now - lastFetchAtRef.current < 120_000) {
          return;
        }
      }
      if (inflightRef.current && inflightKeyRef.current === key) {
        return;
      }
      if (inflightRef.current && inflightKeyRef.current !== key) {
        inflightRef.current.abort();
      }
      const controller = new AbortController();
      inflightRef.current = controller;
      inflightKeyRef.current = key;
      lastFetchKeyRef.current = key;
      lastFetchAtRef.current = now;
      setLoading(true);
      setAvailabilityError(null);
      try {
        // 1) Busy events (calendar)
        const calendarUrl = new URL(
          "/api/scheduling/calendar",
          window.location.origin
        );
        calendarUrl.searchParams.set("orgId", orgId);
        calendarUrl.searchParams.set("from", fromIso);
        calendarUrl.searchParams.set("to", toIso);
        calendarUrl.searchParams.set("tz", displayTz);
        calendarUrl.searchParams.set("includeBuffer", "1");
        if (staffUserId)
          calendarUrl.searchParams.set("staffUserId", staffUserId);

        const calRes = await fetch(calendarUrl.toString(), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!calRes.ok) {
          const message = await calRes.text().catch(() => "");
          setAvailabilityError(
            message || "Failed to load calendar availability."
          );
          return;
        }
        const calJson = (await calRes.json()) as CalendarApiResponse;

        // 2) Availability slots
        const availUrl = new URL(
          "/api/scheduling/availability",
          window.location.origin
        );
        availUrl.searchParams.set("orgId", orgId);
        availUrl.searchParams.set("meetingTypeId", meetingTypeId);
        availUrl.searchParams.set("from", fromIso);
        availUrl.searchParams.set("to", toIso);
        availUrl.searchParams.set("tz", displayTz);
        if (staffUserId) availUrl.searchParams.set("staffUserId", staffUserId);

        const availRes = await fetch(availUrl.toString(), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!availRes.ok) {
          const message = await availRes.text().catch(() => "");
          setAvailabilityError(
            message || "Failed to load available time slots."
          );
          return;
        }
        const availJson = (await availRes.json()) as AvailabilityResponse;

        setBusyEvents(calJson.events ?? []);
        const nextSlots =
          availJson.results?.flatMap((result) =>
            (result.slots ?? []).map((slot) => ({
              ...slot,
              timezone: result.timezone,
              staffUserId: result.staffUserId ?? null,
            }))
          ) ?? [];
        const filteredSlots = nextSlots.filter((slot) => {
          const startLocal = DateTime.fromISO(slot.startUtc).setZone(displayTz);
          const endLocal = DateTime.fromISO(slot.endUtc).setZone(displayTz);
          if (startLocal < minBookableDate) return false;
          const startMinutes = startLocal.hour * 60 + startLocal.minute;
          const endMinutes = endLocal.hour * 60 + endLocal.minute;
          return startMinutes >= 8 * 60 && endMinutes <= 17 * 60;
        });
        const uniqueSlots = Array.from(
          new Map(
            filteredSlots.map((slot) => [
              `${slot.startUtc}-${slot.endUtc}-${slot.timezone}`,
              slot,
            ])
          ).values()
        );
        setSlots(uniqueSlots);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        setAvailabilityError(message);
      } finally {
        setLoading(false);
        if (inflightRef.current === controller) {
          inflightRef.current = null;
          inflightKeyRef.current = "";
        }
      }
    },
    [orgId, meetingTypeId, staffUserId, displayTz, tz, minBookableDate]
  );

  useEffect(() => {
    if (!range) return;
    fetchEverything(range.from, range.to, true);
    const onFocus = () => {
      if (Date.now() - lastFetchAtRef.current > 120_000) {
        fetchEverything(range.from, range.to, true);
      }
    };

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [range, fetchEverything]);

  const events: EventInput[] = useMemo(() => {
    const nowLocal = DateTime.now().setZone(displayTz);
    const viewerEmail =
      typeof session?.user?.email === "string"
        ? session.user.email.toLowerCase()
        : "";

    // Busy events as background blocks (hide past)
    const busy: EventInput[] = busyEvents
      .filter((e) => {
        const end = e.endLocal
          ? DateTime.fromISO(e.endLocal).setZone(displayTz)
          : DateTime.fromISO(e.endUtc).setZone(displayTz);
        return end.isValid && end > nowLocal;
      })
      .map((e) => ({
        id: e.id,
        title:
          e.type === "appointment" &&
          viewerEmail &&
          typeof e.userEmail === "string" &&
          e.userEmail.toLowerCase() === viewerEmail
            ? "Your booking"
            : "",
        start: e.startLocal,
        end: e.endLocal,
        display: "background",
        classNames: [
          "fc-busy-bg",
          e.type === "appointment" ? "fc-booked-bg" : "fc-blocked-bg",
        ],
        extendedProps: { kind: e.type, raw: e },
      }));

    // Availability slots as normal clickable events
    const slotEvents: EventInput[] = slots.map((s, index) => ({
      id: `slot:${s.startUtc}-${s.endUtc}-${s.staffUserId ?? "org"}-${index}`,
      title: "Available",
      start: DateTime.fromISO(s.startUtc).setZone(displayTz).toISO()!,
      end: DateTime.fromISO(s.endUtc).setZone(displayTz).toISO()!,
      classNames: ["fc-slot-chip"],
      extendedProps: { kind: "slot", slot: s },
    }));

    const leadBlock: EventInput[] = [];
    if (range) {
      const rangeStart = DateTime.fromISO(range.from).setZone(displayTz);
      const blockEnd = minBookableDate.setZone(displayTz);
      if (blockEnd > rangeStart) {
        leadBlock.push({
          id: "lead-time-block",
          title: "",
          start: rangeStart.toISO()!,
          end: blockEnd.toISO()!,
          display: "background",
          classNames: ["fc-busy-bg"],
          extendedProps: { kind: "lead_block" },
        });
      }
    }

    return [...busy, ...leadBlock, ...slotEvents];
  }, [busyEvents, slots, displayTz, range, minBookableDate, session?.user?.email]);

  const onDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const fromIso = isoNoMs(DateTime.fromJSDate(arg.start).setZone(displayTz));
      const toIso = isoNoMs(DateTime.fromJSDate(arg.end).setZone(displayTz));
      setRange((prev) => {
        if (prev && prev.from === fromIso && prev.to === toIso) return prev;
        return { from: fromIso, to: toIso };
      });
    },
    [displayTz]
  );

  const onEventClick = useCallback(
    (arg: EventClickArg) => {
      const kind = (arg.event.extendedProps as any)?.kind;
      if (kind !== "slot") return;

      const slot = (arg.event.extendedProps as any)?.slot as
        | AvailabilitySlot
        | undefined;
      if (!slot) return;

      onSelectSlot?.(slot);
    },
    [onSelectSlot]
  );

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-white/70 bg-white/85 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex items-center justify-between border-b border-white/70 bg-white/70 px-5 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
            <p className="text-sm text-gray-500">
              Pick an{" "}
              <span className="font-medium text-gray-700">Available</span> slot
              to book
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              TZ: <span className="text-gray-700">{displayTz}</span>
            </span>
            {loading && (
              <span className="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-xs text-gray-600 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
                Loading…
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-white/70 p-3 dark:border-slate-700/60">
          {availabilityError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {availabilityError}
            </div>
          )}
          {status === "unauthenticated" && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center justify-between gap-3">
                <span>Sign in to book an appointment.</span>
                <Button asChild size="sm">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
              </div>
            </div>
          )}
          <FullCalendar
            key={[
              initialDate ?? "current",
              displayTz,
              meetingTypeId,
              staffUserId ?? "org",
            ].join("|")}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate={initialDate}
            timeZone={displayTz}
            expandRows
            contentHeight={720}
            nowIndicator
            allDaySlot={false}
            slotMinTime={timeBounds.min}
            slotMaxTime={timeBounds.max}
            slotDuration="01:00:00"
            snapDuration="01:00:00"
            eventClick={onEventClick}
            datesSet={onDatesSet}
            events={events}
            dayHeaderContent={(arg) => dayHeaderFormatter.format(arg.date)}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
