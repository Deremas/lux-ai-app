"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import SectionCard from "@/components/scheduling/SectionCard";

type Props = {
  orgId?: string;
};

type SecretStatus = {
  metaTokenConfigured: boolean;
  metaPhoneConfigured: boolean;
  metaConfigured: boolean;
  twilioSidConfigured: boolean;
  twilioTokenConfigured: boolean;
  twilioFromConfigured: boolean;
  twilioConfigured: boolean;
  telnyxApiKeyConfigured: boolean;
  telnyxFromConfigured: boolean;
  telnyxConfigured: boolean;
};

export default function IntegrationsClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [secretStatus, setSecretStatus] = useState<SecretStatus | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = orgId
      ? `/api/scheduling/admin/settings?orgId=${orgId}`
      : "/api/scheduling/admin/settings";

    fetch(url, { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load integrations");
          return;
        }
        setStripeConfigured(Boolean(data?.stripeConfigured));
        setSecretStatus((data?.secretStatus ?? null) as SecretStatus | null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load integrations");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  const whatsappConfigured = useMemo(() => {
    if (!secretStatus) return false;
    return (
      secretStatus.metaConfigured ||
      secretStatus.twilioConfigured ||
      secretStatus.telnyxConfigured
    );
  }, [secretStatus]);

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage integrations
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required to update org connections.
          </p>
          <Button className="mt-6" onClick={() => signIn()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Scheduling Admin
        </p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Integrations
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure external services used by scheduling.
        </p>
      </div>

      {loading && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          Loading integrations...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard>
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Stripe
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Payment processing configuration and webhooks.
              </p>
              <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Status: {stripeConfigured ? "Connected" : "Not configured"}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/scheduling/integrations/stripe">Configure</Link>
            </Button>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                WhatsApp
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Meta, Twilio, and Telnyx credentials for WhatsApp messaging.
              </p>
              <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Status: {whatsappConfigured ? "Configured" : "Not configured"}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/scheduling/integrations/whatsapp">Configure</Link>
            </Button>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Calendar
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Sync appointments with Google or Outlook calendars.
              </p>
              <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Status: Coming soon
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                Email provider
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Connect SMTP or transactional email providers.
              </p>
              <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Status: Coming soon
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
