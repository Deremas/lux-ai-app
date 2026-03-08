"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  async function submitSignup() {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage("");
    const emailTrim = email.trim();
    const nameTrim = name.trim();

    if (!EMAIL_REGEX.test(emailTrim)) {
      setErrorMessage("Enter a valid email address.");
      setSubmitting(false);
      return;
    }

    if (nameTrim && (nameTrim.length < 2 || nameTrim.length > 120)) {
      setErrorMessage("Name must be 2–120 characters.");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: nameTrim || undefined,
          email: emailTrim,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const rawError = typeof data?.error === "string" ? data.error : "";
        const message = (() => {
          switch (rawError) {
            case "Email and password are required":
              return "Email and password are required.";
            case "Password must be at least 8 characters":
              return "Password must be at least 8 characters.";
            case "Email not configured":
              return "Email service is unavailable. Try again later.";
            case "Email delivery timed out":
            case "Failed to send verification email":
              return "We couldn’t send the verification email. Please try again.";
            case "Email already registered":
              return "This email is already registered. Sign in instead.";
            case "Invalid input":
            default:
              return "Please check your details and try again.";
          }
        })();
        setErrorMessage(message);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setCanResend(true);
      setSubmitting(false);
    } catch {
      setErrorMessage("Unable to create account. Try again.");
      setSubmitting(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitSignup();
  }

  async function onResend() {
    if (!canResend || !email || resendCountdown > 0) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.error || "Failed to resend verification email";
        setErrorMessage(message);
        setSubmitting(false);
        return;
      }

      // Start 30-second countdown for user feedback
      setResendCountdown(30);
      setSubmitting(false);
    } catch {
      setErrorMessage("Unable to resend verification email. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-font relative min-h-screen overflow-hidden bg-[#eef3f8]">
      <div className="auth-blob auth-blob--one" />
      <div className="auth-blob auth-blob--two" />
      <div className="auth-blob auth-blob--three" />

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 auth-fade-up">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 shadow-sm backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Lux AI Scheduling
          </Link>

          <h1 className="mt-6 text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
            Create your booking space in minutes.
          </h1>
          <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
            Build a tailored booking experience with automatic confirmations,
            clear policies, and a personalized calendar for your team.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "One-click booking links for clients",
              "Approval workflows when you need control",
              "Smart buffers so calendars stay clean",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-sm backdrop-blur"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 auth-fade-up-delay">
          <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Get started
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                Create account
              </h2>
              <p className="text-sm text-gray-600">
                Start booking appointments in minutes.
              </p>
            </div>

            {submitted ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="font-semibold mb-1">Check your inbox</div>
                  We sent a verification email with the subject <strong>"Verify your email — Lux AI"</strong>.
                  Please check your email and click the verification link to sign in.
                </div>
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500"
                  onClick={onResend}
                  disabled={submitting || resendCountdown > 0}
                >
                  {submitting
                    ? "Resending..."
                    : resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Resend verification email"
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSubmitted(false)}
                >
                  Back to sign up
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

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
                  <p className="text-xs text-gray-500">
                    Minimum 8 characters.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500"
                  disabled={submitting || submitted}
                >
                  {submitting
                    ? "Creating account..."
                    : submitted
                      ? "Check your email"
                      : "Create account"}
                </Button>
                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}
              </form>
            )}

            <div className="mt-5 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                className="font-semibold text-gray-900 hover:underline"
                href="/auth/signin"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span className="h-1 w-1 rounded-full bg-gray-400" />
            Your data stays private
            <span className="h-1 w-1 rounded-full bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
