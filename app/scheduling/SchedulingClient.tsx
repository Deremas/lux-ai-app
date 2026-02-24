"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { DateTime } from "luxon";
import { toast } from "sonner";

import AvailabilityCalendar from "@/components/scheduling/AvailabilityCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SearchablePhoneInput from "@/components/PhoneInputField";

type Props = {
  orgId: string; // required for booking flows
  meetingTypeId?: string;
  staffUserId?: string;
  tz?: string;
};

type BookingProfile = {
  id: string;
  orgId: string | null;
  userId: string;
  fullName: string;
  phone: string;
  company: string | null;
  companyRole: string | null;
  timezone: string;
  notes: string;
};

type FormState = {
  fullName: string;
  phone: string;
  company: string;
  companyRole: string;
  timezone: string;
  notes: string;
};

type MeetingMode = "google_meet" | "zoom" | "phone" | "in_person";
type ModeDetails = {
  label?: string | null;
  description?: string | null;
  link?: string | null;
};
type MeetingModeOption = {
  mode: MeetingMode;
  details?: ModeDetails | null;
};
type MeetingType = {
  id: string;
  key: string;
  title: string;
  subtitle?: string | null;
  description: string | null;
  durationMin: number;
  paymentPolicy?: PaymentPolicy | null;
  priceCents: number | null;
  currency: string | null;
  modes: MeetingModeOption[];
};
type BookedSlot = {
  startUtc: string;
  endUtc: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
  staffUserId?: string | null;
};
type BookingSummary = {
  slot: BookedSlot;
  meetingTypeId: string;
  displayTz: string;
  mode: MeetingMode;
  status: string;
  meetingLink?: string | null;
  payment?: {
    status: string;
    priceCents: number | null;
    currency: string | null;
    policy: string;
  } | null;
};

type PaymentPolicy = "FREE" | "PAY_BEFORE_CONFIRM" | "APPROVE_THEN_PAY";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

function isPhoneValid(value: string): boolean {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) return false;
  const digits = parsed.nationalNumber ?? "";
  const len = digits.length;
  if (len < 8 || len > 15) return false;
  return parsed.isValid() && parsed.isPossible();
}

