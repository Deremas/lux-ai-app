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

import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import type { AppLanguage } from "@/lib/i18n";

const calendarLocaleByLanguage: Record<AppLanguage, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  lb: "lb-LU",
};

const localizedCalendarCopy = {
  en: { availability: "Availability", title: "Booking calendar", description: "Pick an available slot. Busy time and lead-time protection stay visible.", openSlots: "open slots", booked: "booked", blocked: "blocked", loading: "Loading...", signIn: "Sign in", signInNotice: "Sign in to book an appointment.", loadCalendar: "Failed to load calendar availability.", loadSlots: "Failed to load available time slots.", unknown: "Unknown error", yourBooking: "Your booking", available: "Available" },
  fr: { availability: "Disponibilite", title: "Calendrier de reservation", description: "Choisissez un creneau disponible. Les periodes occupees et la protection du delai restent visibles.", openSlots: "creneaux ouverts", booked: "reserves", blocked: "bloques", loading: "Chargement...", signIn: "Se connecter", signInNotice: "Connectez-vous pour reserver un rendez-vous.", loadCalendar: "Impossible de charger la disponibilite du calendrier.", loadSlots: "Impossible de charger les creneaux disponibles.", unknown: "Erreur inconnue", yourBooking: "Votre reservation", available: "Disponible" },
  de: { availability: "Verfugbarkeit", title: "Buchungskalender", description: "Wahlen Sie ein verfugbares Zeitfenster. Belegte Zeiten und Lead-Time-Schutz bleiben sichtbar.", openSlots: "offene Zeitfenster", booked: "gebucht", blocked: "blockiert", loading: "Ladt...", signIn: "Anmelden", signInNotice: "Melden Sie sich an, um einen Termin zu buchen.", loadCalendar: "Die Kalenderverfugbarkeit konnte nicht geladen werden.", loadSlots: "Die verfugbaren Zeitfenster konnten nicht geladen werden.", unknown: "Unbekannter Fehler", yourBooking: "Ihre Buchung", available: "Verfugbar" },
  lb: { availability: "Disponibiliteit", title: "Buchungskalenner", description: "Wielt e verfugbare Slot. Besat Zaiten a Lead-Time-Schutz bleiwen sichtbar.", openSlots: "frai Slots", booked: "gebucht", blocked: "blockeiert", loading: "Lued...", signIn: "Umellen", signInNotice: "Mellt Iech un, fir en Termin ze buchen.", loadCalendar: "D'Kalenderdisponibiliteit konnt net geluede ginn.", loadSlots: "D'verfugbar Zaitslots konnten net geluede ginn.", unknown: "Onbekannte Feeler", yourBooking: "Ar Buchung", available: "Verfugbar" },
} as const;

type Props = {
  orgId: string;
  meetingTypeId: string;
  staffUserId?: string;
  tz?: string;
  displayTz?: string;
  canBook?: boolean;
  onSelectSlot?: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot | null;
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
  selectedSlot,
  minLeadMinutes = 180,
  initialDate,
}: Props) {
  const { lang } = useLanguage();
  const copy = localizedCalendarCopy[lang] ?? localizedCalendarCopy.en;
  const locale = calendarLocaleByLanguage[lang] ?? calendarLocaleByLanguage.en;
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
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [locale]
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
          setAvailabilityError(message || copy.loadCalendar);
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
          setAvailabilityError(message || copy.loadSlots);
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
        const message = err instanceof Error ? err.message : copy.unknown;
        setAvailabilityError(message);
      } finally {
        setLoading(false);
        if (inflightRef.current === controller) {
          inflightRef.current = null;
          inflightKeyRef.current = "";
        }
      }
    },
    [
      orgId,
      meetingTypeId,
      staffUserId,
      displayTz,
      tz,
      minBookableDate,
      copy.loadCalendar,
      copy.loadSlots,
      copy.unknown,
    ]
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
    const selectedKey = selectedSlot
      ? `${selectedSlot.startUtc}-${selectedSlot.endUtc}-${selectedSlot.staffUserId ?? "org"}`
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
            ? copy.yourBooking
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
    const slotEvents: EventInput[] = slots.map((s, index) => {
      const slotKey = `${s.startUtc}-${s.endUtc}-${s.staffUserId ?? "org"}`;
      const isSelected = selectedKey && slotKey === selectedKey;
      return {
        id: `slot:${s.startUtc}-${s.endUtc}-${s.staffUserId ?? "org"}-${index}`,
        title: copy.available,
        start: DateTime.fromISO(s.startUtc).setZone(displayTz).toISO()!,
        end: DateTime.fromISO(s.endUtc).setZone(displayTz).toISO()!,
        classNames: [
          "fc-slot-chip",
          ...(isSelected ? ["fc-slot-selected"] : []),
        ],
        extendedProps: { kind: "slot", slot: s },
      };
    });

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
  }, [
    busyEvents,
    slots,
    displayTz,
    range,
    minBookableDate,
    session?.user?.email,
    selectedSlot,
    copy.available,
    copy.yourBooking,
  ]);

  const appointmentCount = useMemo(
    () => busyEvents.filter((event) => event.type === "appointment").length,
    [busyEvents]
  );

  const blockedCount = useMemo(
    () =>
      busyEvents.filter(
        (event) => event.type === "blocked" || event.type === "google_busy"
      ).length,
    [busyEvents]
  );

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
      <div className="lux-calendar-frame rounded-[30px] border border-white/70 bg-white/85 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 border-b border-white/70 bg-white/72 px-5 py-5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">
                {copy.availability}
              </p>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                {copy.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {copy.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="lux-calendar-chip lux-calendar-chip--available">
                {slots.length} {copy.openSlots}
              </span>
              <span className="lux-calendar-chip lux-calendar-chip--busy">
                {appointmentCount} {copy.booked}
              </span>
              <span className="lux-calendar-chip lux-calendar-chip--blocked">
                {blockedCount} {copy.blocked}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="lux-calendar-chip">
              TZ: <span className="font-semibold">{displayTz}</span>
            </span>
            {loading && (
              <span className="lux-calendar-chip lux-calendar-chip--neutral">
                {copy.loading}
              </span>
            )}
          </div>
        </div>

        <div className="p-3 dark:border-slate-700/60">
          {availabilityError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {availabilityError}
            </div>
          )}
          {status === "unauthenticated" && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center justify-between gap-3">
                <span>{copy.signInNotice}</span>
                <Button asChild size="sm">
                  <Link href="/auth/signin">{copy.signIn}</Link>
                </Button>
              </div>
            </div>
          )}
          <div className="lux-fullcalendar rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,248,255,0.92))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-slate-700/60 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,23,42,0.82))]">
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
              contentHeight={640}
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
    </div>
  );
}
