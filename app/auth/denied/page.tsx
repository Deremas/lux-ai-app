"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  const params = useSearchParams();
  const reason = params.get("reason");

  const title =
    reason === "admin" ? "Admin access required" : "Access denied";
  const message =
    reason === "admin"
      ? "You need admin or staff access to view this page."
      : "You do not have access to this page.";

  return (
    <div className="auth-font relative min-h-screen overflow-hidden bg-[#f7f4f0]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Access
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{message}</p>

          <div className="mt-6 flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/scheduling">Go to scheduling</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
