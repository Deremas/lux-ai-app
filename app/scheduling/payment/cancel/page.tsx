"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#ffffff_75%)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_55%,_#0b1120_100%)]">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
        <h1 className="text-2xl font-semibold text-gray-900">
          Payment canceled
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your payment was canceled. No booking was created.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/scheduling">Return to scheduling</Link>
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
