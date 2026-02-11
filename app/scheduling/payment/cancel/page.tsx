"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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
  );
}
