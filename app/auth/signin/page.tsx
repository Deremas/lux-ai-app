"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallbackUrl = searchParams.get("callbackUrl") || "/scheduling";
  const callbackUrl = `/auth/post-sign-in?callbackUrl=${encodeURIComponent(
    requestedCallbackUrl
  )}`;
  const authError = searchParams.get("error");

  const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage("");
    const emailTrim = email.trim();
    if (!EMAIL_REGEX.test(emailTrim)) {
      setErrorMessage("Enter a valid email address.");
      setSubmitting(false);
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email: emailTrim,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        const message =
          res?.error === "CredentialsSignin"
            ? "Invalid email or password."
            : "Unable to sign in right now. Try again.";
        setErrorMessage(message);
        setSubmitting(false);
        return;
      }

      router.push(res.url ?? callbackUrl);
    } catch {
      setErrorMessage("Unable to sign in right now. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-font relative min-h-screen overflow-hidden bg-[#f6f3ee]">
      <div className="auth-blob auth-blob--one" />
      <div className="auth-blob auth-blob--two" />
      <div className="auth-blob auth-blob--three" />

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 auth-fade-up">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 shadow-sm backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Lux AI Scheduling
          </Link>

          <h1 className="mt-6 text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
            Sign in to book smarter, faster meetings.
          </h1>
          <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
            Secure access to curated availability, instant confirmations, and
            team-wide coordination built for client experiences that feel
            effortless.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Live availability synced with staff calendars",
              "Instant approvals with booking context",
              "Timezone-smart scheduling for global clients",
              "Private notes and audit trail included",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-gray-700 shadow-sm backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 auth-fade-up-delay">
          <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Welcome back
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-600">
                Use your work email and password to continue.
              </p>
            </div>
            {authError === "AdminAccessRequired" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Admin or staff access is required to proceed.
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-slate-900 via-gray-900 to-slate-700 text-white hover:from-slate-800 hover:via-gray-800 hover:to-slate-600"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {errorMessage}
                </div>
              )}
              <div className="text-right text-sm">
                <Link className="font-semibold text-gray-800 hover:underline" href="/auth/reset">
                  Forgot password?
                </Link>
              </div>
            </form>

            <div className="mt-5 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                className="font-semibold text-gray-900 hover:underline"
                href="/auth/signup"
              >
                Sign up
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span className="h-1 w-1 rounded-full bg-gray-400" />
            Protected by encrypted credentials
            <span className="h-1 w-1 rounded-full bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
