"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isConfirm = !!token;

  const title = useMemo(
    () => (isConfirm ? "Set a new password" : "Reset your password"),
    [isConfirm]
  );

  async function handleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const emailTrim = email.trim();
    if (!EMAIL_REGEX.test(emailTrim)) {
      setError("Enter a valid email address.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/auth/reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailTrim }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const rawError = typeof json?.error === "string" ? json.error : "";
      const message =
        rawError === "Email not found"
          ? "Email not found."
          : rawError === "Email service unavailable"
          ? "Email service is unavailable. Try again later."
          : rawError === "Invalid input"
          ? "Enter a valid email address."
          : rawError === "Email is required"
          ? "Email is required."
          : "Reset request failed.";
      setError(message);
      setSubmitting(false);
      return;
    }

    setMessage(
      json?.resetUrl
        ? `Reset link (dev): ${json.resetUrl}`
        : "Reset link sent. Check your email."
    );
    setSubmitting(false);
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/auth/reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error ?? "Password reset failed.");
      setSubmitting(false);
      return;
    }

    setMessage("Password updated. You can now sign in.");
    setSubmitting(false);
    setTimeout(() => router.push("/auth/signin"), 800);
  }

  return (
    <div className="auth-font relative min-h-screen overflow-hidden bg-[#f7f4f0]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Security
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isConfirm
              ? "Choose a new password to finish resetting your account."
              : "Enter your email and we will send you a reset link."}
          </p>

          {isConfirm ? (
            <form className="mt-6 space-y-4" onSubmit={handleConfirm}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimum 8 characters.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Saving..." : "Update password"}
              </Button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleRequest}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link className="font-semibold text-gray-900 hover:underline" href="/auth/signin">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
