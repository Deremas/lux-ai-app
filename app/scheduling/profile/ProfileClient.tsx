"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type Profile = {
  name: string | null;
  phone: string | null;
  timezone: string | null;
  email: string | null;
};

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export default function ProfileClient() {
  const { data: session, status } = useSession();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    timezone: "",
  });

  const displayName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "Guest";

  const timezones = useMemo(() => {
    const fallback = [
      "UTC",
      "Africa/Addis_Ababa",
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

  const seedFromSession = useCallback(() => {
    setProfileForm((prev) => ({
      name: prev.name || session?.user?.name || "",
      phone: prev.phone || "",
      timezone: prev.timezone || detectTimezone(),
    }));
  }, [session?.user?.name]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    setSaveOk(false);

    fetch("/api/me/profile", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setProfileError(data?.error ?? "Failed to load profile");
          seedFromSession();
          return;
        }
        const next = (data?.profile ?? null) as Profile | null;
        setProfileForm({
          name: next?.name || session?.user?.name || "",
          phone: next?.phone ?? "",
          timezone: next?.timezone || detectTimezone(),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setProfileError(
            "Temporarily unavailable — the database connection failed. Please try again in a moment."
          );
          seedFromSession();
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, reloadKey, seedFromSession, session?.user?.name]);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setSaveOk(false);
    try {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(json?.error ?? "Failed to save profile");
        return;
      }
      setSaveOk(true);
    } catch {
      setProfileError(
        "Temporarily unavailable — the database connection failed. Please try again in a moment."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage your profile
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Update your name, phone, and timezone for smoother bookings.
          </p>
          <Button
            className="mt-6"
            onClick={() =>
              signIn(undefined, { callbackUrl: "/scheduling/profile" })
            }
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-accent-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          Manage your details
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Keep your contact information up to date for the best scheduling
          experience.
        </p>
        {displayName && (
          <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Signed in as {displayName}
          </p>
        )}
      </div>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile details
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Update your name, phone, and timezone.
        </p>
        {profileLoading && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Loading profile...
          </p>
        )}
        {profileError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 lux-alert-danger">
            <p>{profileError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((key) => key + 1)}
              disabled={profileLoading}
            >
              Retry
            </Button>
          </div>
        )}
        {saveOk && !profileError && (
          <div className="mt-4 rounded-lg border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Profile saved.
          </div>
        )}
        {!profileLoading && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Full name
              </label>
              <input
                className="lux-field mt-1 h-10 w-full rounded-lg border px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Phone
              </label>
              <input
                className="lux-field mt-1 h-10 w-full rounded-lg border px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+352…"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Timezone
              </label>
              <select
                className="lux-field mt-1 h-10 w-full rounded-lg border px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={profileForm.timezone}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
              >
                <option value="">Select timezone</option>
                {timezones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button
                type="button"
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
