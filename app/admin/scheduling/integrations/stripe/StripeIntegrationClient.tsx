"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionCard from "@/components/scheduling/SectionCard";
import SettingsFormActions from "@/components/scheduling/SettingsFormActions";
import { useUnsavedChangesPrompt } from "@/hooks/use-unsaved-changes";

type Props = {
  orgId?: string;
};

type StripeStatus = {
  secretKeyConfigured: boolean;
  publishableKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
  secretKeySource: "org" | "env" | "none";
  webhookSecretSource: "org" | "env" | "none";
  secretKeyLast4: string | null;
  publishableKeyLast4: string | null;
  webhookSecretLast4: string | null;
  mode: "test" | "live" | "unknown";
  webhookEndpoint: string;
  lastWebhookEvent: {
    id: string;
    type: string;
    createdAt: string;
    livemode: boolean | null;
  } | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function StripeIntegrationClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);

  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [publishableKeyInput, setPublishableKeyInput] = useState("");
  const [webhookSecretInput, setWebhookSecretInput] = useState("");

  const isDirty = useMemo(
    () =>
      Boolean(
        secretKeyInput.trim() ||
          publishableKeyInput.trim() ||
          webhookSecretInput.trim()
      ),
    [secretKeyInput, publishableKeyInput, webhookSecretInput]
  );

  useUnsavedChangesPrompt(isDirty);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setWarning(null);

    const url = orgId
      ? `/api/scheduling/admin/integrations/stripe?orgId=${orgId}`
      : "/api/scheduling/admin/integrations/stripe";

    fetch(url, { cache: "no-store" })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load Stripe status");
          return;
        }
        setStripeStatus(data?.stripe ?? null);
        setWarning(
          typeof data?.warning === "string" && data.warning.trim()
            ? data.warning
            : null
        );
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load Stripe status");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/scheduling/admin/integrations/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(orgId ? { orgId } : {}),
          stripeSecretKey: cleanString(secretKeyInput),
          stripePublishableKey: cleanString(publishableKeyInput),
          stripeWebhookSecret: cleanString(webhookSecretInput),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save Stripe settings");
        return;
      }
      setSecretKeyInput("");
      setPublishableKeyInput("");
      setWebhookSecretInput("");
      setStripeStatus(data?.stripe ?? null);
      setWarning(
        typeof data?.warning === "string" && data.warning.trim()
          ? data.warning
          : null
      );
      toast.success("Stripe settings saved.");
    } catch {
      setError("Failed to save Stripe settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    const ok = window.confirm("Disconnect Stripe for this organization?");
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const payload = orgId ? { orgId, disconnect: true } : { disconnect: true };
      const res = await fetch("/api/scheduling/admin/integrations/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to disconnect Stripe");
        return;
      }
      setStripeStatus(data?.stripe ?? null);
      setWarning(
        typeof data?.warning === "string" && data.warning.trim()
          ? data.warning
          : null
      );
      toast.success("Stripe disconnected.");
    } catch {
      setError("Failed to disconnect Stripe");
    } finally {
      setSaving(false);
    }
  }

  const lastWebhookLabel = useMemo(() => {
    if (!stripeStatus?.lastWebhookEvent) return "No webhook events yet.";
    const { createdAt, type, livemode } = stripeStatus.lastWebhookEvent;
    const ts = new Date(createdAt).toLocaleString();
    const mode = livemode === null ? "" : livemode ? "Live" : "Test";
    return `${type} · ${ts}${mode ? ` · ${mode}` : ""}`;
  }, [stripeStatus?.lastWebhookEvent]);

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage Stripe
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required to update integrations.
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
          Stripe integration
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Store Stripe keys, manage webhook secrets, and monitor delivery.
        </p>
      </div>

      {loading && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          Loading Stripe status...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {warning && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warning}
        </div>
      )}

      <div className="grid gap-6">
        <SectionCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Connection status
              </h3>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {stripeStatus?.secretKeyConfigured ? "Connected" : "Not configured"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Mode:{" "}
              {stripeStatus?.mode === "live"
                ? "Live"
                : stripeStatus?.mode === "test"
                  ? "Test"
                  : "Unknown"}
            </p>
            <div className="text-xs text-gray-500">
              Secret key:{" "}
              {stripeStatus?.secretKeyConfigured
                ? `****${stripeStatus.secretKeyLast4 ?? "****"} (${stripeStatus.secretKeySource})`
                : "Not set"}
            </div>
            <div className="text-xs text-gray-500">
              Publishable key:{" "}
              {stripeStatus?.publishableKeyConfigured
                ? `****${stripeStatus.publishableKeyLast4 ?? "****"}`
                : "Not set"}
            </div>
            <div className="text-xs text-gray-500">
              Webhook secret:{" "}
              {stripeStatus?.webhookSecretConfigured
                ? `****${stripeStatus.webhookSecretLast4 ?? "****"} (${stripeStatus.webhookSecretSource})`
                : "Not set"}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Keys
              </h3>
              <span className="text-xs text-gray-500">
                Leave blank to keep existing values.
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Secret key
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder="sk_live_..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Publishable key
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={publishableKeyInput}
                  onChange={(e) => setPublishableKeyInput(e.target.value)}
                  placeholder="pk_live_..."
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Webhook signing secret
              </label>
              <Input
                className="mt-2"
                type="password"
                value={webhookSecretInput}
                onChange={(e) => setWebhookSecretInput(e.target.value)}
                placeholder="whsec_..."
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Webhooks
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!stripeStatus?.webhookEndpoint) return;
                  void navigator.clipboard.writeText(stripeStatus.webhookEndpoint);
                  toast.success("Webhook endpoint copied.");
                }}
                disabled={!stripeStatus?.webhookEndpoint}
              >
                Copy endpoint
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Webhook endpoint
              </label>
              <Input
                className="mt-2"
                value={stripeStatus?.webhookEndpoint ?? ""}
                readOnly
              />
            </div>
            <div className="text-xs text-gray-500">
              Last event: {lastWebhookLabel}
            </div>
          </div>
        </SectionCard>
      </div>

      <SettingsFormActions
        isDirty={isDirty}
        saving={saving}
        onSave={handleSave}
        secondaryAction={
          <Button
            type="button"
            variant="outline"
            onClick={handleDisconnect}
            disabled={saving || !stripeStatus?.secretKeyConfigured}
          >
            Disconnect
          </Button>
        }
      />
    </div>
  );
}