function resolveBrowserTz() {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function formatPrice(
  priceCents: number | null,
  currency: string | null
): string | null {
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

function normalizeMeetingTitle(title: string, fallbackDuration: number): string {
  const clean = title.replace(/\s*\(\s*\d+\s*min\s*\)\s*$/i, "").trim();
  if (clean) return clean;
  return `${title.trim()} (${fallbackDuration} min)`.trim();
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

function formatMeetingMode(mode: MeetingMode | "") {
  if (!mode) return "Select a meeting mode";
  switch (mode) {
    case "google_meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "phone":
      return "Phone call";
    case "in_person":
      return "In-person";
    default:
      return mode;
  }
}

function TimezonePicker({
  value,
  onChange,
  options,
  buttonClassName,
  menuClassName,
}: {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((zone) => zone.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const idx = filtered.indexOf(value);
    setHighlight(idx >= 0 ? idx : 0);
  }, [open, filtered, value]);

  useEffect(() => {
    if (!open || filtered.length === 0) return;
    const el = listRef.current?.querySelector(`[data-tz-index="${highlight}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlight, filtered.length]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((prev) =>
        filtered.length === 0 ? 0 : (prev + 1) % filtered.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((prev) =>
        filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const zone = filtered[highlight];
      if (zone) {
        onChange(zone);
        setQuery("");
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={[
          "flex h-9 items-center justify-between gap-3 rounded-md border border-input bg-white px-3 text-sm leading-6 shadow-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          buttonClassName ?? "",
        ].join(" ")}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          className={[
            "absolute z-20 mt-2 rounded-md border border-gray-200 bg-white p-2 shadow-lg",
            menuClassName ?? "w-full",
          ].join(" ")}
        >
          <input
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search timezone"
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <div
            ref={listRef}
            className="mt-2 max-h-60 overflow-auto rounded-md border border-gray-100"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            ) : (
              filtered.map((zone, index) => (
                <button
                  key={zone}
                  type="button"
                  data-tz-index={index}
                  className={[
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-100",
                    zone === value ? "font-semibold" : "",
                    index === highlight ? "bg-gray-100" : "",
                  ].join(" ")}
                  onClick={() => {
                    onChange(zone);
                    setQuery("");
                    setOpen(false);
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
  );
}

export default function SchedulingClient(props: Props) {
  // Ensure props are plain strings (protect against accidental undefined / whitespace)
  const orgId = cleanString(props.orgId);
  const initialMeetingTypeId = cleanString(props.meetingTypeId);
  const staffUserId = cleanString(props.staffUserId);
  const initialTz = cleanString(props.tz) || "Africa/Addis_Ababa";
  const myBookingsHref = "/scheduling/my";

  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);

  const [defaultCurrency, setDefaultCurrency] = useState<string | null>(null);
  const [allowedCurrencies, setAllowedCurrencies] = useState<string[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {}
  );
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [meetingTypesLoading, setMeetingTypesLoading] = useState(false);
  const [meetingTypesError, setMeetingTypesError] = useState<string | null>(
    null
  );
  const [selectedMeetingTypeId, setSelectedMeetingTypeId] = useState(
    initialMeetingTypeId
  );
  const [selectedMode, setSelectedMode] = useState<MeetingMode | "">("");

  const [profile, setProfile] = useState<BookingProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayTz, setDisplayTz] = useState(
    cleanString(props.tz) || resolveBrowserTz()
  );
  const [displayTzLocked, setDisplayTzLocked] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<BookedSlot | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [orgPaymentPolicy, setOrgPaymentPolicy] =
    useState<PaymentPolicy>("FREE");

  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    company: "",
    companyRole: "",
    timezone: initialTz,
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});

  const isProfileIncomplete = Boolean(
    !cleanString(form.fullName) ||
      !isPhoneValid(cleanString(form.phone)) ||
      !cleanString(form.timezone) ||
      !cleanString(form.notes) ||
      (cleanString(form.company) && !cleanString(form.companyRole))
  );
  const canProceedToMode = Boolean(selectedMeetingTypeId);
  const canProceedToProfile = Boolean(selectedMeetingTypeId && selectedMode);
  const canProceedToTime =
    Boolean(selectedMeetingTypeId && selectedMode && profile) &&
    !showForm &&
    confirmed;
  const selectedMeetingType = useMemo(
    () => meetingTypes.find((item) => item.id === selectedMeetingTypeId) ?? null,
    [meetingTypes, selectedMeetingTypeId]
  );
  const selectedModeDetails = useMemo(
    () =>
      selectedMeetingType?.modes.find((mode) => mode.mode === selectedMode) ??
      null,
    [selectedMeetingType, selectedMode]
  );
  const selectedModeLabel =
    selectedModeDetails?.details?.label?.trim() ||
    formatMeetingMode(selectedMode as MeetingMode);
  const effectivePaymentPolicy =
    (selectedMeetingType?.paymentPolicy ?? orgPaymentPolicy) as PaymentPolicy;
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL;
  const paymentPriceLabel = formatPrice(
    selectedMeetingType?.priceCents ?? null,
    selectedMeetingType?.currency ?? null
  );
  const convertedPriceLabel = useMemo(() => {
    if (!selectedMeetingType?.priceCents || !selectedMeetingType?.currency) {
      return null;
    }
    if (!displayCurrency || displayCurrency === selectedMeetingType.currency) {
      return null;
    }
    const rate = exchangeRates[displayCurrency];
    if (!rate || !Number.isFinite(rate)) return null;
    const converted = Math.round(selectedMeetingType.priceCents * rate);
    return formatPrice(converted, displayCurrency);
  }, [
    selectedMeetingType?.priceCents,
    selectedMeetingType?.currency,
    displayCurrency,
    exchangeRates,
  ]);
  const paymentRequiredByPolicy = effectivePaymentPolicy !== "FREE";
  const meetingHasPaymentConfig =
    Boolean(selectedMeetingType?.priceCents) &&
    Boolean(selectedMeetingType?.currency);
  const requiresPaymentNow = paymentRequiredByPolicy;
  const mustPayBeforeConfirm =
    effectivePaymentPolicy === "PAY_BEFORE_CONFIRM" && requiresPaymentNow;
  const missingPaymentConfig =
    requiresPaymentNow && !meetingHasPaymentConfig;
  const stepStatus = useMemo(
    () => ({
      step1: Boolean(selectedMeetingTypeId),
      step2: Boolean(selectedMeetingTypeId && selectedMode),
      step3: Boolean(profile) && !showForm,
      step4: Boolean(selectedSlot) || Boolean(bookingSummary),
      step5: Boolean(bookingSummary),
    }),
    [
      selectedMeetingTypeId,
      selectedMode,
      profile,
      showForm,
      selectedSlot,
      bookingSummary,
    ]
  );
  useEffect(() => {
    setBookingSummary(null);
    setSelectedSlot(null);
    setBookingError(null);
  }, [selectedMeetingTypeId, selectedMode, showForm, confirmed]);

  useEffect(() => {
    if (!selectedMeetingType) {
      setSelectedMode("");
      return;
    }
    if (!selectedMeetingType.modes?.length) {
      setSelectedMode("");
      return;
    }
    const modeKeys = selectedMeetingType.modes.map((mode) => mode.mode);
    if (!selectedMode || !modeKeys.includes(selectedMode)) {
      setSelectedMode(modeKeys[0] ?? "");
    }
  }, [selectedMeetingType, selectedMode]);

  const timezones = useMemo<string[]>(() => {
    const fallback: string[] = [
      "UTC",
      "Africa/Addis_Ababa",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Zurich",
      "Europe/Luxembourg",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Singapore",
      "Asia/Tokyo",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
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

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;
    setMeetingTypesLoading(true);
    setMeetingTypesError(null);

    const locale =
      typeof navigator !== "undefined"
        ? navigator.language.split("-")[0]
        : "en";

    const url = new URL("/api/scheduling/meeting-types", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("locale", locale);

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setMeetingTypesError(data?.error ?? "Failed to load meeting types");
          setMeetingTypes([]);
          return;
        }

        const items = Array.isArray(data?.items)
          ? (data.items as MeetingType[])
          : [];
        const allowed = Array.isArray(data?.allowedCurrencies)
          ? data.allowedCurrencies
          : [];
        const defaultCur = cleanString(data?.defaultCurrency) || null;
        if (data?.paymentPolicy) {
          setOrgPaymentPolicy(data.paymentPolicy as PaymentPolicy);
        }
        setMeetingTypes(items);
        setAllowedCurrencies(allowed);
        setDefaultCurrency(defaultCur);

        if (items.length > 0) {
          if (
            initialMeetingTypeId &&
            items.some((item) => item.id === initialMeetingTypeId)
          ) {
            setSelectedMeetingTypeId(initialMeetingTypeId);
          } else {
            setSelectedMeetingTypeId(items[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMeetingTypesError(
          asErrorMessage(err) || "Failed to load meeting types"
        );
        setMeetingTypes([]);
      })
      .finally(() => {
        if (!cancelled) setMeetingTypesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, initialMeetingTypeId]);

  useEffect(() => {
    if (!selectedMeetingType) return;
    const next =
      displayCurrency ??
      selectedMeetingType.currency ??
      defaultCurrency ??
      allowedCurrencies[0] ??
      null;
    if (next && next !== displayCurrency) {
      setDisplayCurrency(next);
    }
  }, [
    selectedMeetingType,
    displayCurrency,
    defaultCurrency,
    allowedCurrencies,
  ]);

  useEffect(() => {
    if (!orgId || !selectedMeetingType?.currency) return;
    const symbols = allowedCurrencies.filter(
      (code) => code && code !== selectedMeetingType.currency
    );
    if (symbols.length === 0) {
      setExchangeRates({});
      setRatesUpdatedAt(null);
      return;
    }
    const url = new URL("/api/scheduling/exchange-rates", window.location.origin);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("base", selectedMeetingType.currency);
    url.searchParams.set("symbols", symbols.join(","));
    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (!ok) return;
        setExchangeRates((data?.rates ?? {}) as Record<string, number>);
        setRatesUpdatedAt(data?.fetchedAt ?? null);
      })
      .catch(() => {});
  }, [orgId, selectedMeetingType?.currency, allowedCurrencies]);

  useEffect(() => {
    if (!isAuthed) {
      setProfile(null);
      setProfileError(null);
      setShowForm(true);
      setConfirmed(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);

    fetch("/api/scheduling/profile", { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;

        if (!ok) {
          setProfileError(data?.error ?? "Failed to load profile");
          setProfile(null);
          setShowForm(true);
          setConfirmed(false);
          return;
        }

        const nextProfile = (data?.profile ?? null) as BookingProfile | null;
        setProfile(nextProfile);

        if (nextProfile) {
          setForm({
            fullName: nextProfile.fullName,
            phone: nextProfile.phone,
            company: nextProfile.company ?? "",
            companyRole: nextProfile.companyRole ?? "",
            timezone: nextProfile.timezone,
            notes: nextProfile.notes,
          });
          if (!displayTzLocked) {
            setDisplayTz(nextProfile.timezone || resolveBrowserTz());
          }
          setShowForm(false);
          setConfirmed(false);
        } else {
          setShowForm(true);
          setConfirmed(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProfileError(asErrorMessage(err) || "Failed to load profile");
        setProfile(null);
        setShowForm(true);
        setConfirmed(false);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthed, displayTzLocked]);

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setFieldErrors({});

    const fullName = cleanString(form.fullName);
    const phone = cleanString(form.phone);
    const company = cleanString(form.company);
    const companyRole = cleanString(form.companyRole);
    const timezone = cleanString(form.timezone);
    const notes = cleanString(form.notes);

    const errors: Partial<FormState> = {};

    if (!fullName || fullName.length < 2 || fullName.length > 120) {
      errors.fullName = "Full name must be 2–120 characters.";
    }

    if (!phone || !isPhoneValid(phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!timezone) {
      errors.timezone = "Select a timezone.";
    }

    if (company && !companyRole) {
      errors.companyRole = "Role is required when company is provided.";
    }

    if (company && company.length > 120) {
      errors.company = "Company name is too long.";
    }

    if (companyRole && companyRole.length > 120) {
      errors.companyRole = "Role is too long.";
    }

    if (!notes || notes.length < 8 || notes.length > 1000) {
      errors.notes = "Notes must be 8–1000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/scheduling/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // server stores this as "last used org" (nullable)
          orgId,
          fullName,
          phone,
          company: company || undefined,
          companyRole: companyRole || undefined,
          timezone,
          notes,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(json?.error ?? "Failed to save profile.");
        return;
      }

      setProfile(json.profile as BookingProfile);
      setShowForm(false);
      setFieldErrors({});
      if (!displayTzLocked) {
        setDisplayTz(json.profile?.timezone || resolveBrowserTz());
      }
      setConfirmed(false);
    } catch (err: unknown) {
      setProfileError(asErrorMessage(err) || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmBooking() {
    if (!selectedSlot || !selectedMeetingTypeId || !profile || !selectedMode)
      return;
    if (bookingSubmitting) return;
    if (!isAuthed) {
      const message = "Please sign in to book and complete payment.";
      setBookingError(message);
      toast.error(message);
      if (typeof window !== "undefined") {
        signIn(undefined, { callbackUrl: window.location.href });
      }
      return;
    }
    if (missingPaymentConfig) {
      const message =
        "Payment is required by policy, but this meeting type is missing price or currency.";
      setBookingError(message);
      toast.error(message);
      return;
    }
    setBookingSubmitting(true);
    setBookingError(null);

    try {
      if (mustPayBeforeConfirm) {
        const payload = {
          orgId,
          meetingTypeId: selectedMeetingTypeId,
          mode: selectedMode,
          startLocal: selectedSlot.startLocal,
          tz: selectedSlot.timezone || profile.timezone,
          meetingTitle: normalizeMeetingTitle(
            selectedMeetingType?.title ??
              selectedMeetingType?.key ??
              "Lux AI Session",
            selectedMeetingType?.durationMin ?? 60
          ),
          durationMin: selectedMeetingType?.durationMin ?? 60,
          displayTz,
          ...(selectedSlot.staffUserId
            ? { staffUserId: selectedSlot.staffUserId }
            : staffUserId
            ? { staffUserId }
            : {}),
        };
        const res = await fetch("/api/scheduling/payment/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = json?.error ?? "Payment setup failed.";
          setBookingError(message);
          toast.error(message);
          return;
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "pendingBooking",
            JSON.stringify({ ...payload, paymentSessionId: json.sessionId })
          );
        }
        if (json?.url) {
          window.location.href = json.url as string;
          return;
        }
        throw new Error("Missing payment session URL");
      }

      const res = await fetch("/api/scheduling/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId,
          meetingTypeId: selectedMeetingTypeId,
          mode: selectedMode,
          startLocal: selectedSlot.startLocal,
          tz: selectedSlot.timezone || profile.timezone,
          ...(selectedSlot.staffUserId
            ? { staffUserId: selectedSlot.staffUserId }
            : staffUserId
            ? { staffUserId }
            : {}),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = json?.details
          ? `${json?.error ?? "Booking failed."} ${json.details}`
          : json?.error ?? "Booking failed.";
        setBookingError(message);
        toast.error(message);
        return;
      }

      if (json?.timezoneNotice) {
        toast.message(json.timezoneNotice);
      }

        setBookingSummary({
          slot: selectedSlot,
          meetingTypeId: selectedMeetingTypeId,
          displayTz,
          mode: (json?.appointment?.mode as MeetingMode) ?? selectedMode,
          status: String(json?.appointment?.status ?? "pending"),
          meetingLink: json?.meetingLink ?? null,
          payment: json?.payment
            ? {
                status: json.payment.status,
                priceCents: json.payment.priceCents ?? null,
                currency: json.payment.currency ?? null,
                policy: json?.policies?.paymentPolicy ?? effectivePaymentPolicy,
              }
            : null,
        });
      setSelectedSlot(null);
      toast.success("Booking confirmed.");
    } catch {
      setBookingError("Booking failed.");
      toast.error("Booking failed.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Scheduling
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              Book a session with the Lux AI team
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Sync availability, match the right expert, and keep your booking
              smooth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthed ? (
              <>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                  Signed in
                </span>
                <Button type="button" variant="outline" asChild>
                  <Link href={myBookingsHref}>My bookings</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/scheduling" })}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  signIn(undefined, { callbackUrl: "/scheduling" })
                }
              >
                Sign in to continue
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div id="step-1" className="mb-6" />
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            {[
              { id: "1", label: "Step 1 · Type", done: stepStatus.step1 },
              { id: "2", label: "Step 2 · Mode", done: stepStatus.step2 },
              { id: "3", label: "Step 3 · Profile", done: stepStatus.step3 },
              { id: "4", label: "Step 4 · Time", done: stepStatus.step4 },
              { id: "5", label: "Step 5 · Confirm", done: stepStatus.step5 },
            ].map((step) => (
              <span
                key={step.id}
                className={[
                  "rounded-full border px-3 py-1",
                  step.done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-400",
                ].join(" ")}
              >
                {step.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Step 1 · Choose a meeting type
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Pick the session that fits your goals.
              </p>
            </div>
          </div>

          {!isAuthed ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sign in to choose a meeting type and continue.
            </div>
          ) : (
            <>
              {meetingTypesLoading && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Loading meeting types...
                </div>
              )}

              {meetingTypesError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {meetingTypesError}
                </div>
              )}

              {!meetingTypesLoading &&
                !meetingTypesError &&
                meetingTypes.length === 0 && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    No meeting types available yet.
                  </div>
                )}

                {meetingTypes.length > 0 && (
                  <>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {meetingTypes.map((item) => {
                        const selected = item.id === selectedMeetingTypeId;
                        const priceLabel = formatPrice(
                          item.priceCents,
                          item.currency
                        );
                        const title = normalizeMeetingTitle(
                          item.title,
                          item.durationMin
                        );
                        const modeLabels = (item.modes ?? []).map((mode) => {
                          const label = mode.details?.label?.trim();
                          return (label || formatMeetingMode(mode.mode)).toUpperCase();
                        });
                        const isPaid = (item.paymentPolicy ?? "FREE") !== "FREE";

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedMeetingTypeId(item.id)}
                            className={[
                              "w-full rounded-2xl border px-4 py-4 text-left transition",
                              selected
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-900 hover:border-gray-400",
                              "dark:border-slate-700 dark:bg-slate-900",
                              selected ? "dark:border-white" : "dark:text-white",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] opacity-70">
                                  {item.key}
                                </p>
                                <h3 className="mt-2 text-lg font-semibold">
                                  {title}
                                </h3>
                                {item.subtitle && (
                                  <p className="mt-1 text-sm font-medium opacity-80">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              <span
                                className={[
                                  "rounded-full px-3 py-1 text-xs font-semibold",
                                  selected
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-700",
                                ].join(" ")}
                              >
                                {item.durationMin} min
                              </span>
                            </div>
                            {item.description && (
                              <p className="mt-2 text-sm opacity-80">
                                {item.description}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                              {modeLabels.length > 0
                                ? modeLabels.join(" · ")
                                : "mode: tbd"}
                            </div>
                            {isPaid && priceLabel && (
                              <div className="mt-3 text-sm font-semibold">
                                {priceLabel} required
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                  </>
                )}
            </>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div id="step-2" className="mb-6" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Step 2 · Choose a meeting mode
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Pick how you want to connect with our team.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {selectedModeLabel}
            </span>
          </div>

          {!isAuthed ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sign in to choose a meeting mode.
            </div>
          ) : (
            <>
              {!canProceedToMode && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Select a meeting type first to unlock meeting modes.
                </div>
              )}
              {canProceedToMode && selectedMeetingType && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                        Available modes
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Based on “
                        {normalizeMeetingTitle(
                          selectedMeetingType.title,
                          selectedMeetingType.durationMin ?? 60
                        )}
                        ”.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedMeetingType.modes ?? []).length === 0 && (
                      <span className="text-sm text-gray-500">
                        No modes configured for this meeting type.
                      </span>
                    )}
                    {(selectedMeetingType.modes ?? []).map((mode) => {
                      const value = mode.mode;
                      const active = value === selectedMode;
                      const label =
                        mode.details?.label?.trim() || formatMeetingMode(value);
                        const description = mode.details?.description?.trim();
                        const safeDescription = description
                          ? description.replace(/https?:\/\/\S+/g, "").trim()
                          : "";
                        return (
                        <button
                          key={mode.mode}
                          type="button"
                          onClick={() => setSelectedMode(value)}
                          className={[
                            "rounded-full border px-4 py-2 text-sm font-semibold transition",
                            active
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {(selectedMeetingType.modes ?? []).some(
                    (mode) => mode.details?.description?.trim()
                  ) && (
                    <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                      {(selectedMeetingType.modes ?? []).map((mode) => {
                        const label =
                          mode.details?.label?.trim() ||
                          formatMeetingMode(mode.mode);
                          const description = mode.details?.description?.trim();
                          const safeDescription = description
                            ? description.replace(/https?:\/\/\S+/g, "").trim()
                            : "";
                          if (!safeDescription) return null;
                          return (
                            <div key={`${mode.mode}-details`}>
                              <p className="font-semibold text-gray-700 dark:text-gray-200">
                                {label}
                              </p>
                              {safeDescription && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {safeDescription}
                                </p>
                              )}
                            </div>
                          );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!isAuthed && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  What happens next
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Sign in to confirm your identity. Then we’ll capture a short
                  booking profile (name, phone, timezone, and meeting notes)
                  before showing live availability.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    "Full name, phone, company, role (if applicable)",
                    "Preferred timezone for meeting times",
                    "Meeting concept notes to prepare the right expert",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ready to book?
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Sign in to unlock live scheduling and confirm a slot.
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={() =>
                    signIn(undefined, { callbackUrl: "/scheduling" })
                  }
                >
                  Sign in
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                Steps after sign in
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {[
                  "Step 2 · Meeting mode",
                  "Step 3 · Booking profile",
                  "Step 4 · Choose a time",
                  "Step 5 · Confirmation",
                ].map((label) => (
                  <div
                    key={label}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-gray-200"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isAuthed && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Step 3 · Booking profile
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We save this once and reuse it for future bookings.
                  </p>
                </div>
                {profile && !showForm && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(true)}
                  >
                    Edit details
                  </Button>
                )}
              </div>

              {!canProceedToProfile && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Select a meeting type and meeting mode to unlock the booking profile.
                </div>
              )}

              {canProceedToProfile && profileLoading && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Loading your profile...
                </div>
              )}

              {canProceedToProfile && profileError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {profileError}
                </div>
              )}

              {canProceedToProfile && showForm && (
                <form
                  className="mt-6 grid w-full gap-4 sm:grid-cols-2"
                  onSubmit={handleSaveProfile}
                >
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Full name *
                    </label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          fullName: value,
                        }));
                        setFieldErrors((prev) =>
                          prev.fullName ? { ...prev, fullName: undefined } : prev
                        );
                      }}
                      required
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Phone *
                    </label>
                    <SearchablePhoneInput
                      value={form.phone}
                      onChange={(phone) => {
                        setForm((prev) => ({ ...prev, phone }));
                        setFieldErrors((prev) =>
                          prev.phone ? { ...prev, phone: undefined } : prev
                        );
                      }}
                      defaultCountry="lu"
                      placeholder="Enter phone number"
                      required
                      invalid={!form.phone || !isPhoneValid(form.phone)}
                      inputContainerClassName="shadow-none focus-within:ring-0"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use a WhatsApp-enabled number for booking updates.
                    </p>
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Timezone *
                    </label>
                    <div className="mt-1">
                      <TimezonePicker
                        value={form.timezone}
                        onChange={(next) => {
                          setForm((prev) => ({
                            ...prev,
                            timezone: next,
                          }));
                          setFieldErrors((prev) =>
                            prev.timezone ? { ...prev, timezone: undefined } : prev
                          );
                        }}
                        options={timezones}
                        buttonClassName="w-full"
                      />
                    </div>
                    {fieldErrors.timezone && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.timezone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Company (optional)
                    </label>
                    <Input
                      value={form.company}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          company: value,
                        }));
                        setFieldErrors((prev) =>
                          prev.company ? { ...prev, company: undefined } : prev
                        );
                      }}
                    />
                    {fieldErrors.company && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.company}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Role in company
                    </label>
                    <Input
                      value={form.companyRole}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          companyRole: value,
                        }));
                        setFieldErrors((prev) =>
                          prev.companyRole
                            ? { ...prev, companyRole: undefined }
                            : prev
                        );
                      }}
                      placeholder="Required if company is provided"
                    />
                    {fieldErrors.companyRole && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.companyRole}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Meeting concept notes *
                    </label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, notes: value }));
                        setFieldErrors((prev) =>
                          prev.notes ? { ...prev, notes: undefined } : prev
                        );
                      }}
                      className="min-h-[140px]"
                      style={{
                        columnCount:
                          form.notes.length > 600
                            ? 3
                            : form.notes.length > 300
                            ? 2
                            : 1,
                        columnGap: "1.5rem",
                      }}
                      required
                    />
                    {fieldErrors.notes && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.notes}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2 grid items-center gap-3 sm:grid-cols-[1fr_auto]">
                    {isProfileIncomplete ? (
                      <p className="text-sm text-gray-500">
                        Fill in the required fields to save your profile.
                      </p>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="submit"
                        disabled={saving || isProfileIncomplete}
                        className="h-11 min-w-[160px] rounded-full bg-primary-500 px-6 font-semibold text-white shadow-md shadow-primary-200/60 transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none dark:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
                      >
                        {saving ? "Saving..." : "Save profile"}
                      </Button>
                      {profile && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForm(false)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {canProceedToProfile && !showForm && profile && (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-200 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                        Contact
                      </p>
                      <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                        {profile.fullName}
                      </p>
                      <p>{profile.phone}</p>
                      {profile.company && (
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                          {profile.company}
                          {profile.companyRole
                            ? ` · ${profile.companyRole}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                        Timezone
                      </p>
                      <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                        {profile.timezone}
                      </p>
                      <p className="mt-1 text-gray-600 dark:text-gray-300">
                        {profile.notes}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      I confirm these details are correct for this booking.
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Step 4 · Choose a time
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Display timezone controls how the calendar is shown.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-gray-600 dark:text-gray-300">
                    Display timezone
                  </label>
                  <TimezonePicker
                    value={displayTz}
                    onChange={(next) => {
                      setDisplayTz(next);
                      setDisplayTzLocked(true);
                    }}
                    options={timezones}
                    buttonClassName="min-w-[220px]"
                    menuClassName="w-[280px]"
                  />
                </div>
              </div>

              {allowedCurrencies.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-gray-200">
                  <span className="font-medium">Display currency</span>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={displayCurrency ?? ""}
                    onChange={(e) => setDisplayCurrency(e.target.value)}
                  >
                    {allowedCurrencies.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  {ratesUpdatedAt && (
                    <span className="text-xs text-gray-500">
                      Rates updated: {DateTime.fromISO(ratesUpdatedAt).toFormat("LLL dd · HH:mm")}
                    </span>
                  )}
                </div>
              )}

              {!selectedMeetingTypeId && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Select a meeting type to unlock available times.
                </div>
              )}
              {selectedMeetingTypeId && !selectedMode && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Select a meeting mode to unlock available times.
                </div>
              )}
              {selectedMeetingTypeId && selectedMode && (!profile || showForm) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Complete your booking profile to unlock available times.
                </div>
              )}
              {selectedMeetingTypeId &&
                selectedMode &&
                profile &&
                !showForm &&
                !confirmed && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Confirm your booking profile to unlock available times.
                </div>
              )}

              {canProceedToTime && (
                <AvailabilityCalendar
                  orgId={orgId}
                  meetingTypeId={selectedMeetingTypeId}
                  staffUserId={staffUserId || undefined}
                  tz={profile?.timezone}
                  displayTz={displayTz}
                  canBook={confirmed}
                  onSelectSlot={(slot) =>
                    setSelectedSlot({
                      startUtc: slot.startUtc,
                      endUtc: slot.endUtc,
                      startLocal: slot.startLocal,
                      endLocal: slot.endLocal,
                      timezone: slot.timezone,
                      staffUserId: slot.staffUserId ?? null,
                    })
                  }
                />
              )}
            </div>

            {(selectedSlot || bookingSummary) && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Step 5 · Confirmation
                    </h3>
                    <p className="text-sm text-emerald-800">
                      Review details before confirming your booking.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedSlot(null);
                      setBookingSummary(null);
                      document.getElementById("step-1")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                  >
                    Change meeting type
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                      Meeting
                    </p>
                    <p className="mt-2 font-semibold text-emerald-900">
                      {normalizeMeetingTitle(
                        selectedMeetingType?.title ?? "Session",
                        selectedMeetingType?.durationMin ?? 60
                      )}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {selectedMeetingType?.durationMin ?? 60} min
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {selectedModeLabel}
                    </p>
                    {selectedMode === "phone" && profile?.phone && (
                      <p className="mt-2 text-xs text-emerald-700">
                        Phone call to: {profile.phone}
                      </p>
                    )}
                      {selectedMode !== "phone" &&
                        selectedMode !== "in_person" &&
                        bookingSummary?.meetingLink &&
                        bookingSummary.status === "confirmed" && (
                          <a
                            className="mt-2 inline-block text-xs text-emerald-700 underline"
                            href={bookingSummary.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Join meeting link
                          </a>
                        )}
                      {selectedMode !== "phone" &&
                        selectedMode !== "in_person" &&
                        (bookingSummary?.status ?? "pending") !== "confirmed" && (
                          <p className="mt-2 text-xs text-emerald-700">
                            Meeting link will be emailed after confirmation.
                          </p>
                        )}
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                      Time
                    </p>
                    <p className="mt-2 font-semibold text-emerald-900">
                      {DateTime.fromISO(
                        (bookingSummary?.slot ?? selectedSlot)?.startUtc ?? ""
                      )
                        .setZone(displayTz)
                        .toFormat("ccc, LLL dd · HH:mm")}
                      {" - "}
                      {DateTime.fromISO(
                        (bookingSummary?.slot ?? selectedSlot)?.endUtc ?? ""
                      )
                        .setZone(displayTz)
                        .toFormat("HH:mm")}
                    </p>
                    <p className="text-xs text-emerald-700">{displayTz}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                      Booker
                    </p>
                    <p className="mt-2 font-semibold text-emerald-900">
                      {profile?.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {profile?.phone ?? "—"}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {profile?.company
                        ? `${profile.company} · ${profile.companyRole || ""}`
                        : "Personal booking"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                      Notes
                    </p>
                    <p className="mt-2 text-sm text-emerald-900">
                      {profile?.notes ?? "—"}
                    </p>
                    <p className="mt-2 text-xs text-emerald-700">
                      Preferred timezone: {profile?.timezone ?? "—"}
                    </p>
                  </div>
                </div>

                {paymentRequiredByPolicy && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-4 text-sm text-emerald-900">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
                      Payment
                    </p>
                    {missingPaymentConfig ? (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                        Payment is required by policy, but this meeting type
                        is missing a price or currency. Please contact the admin.
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-sm">
                          {paymentPriceLabel
                            ? `${paymentPriceLabel} required`
                            : "Payment required"}
                        </p>
                        {convertedPriceLabel && (
                          <p className="mt-1 text-xs text-emerald-700">
                            ≈ {convertedPriceLabel} (display only)
                          </p>
                        )}
                        <p className="text-xs text-emerald-700">
                          Policy:{" "}
                          {effectivePaymentPolicy === "PAY_BEFORE_CONFIRM"
                            ? "Pay before confirmation"
                            : effectivePaymentPolicy === "APPROVE_THEN_PAY"
                            ? "Approve then pay"
                            : "Free"}
                        </p>

                        {!bookingSummary && mustPayBeforeConfirm && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-emerald-700">
                              Click “Proceed to payment” to complete your
                              booking in Stripe.
                            </p>
                            {paymentUrl && (
                              <p className="text-xs text-emerald-700">
                                If redirect fails, use the payment link provided
                                by your admin.
                              </p>
                            )}
                          </div>
                        )}
                        {!bookingSummary &&
                          effectivePaymentPolicy === "APPROVE_THEN_PAY" && (
                            <p className="mt-3 text-xs text-emerald-700">
                              You can confirm now. We’ll send payment
                              instructions after approval.
                            </p>
                          )}
                        {bookingSummary?.payment && (
                          <p className="mt-3 text-xs text-emerald-700">
                            Payment status: {bookingSummary.payment.status}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {bookingError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {bookingError}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {bookingSummary ? (
                    <Button type="button" variant="outline" asChild>
                      <Link href={myBookingsHref}>View my bookings</Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={
                        !selectedSlot ||
                        bookingSubmitting ||
                        missingPaymentConfig ||
                        !isAuthed
                      }
                    >
                      {bookingSubmitting
                        ? "Booking..."
                        : !isAuthed
                        ? "Sign in to book"
                        : mustPayBeforeConfirm
                        ? "Proceed to payment"
                        : "Confirm booking"}
                    </Button>
                  )}
                  {bookingSummary && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const title = normalizeMeetingTitle(
                            selectedMeetingType?.title ?? "Lux AI Session",
                            selectedMeetingType?.durationMin ?? 60
                          );
                          const details = `Meeting with Lux AI${
                            profile?.notes ? `\n\nNotes: ${profile.notes}` : ""
                          }`;
                          const ics = buildIcsContent({
                            title,
                            description: details,
                            startUtc: bookingSummary.slot.startUtc,
                            endUtc: bookingSummary.slot.endUtc,
                          });
                          const blob = new Blob([ics], {
                            type: "text/calendar;charset=utf-8",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "luxai-booking.ics";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download ICS
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <Link
                          href={buildGoogleCalendarUrl({
                            title: `${normalizeMeetingTitle(
                              selectedMeetingType?.title ?? "Lux AI Session",
                              selectedMeetingType?.durationMin ?? 60
                            )} · ${selectedModeLabel}`,
                            details: [
                              `Mode: ${selectedModeLabel}`,
                                bookingSummary?.meetingLink &&
                                bookingSummary.status === "confirmed"
                                  ? `Meeting link: ${bookingSummary.meetingLink}`
                                  : selectedMode === "phone"
                                ? `Phone: ${profile?.phone ?? "n/a"}`
                                : "",
                              profile?.notes
                                ? `Notes: ${profile.notes}`
                                : "Meeting with Lux AI",
                            ]
                              .filter(Boolean)
                              .join("\n"),
                            startUtc: bookingSummary.slot.startUtc,
                            endUtc: bookingSummary.slot.endUtc,
                          })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Add to Google Calendar
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBookingSummary(null)}
                  >
                    Book another time
                  </Button>
                  <span className="text-xs text-emerald-800">
                    You will receive a confirmation email if notifications are
                    enabled.
                  </span>
                </div>
              </div>
            )}

            {profile && !showForm && !selectedMeetingTypeId && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Select a meeting type and meeting mode to view availability.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
