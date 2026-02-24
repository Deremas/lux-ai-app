"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function VerifiedPage() {
  return (
    <div className="auth-font relative min-h-screen overflow-hidden bg-[#f6f3ee]">
      <div className="auth-blob auth-blob--one" />
      <div className="auth-blob auth-blob--two" />
      <div className="auth-blob auth-blob--three" />

      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-16">
        <div className="relative z-10 w-full rounded-3xl border border-gray-200 bg-white/90 p-8 text-center shadow-xl backdrop-blur">
          <h1 className="text-3xl font-bold text-gray-900">
            Email verified
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Your email has been confirmed. You can now sign in to your Lux AI
            account.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth/signin">Continue to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
