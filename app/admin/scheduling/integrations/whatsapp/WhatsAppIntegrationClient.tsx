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

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default function WhatsAppIntegrationClient({ orgId }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [secretStatus, setSecretStatus] = useState<SecretStatus | null>(null);

  const [metaTokenInput, setMetaTokenInput] = useState("");
  const [metaPhoneIdInput, setMetaPhoneIdInput] = useState("");
  const [twilioSidInput, setTwilioSidInput] = useState("");
  const [twilioAuthInput, setTwilioAuthInput] = useState("");
  const [twilioFromInput, setTwilioFromInput] = useState("");
  const [telnyxApiKeyInput, setTelnyxApiKeyInput] = useState("");
  const [telnyxFromInput, setTelnyxFromInput] = useState("");

  const isDirty = useMemo(
    () =>
      Boolean(
        metaTokenInput.trim() ||
          metaPhoneIdInput.trim() ||
          twilioSidInput.trim() ||
          twilioAuthInput.trim() ||
          twilioFromInput.trim() ||
          telnyxApiKeyInput.trim() ||
          telnyxFromInput.trim()
      ),
    [
      metaTokenInput,
      metaPhoneIdInput,
      twilioSidInput,
      twilioAuthInput,
      twilioFromInput,
      telnyxApiKeyInput,
      telnyxFromInput,
    ]
  );

  useUnsavedChangesPrompt(isDirty);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setWarning(null);

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
        setSecretStatus((data?.secretStatus ?? null) as SecretStatus | null);
        setWarning(
          typeof data?.warning === "string" && data.warning.trim()
            ? data.warning
            : null
        );
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

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/scheduling/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(orgId ? { orgId } : {}),
          metaWhatsappToken: cleanString(metaTokenInput),
          metaWhatsappPhoneId: cleanString(metaPhoneIdInput),
          twilioAccountSid: cleanString(twilioSidInput),
          twilioAuthToken: cleanString(twilioAuthInput),
          twilioWhatsappFrom: cleanString(twilioFromInput),
          telnyxApiKey: cleanString(telnyxApiKeyInput),
          telnyxWhatsappFrom: cleanString(telnyxFromInput),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save settings");
        return;
      }
      if (data?.secretStatus) {
        setSecretStatus(data.secretStatus as SecretStatus);
      }
      setWarning(
        typeof data?.warning === "string" && data.warning.trim()
          ? data.warning
          : null
      );
      setMetaTokenInput("");
      setMetaPhoneIdInput("");
      setTwilioSidInput("");
      setTwilioAuthInput("");
      setTwilioFromInput("");
      setTelnyxApiKeyInput("");
      setTelnyxFromInput("");
      toast.success("WhatsApp integration saved.");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage WhatsApp integration
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
          WhatsApp integration
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Manage Meta, Twilio, and Telnyx credentials. Leave blank to keep current
          values.
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
                Meta WhatsApp
              </h3>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {secretStatus?.metaConfigured ? "Configured" : "Not set"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Access token
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={metaTokenInput}
                  onChange={(e) => setMetaTokenInput(e.target.value)}
                  placeholder="Paste token"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Phone number ID
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={metaPhoneIdInput}
                  onChange={(e) => setMetaPhoneIdInput(e.target.value)}
                  placeholder="Meta phone ID"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Twilio WhatsApp
              </h3>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {secretStatus?.twilioConfigured ? "Configured" : "Not set"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Account SID
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={twilioSidInput}
                  onChange={(e) => setTwilioSidInput(e.target.value)}
                  placeholder="ACxxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Auth token
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={twilioAuthInput}
                  onChange={(e) => setTwilioAuthInput(e.target.value)}
                  placeholder="Twilio auth token"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  WhatsApp from
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={twilioFromInput}
                  onChange={(e) => setTwilioFromInput(e.target.value)}
                  placeholder="+14155238886"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Telnyx WhatsApp
              </h3>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {secretStatus?.telnyxConfigured ? "Configured" : "Not set"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  API key
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={telnyxApiKeyInput}
                  onChange={(e) => setTelnyxApiKeyInput(e.target.value)}
                  placeholder="Telnyx API key"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  WhatsApp from
                </label>
                <Input
                  className="mt-2"
                  type="password"
                  value={telnyxFromInput}
                  onChange={(e) => setTelnyxFromInput(e.target.value)}
                  placeholder="+14155238886"
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SettingsFormActions
        isDirty={isDirty}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}
