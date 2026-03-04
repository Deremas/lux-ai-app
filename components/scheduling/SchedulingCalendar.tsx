"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";

type ApiEvent = {
  id: string;
  type: "appointment" | "blocked" | "buffer";
  title: string;
  startLocal: string;
  endLocal: string;
  staffUserId: string | null;
  status?: string;
  reason?: string | null;
  appointmentId?: string;
  blockedTimeId?: string;
};

export function SchedulingCalendar(props: {
  orgId: string;
  tz?: string;
  staffUserId?: string;
  includeBuffer?: boolean;
}) {
  const tz = props.tz ?? "Europe/Luxembourg";
  const includeBuffer = props.includeBuffer ?? true;
  const [displayTz, setDisplayTz] = useState(tz);
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
    []
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
      `[data-tz-index="${tzHighlight}"]`
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
        filteredTimezones.length === 0 ? 0 : (prev + 1) % filteredTimezones.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setTzHighlight((prev) =>
        filteredTimezones.length === 0
          ? 0
          : (prev - 1 + filteredTimezones.length) % filteredTimezones.length
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

  useEffect(() => {
    setDisplayTz(tz);
  }, [tz]);

  const [range, setRange] = useState<{ from: string; to: string }>(() => {
    // default: today -> +7 days in tz
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);
    to.setDate(to.getDate() + 7);

    // We’ll send ISO without zone; server interprets with tz param
    return {
      from: from.toISOString().slice(0, 19),
      to: to.toISOString().slice(0, 19),
    };
  });

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  async function loadCalendar(fromIso: string, toIso: string) {
    setLoading(true);
    setSelectedInfo(null);
    try {
      const qs = new URLSearchParams({
        orgId: props.orgId,
        from: fromIso,
        to: toIso,
        tz: displayTz,
        includeBuffer: includeBuffer ? "1" : "0",
      });
      if (props.staffUserId) qs.set("staffUserId", props.staffUserId);

      const res = await fetch(`/api/scheduling/calendar?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setEvents((data?.events ?? []) as ApiEvent[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalendar(range.from, range.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    range.from,
    range.to,
    props.orgId,
    props.staffUserId,
    displayTz,
    includeBuffer,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCalendar(range.from, range.to);
    }, 30000);

    const onFocus = () => {
      loadCalendar(range.from, range.to);
    };

    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, displayTz, props.orgId, props.staffUserId]);

  useEffect(() => {
    const streamUrl = new URL("/api/scheduling/stream", window.location.origin);
    streamUrl.searchParams.set("orgId", props.orgId);

    const es = new EventSource(streamUrl.toString());
    es.addEventListener("ping", () => {
      loadCalendar(range.from, range.to);
    });

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, displayTz, props.orgId, props.staffUserId]);

  const fcEvents = useMemo(() => {
    return events.map((e) => {
      const isBuffer = e.type === "buffer";
      const isBlocked = e.type === "blocked";
      const isAppt = e.type === "appointment";

      // FullCalendar expects Date or ISO
      const base: any = {
        id: e.id,
        title: isBuffer ? "" : e.title,
        start: e.startLocal,
        end: e.endLocal,
        extendedProps: e,
      };

      // Make buffer render as background shading
      if (isBuffer) {
        base.display = "background";
      }

      // Make blocked time look “solid”
      if (isBlocked) {
        base.classNames = ["evt-blocked"];
        base.backgroundColor = "rgba(248, 113, 113, 0.55)";
        base.borderColor = "rgba(220, 38, 38, 0.7)";
        base.textColor = "#7f1d1d";
      }
      if (isAppt) {
        base.classNames = ["evt-appointment"];
      }
      if (isBuffer) {
        base.classNames = ["evt-buffer"];
      }

      return base;
    });
  }, [events]);

  function onDatesSet(arg: any) {
    // arg.startStr / arg.endStr are full ISO with Z; keep simple:
    const fromIso = arg.start.toISOString().slice(0, 19);
    const toIso = arg.end.toISOString().slice(0, 19);
    setRange({ from: fromIso, to: toIso });
  }

  function onEventClick(arg: EventClickArg) {
    const e = arg.event.extendedProps as ApiEvent;
    if (!e) return;

    if (e.type === "appointment") {
      setSelectedInfo(
        `Appointment: ${e.title} | ${e.startLocal} → ${e.endLocal}`
      );
    } else if (e.type === "blocked") {
      setSelectedInfo(`Blocked: ${e.title} | ${e.startLocal} → ${e.endLocal}`);
    } else {
      setSelectedInfo(null);
    }
  }

  // Optional: select to “suggest booking start”
  function onSelect(sel: DateSelectArg) {
    const start = sel.start.toISOString().slice(0, 19);
    setSelectedInfo(`Selected start: ${start} (tz param = ${displayTz})`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {loading ? "Loading calendar..." : `Loaded ${events.length} events`}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-gray-600 dark:text-gray-300">Display timezone</label>
          <div className="relative" ref={tzRef}>
            <button
              type="button"
              className="flex h-10 min-w-[260px] items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/80 px-3 text-sm leading-6 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60 dark:bg-slate-900/70"
              onClick={() => setTzOpen((prev) => !prev)}
              onKeyDown={handleTzKeyDown}
              aria-haspopup="listbox"
              aria-expanded={tzOpen}
            >
              <span className="truncate">{displayTz}</span>
              <span aria-hidden>▾</span>
            </button>
            {tzOpen && (
              <div className="absolute z-20 mt-2 w-[280px] rounded-xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
                <input
                  className="h-9 w-full rounded-lg border border-white/70 bg-transparent px-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-slate-700/60"
                  value={tzQuery}
                  onChange={(e) => setTzQuery(e.target.value)}
                  placeholder="Search timezone"
                  autoFocus
                  onKeyDown={handleTzKeyDown}
                />
                <div
                  ref={tzListRef}
                  className="mt-2 max-h-60 overflow-auto rounded-lg border border-gray-100/80 dark:border-slate-700/60"
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
        {selectedInfo ? (
          <div className="text-sm px-3 py-1 rounded-full border border-white/70 bg-white/80 text-gray-700 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-200">
            {selectedInfo}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/90 p-3 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          timeZone={displayTz}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          selectable
          select={onSelect}
          events={fcEvents}
          eventClick={onEventClick}
          datesSet={onDatesSet}
          dayHeaderContent={(arg) => dayHeaderFormatter.format(arg.date)}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          nowIndicator
          height="auto"
        />
      </div>

      <style jsx global>{`
        .evt-buffer {
          opacity: 0.25;
        }
        .fc .evt-blocked {
          font-weight: 600;
          background-color: rgba(248, 113, 113, 0.55);
          border-color: rgba(220, 38, 38, 0.7);
          color: #7f1d1d;
        }
        .evt-appointment {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
