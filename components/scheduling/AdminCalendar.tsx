"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateTime } from "luxon";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventClickArg } from "@fullcalendar/core";

type CalendarEvent = {
  id: string;
  type: "appointment" | "blocked";
  title: string;
  staffUserId?: string | null;
  appointmentId?: string;
  status?: string;
  startLocal: string;
  endLocal: string;
  meetingTypeKey?: string | null;
  mode?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userCompany?: string | null;
  userCompanyRole?: string | null;
  userNotes?: string | null;
  userTimezone?: string | null;
  meetingLink?: string | null;
  reason?: string | null;
};

function formatIcsUtc(dtIso: string) {
  return DateTime.fromISO(dtIso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function buildGoogleCalendarUrl(args: {
  title: string;
  details: string;
  startIso: string;
  endIso: string;
}) {
  const start = formatIcsUtc(args.startIso);
  const end = formatIcsUtc(args.endIso);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    details: args.details,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function AdminCalendar({
  orgId,
  tz = "Europe/Luxembourg",
  staffUserId,
}: {
  orgId: string;
  tz?: string;
  staffUserId?: string;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [displayTz, setDisplayTz] = useState(tz);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [showBookerDetails, setShowBookerDetails] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [tzQuery, setTzQuery] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [tzHighlight, setTzHighlight] = useState(0);
  const tzRef = useRef<HTMLDivElement | null>(null);
  const tzListRef = useRef<HTMLDivElement | null>(null);
  const timezones = useMemo(() => {
    const fallback = [
      "UTC",
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
  const dayHeaderFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [],
  );
  const filteredTimezones = useMemo(() => {
    const query = tzQuery.trim().toLowerCase();
    if (!query) return timezones;
    return timezones.filter((zone) => zone.toLowerCase().includes(query));
  }, [timezones, tzQuery]);
  useEffect(() => {
    if (!tzOpen) return;
    const idx = filteredTimezones.indexOf(displayTz);
    setTzHighlight(idx >= 0 ? idx : 0);
  }, [tzOpen, filteredTimezones, displayTz]);
  useEffect(() => {
    if (!tzOpen || filteredTimezones.length === 0) return;
    const el = tzListRef.current?.querySelector(
      `[data-tz-index="${tzHighlight}"]`,
    );
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [tzOpen, tzHighlight, filteredTimezones.length]);
  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!tzRef.current) return;
      if (!tzRef.current.contains(event.target as Node)) {
        setTzOpen(false);
      }
    }
    if (tzOpen) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [tzOpen]);
  const handleTzKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!tzOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setTzOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setTzHighlight((prev) =>
        filteredTimezones.length === 0
          ? 0
          : (prev + 1) % filteredTimezones.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setTzHighlight((prev) =>
        filteredTimezones.length === 0
          ? 0
          : (prev - 1 + filteredTimezones.length) % filteredTimezones.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const zone = filteredTimezones[tzHighlight];
      if (zone) {
        setDisplayTz(zone);
        setTzQuery("");
        setTzOpen(false);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setTzOpen(false);
    }
  };

  const fetchRange = async (fromISO: string, toISO: string) => {
    const qs = new URLSearchParams({
      orgId,
      from: fromISO,
      to: toISO,
      tz: displayTz,
      ...(staffUserId ? { staffUserId } : {}),
    });

    const res = await fetch(`/api/scheduling/calendar?${qs.toString()}`);
    const data = await res.json();
    setEvents(data.events ?? []);
  };

  const handleDatesSet = (arg: { startStr: string; endStr: string }) => {
    const nextRange = { from: arg.startStr, to: arg.endStr };
    setRange(nextRange);
    fetchRange(nextRange.from, nextRange.to);
  };

  useEffect(() => {
    if (range) fetchRange(range.from, range.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayTz]);

  useEffect(() => {
    setShowBookerDetails(false);
  }, [selectedEvent?.id]);

  useEffect(() => {
    setAssigning(false);
    setAssignError(null);
    setAssignSuccess(null);
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!range) return;
    const interval = setInterval(() => fetchRange(range.from, range.to), 30000);

    const onFocus = () => fetchRange(range.from, range.to);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.from, range?.to, displayTz, orgId, staffUserId]);

  useEffect(() => {
    if (!range) return;
    const streamUrl = new URL("/api/scheduling/stream", window.location.origin);
    streamUrl.searchParams.set("orgId", orgId);

    const es = new EventSource(streamUrl.toString());
    es.addEventListener("ping", () => fetchRange(range.from, range.to));

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.from, range?.to, displayTz, orgId, staffUserId]);

  const fcEvents = useMemo(
    () =>
      events.map((e) => {
        const isBlocked = e.type === "blocked";
        return {
          id: e.id,
          title: e.title,
          start: e.startLocal,
          end: e.endLocal,
          display: isBlocked ? "background" : "auto",
          backgroundColor: isBlocked ? "rgba(248, 113, 113, 0.25)" : undefined,
          borderColor: isBlocked ? "rgba(220, 38, 38, 0.35)" : undefined,
          classNames: [e.type],
          extendedProps: { raw: e },
        };
      }),
    [events],
  );

  const appointmentCount = useMemo(
    () => events.filter((event) => event.type === "appointment").length,
    [events]
  );

  const blockedCount = useMemo(
    () => events.filter((event) => event.type === "blocked").length,
    [events]
  );

  const handleAutoAssign = async () => {
    if (!selectedEvent || selectedEvent.type !== "appointment") return;
    setAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      const apptId = selectedEvent.appointmentId ?? selectedEvent.id;
      const res = await fetch(
        `/api/scheduling/admin/appointments/${apptId}/auto-assign?orgId=${orgId}`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssignError(json?.error ?? "Failed to auto-assign staff.");
        return;
      }

      setAssignSuccess(
        json?.staff?.name ? `Assigned to ${json.staff.name}` : "Staff assigned.",
      );
      setSelectedEvent((prev) =>
        prev && prev.type === "appointment"
          ? {
              ...prev,
              staffUserId: json?.appointment?.staffUserId ?? prev.staffUserId,
            }
          : prev,
      );
      if (range) {
        await fetchRange(range.from, range.to);
      }
    } catch (error) {
      console.error("Error during auto-assignment:", error);
      setAssignError("Failed to auto-assign staff.");
    } finally {
      setAssigning(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const raw = clickInfo.event.extendedProps?.raw as
      | CalendarEvent
      | undefined;
    if (!raw) return;
    setSelectedEvent(raw);
  };

  return (
    <div className="lux-calendar-frame space-y-5 rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">
              Operations
            </p>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              Scheduling calendar
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Monitor appointments and blocked windows, then open details directly from the grid.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="lux-calendar-chip lux-calendar-chip--busy">
              {appointmentCount} appointments
            </span>
            <span className="lux-calendar-chip lux-calendar-chip--blocked">
              {blockedCount} blocked
            </span>
            <span className="lux-calendar-chip lux-calendar-chip--neutral">
              Live updates every 30s
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-slate-600 dark:text-slate-300">Display timezone</label>
          <div className="relative" ref={tzRef}>
            <button
              type="button"
              className="flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 text-sm leading-6 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:min-w-[260px] dark:border-slate-700/60 dark:bg-slate-900/75"
              onClick={() => setTzOpen((prev) => !prev)}
              onKeyDown={handleTzKeyDown}
              aria-haspopup="listbox"
              aria-expanded={tzOpen}
            >
              <span className="truncate">{displayTz}</span>
              <span aria-hidden>▾</span>
            </button>
            {tzOpen && (
              <div className="absolute z-20 mt-2 w-[calc(100vw-2rem)] max-w-[280px] rounded-2xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur sm:w-[280px] dark:border-slate-700/60 dark:bg-slate-900/90">
                <input
                  className="h-9 w-full rounded-xl border border-white/70 bg-transparent px-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60"
                  value={tzQuery}
                  onChange={(e) => setTzQuery(e.target.value)}
                  placeholder="Search timezone"
                  autoFocus
                  onKeyDown={handleTzKeyDown}
                />
                <div
                  ref={tzListRef}
                  className="mt-2 max-h-60 overflow-auto rounded-xl border border-gray-100/80 dark:border-slate-700/60"
                >
                  {filteredTimezones.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No matches
                    </div>
                  ) : (
                    filteredTimezones.map((zone, index) => (
                      <button
                        key={zone}
                        type="button"
                        data-tz-index={index}
                        className={[
                          "w-full px-3 py-2 text-left text-sm hover:bg-gray-100/80 dark:hover:bg-slate-800/60",
                          zone === displayTz ? "font-semibold" : "",
                          index === tzHighlight ? "bg-gray-100/80 dark:bg-slate-800/60" : "",
                        ].join(" ")}
                        onClick={() => {
                          setDisplayTz(zone);
                          setTzQuery("");
                          setTzOpen(false);
                        }}
                      >
                        {zone}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lux-fullcalendar rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,248,255,0.92))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-slate-700/60 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,23,42,0.82))]">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          timeZone={displayTz}
          dayHeaderContent={(arg) => dayHeaderFormatter.format(arg.date)}
          nowIndicator
          allDaySlot={false}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          datesSet={handleDatesSet}
          events={fcEvents}
          eventClick={handleEventClick}
        />
      </div>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-lg rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.type === "blocked"
                ? "Blocked time"
                : "Appointment details"}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Time
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {DateTime.fromISO(selectedEvent.startLocal).toFormat(
                    "ccc, LLL dd · HH:mm",
                  )}{" "}
                  – {DateTime.fromISO(selectedEvent.endLocal).toFormat("HH:mm")}
                </p>
                <p className="text-xs text-gray-500">{displayTz}</p>
              </div>

              {selectedEvent.type === "appointment" ? (
                <>
                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Meeting
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedEvent.meetingTypeKey ?? "Appointment"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedEvent.mode ?? "mode: tbd"}
                    </p>
                    {selectedEvent.status && (
                      <p className="mt-1 text-xs text-gray-500">
                        Status: {selectedEvent.status}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Staff
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {selectedEvent.staffUserId ?? "Unassigned"}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      onClick={handleAutoAssign}
                      disabled={assigning || !!selectedEvent.staffUserId}
                    >
                      {assigning ? "Assigning..." : "Auto-assign staff"}
                    </button>
                    {assignError && (
                      <p className="mt-2 text-xs text-red-600">{assignError}</p>
                    )}
                    {assignSuccess && (
                      <p className="mt-2 text-xs text-emerald-700">
                        {assignSuccess}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Booker
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedEvent.userName ?? "Customer"}
                    </p>
                    {selectedEvent.userEmail && (
                      <a
                        className="text-xs text-blue-600 hover:underline"
                        href={`mailto:${selectedEvent.userEmail}`}
                      >
                        {selectedEvent.userEmail}
                      </a>
                    )}
                    {selectedEvent.userPhone && (
                      <p>
                        <a
                          className="text-xs text-blue-600 hover:underline"
                          href={`tel:${selectedEvent.userPhone}`}
                        >
                          {selectedEvent.userPhone}
                        </a>
                      </p>
                    )}
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                      onClick={() => setShowBookerDetails((prev) => !prev)}
                    >
                      {showBookerDetails
                        ? "Hide booker details"
                        : "View booker details"}
                    </button>
                  </div>

                  {showBookerDetails && (
                    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Booker details
                      </p>
                      {selectedEvent.userCompany && (
                        <p className="mt-1 text-sm text-gray-700">
                          {selectedEvent.userCompany}
                          {selectedEvent.userCompanyRole
                            ? ` · ${selectedEvent.userCompanyRole}`
                            : ""}
                        </p>
                      )}
                      {selectedEvent.userTimezone && (
                        <p className="mt-1 text-xs text-gray-500">
                          Timezone: {selectedEvent.userTimezone}
                        </p>
                      )}
                      {selectedEvent.userNotes && (
                        <p className="mt-2 text-sm text-gray-700">
                          {selectedEvent.userNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedEvent.mode === "phone" &&
                    selectedEvent.userPhone && (
                      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800">
                        Phone call · Tap the number to call.
                      </div>
                    )}
                  {selectedEvent.meetingLink && (
                    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Meeting link
                      </p>
                      <a
                        className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                        href={selectedEvent.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedEvent.meetingLink}
                      </a>
                    </div>
                  )}
                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Add to calendar
                    </p>
                    <a
                      className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                      href={buildGoogleCalendarUrl({
                        title: `${selectedEvent.meetingTypeKey ?? "Meeting"} · ${
                          selectedEvent.mode ?? "tbd"
                        }`,
                        details: [
                          `Mode: ${selectedEvent.mode ?? "tbd"}`,
                          selectedEvent.meetingLink
                            ? `Meeting link: ${selectedEvent.meetingLink}`
                            : "",
                          selectedEvent.userPhone
                            ? `Phone: ${selectedEvent.userPhone}`
                            : "",
                          selectedEvent.userNotes
                            ? `Notes: ${selectedEvent.userNotes}`
                            : "Lux AI meeting",
                        ]
                          .filter(Boolean)
                          .join("\n"),
                        startIso: selectedEvent.startLocal,
                        endIso: selectedEvent.endLocal,
                      })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Google Calendar
                    </a>
                  </div>
                  {selectedEvent.mode === "google_meet" && (
                    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs text-gray-600 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
                      Google Meet · Link available above.
                    </div>
                  )}
                  {selectedEvent.mode === "zoom" && (
                    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs text-gray-600 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
                      Zoom · Link available above.
                    </div>
                  )}
                  {selectedEvent.mode === "in_person" && (
                    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs text-gray-600 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300">
                      In-person meeting.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Reason
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {selectedEvent.reason ?? selectedEvent.title}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .fc .blocked {
          background-color: rgba(248, 113, 113, 0.25);
          border-color: rgba(220, 38, 38, 0.35);
        }
        .fc .appointment {
          opacity: 1;
          cursor: pointer;
        }
        .fc .appointment .fc-event-main,
        .fc .appointment .fc-event-title-container {
          cursor: pointer;
        }
        .fc .fc-timegrid-event .fc-event-main {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .fc .fc-timegrid-event .fc-event-title-container {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .fc .fc-timegrid-event .fc-event-time {
          margin-top: 2px;
        }
        .fc .fc-timegrid-event .fc-event-title {
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
