import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const LEGACY_PAYMENT_POLICY_VALUES = ["PAY_BEFORE_CONFIRM", "APPROVE_THEN_PAY"];
const DB_UNAVAILABLE_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return DB_UNAVAILABLE_CODES.has(error.code);
  }
  const message = asErrorMessage(error).toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("timed out fetching a new connection") ||
    message.includes("connection pool") ||
    message.includes("server has closed the connection")
  );
}

export function getSchedulingRuntimeErrorMessage(error: unknown): string | null {
  if (isDatabaseUnavailableError(error)) {
    return "Temporarily unavailable — the database connection failed. Please try again in a moment.";
  }

  const message = asErrorMessage(error);
  const hasLegacyPaymentPolicy = LEGACY_PAYMENT_POLICY_VALUES.some((value) =>
    message.includes(value)
  );

  if (
    (error instanceof Prisma.PrismaClientUnknownRequestError ||
      error instanceof Prisma.PrismaClientKnownRequestError) &&
    hasLegacyPaymentPolicy
  ) {
    return "Legacy payment policy data is still in the database. Apply the Prisma migration to collapse old payment policies into FREE and PAID, then reload scheduling.";
  }

  return null;
}

export function jsonDatabaseError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
) {
  const message = getSchedulingRuntimeErrorMessage(error) || fallback;
  const status = isDatabaseUnavailableError(error) ? 503 : 500;
  return NextResponse.json({ error: message }, { status });
}
