import { Prisma } from "@prisma/client";

const LEGACY_PAYMENT_POLICY_VALUES = ["PAY_BEFORE_CONFIRM", "APPROVE_THEN_PAY"];

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function getSchedulingRuntimeErrorMessage(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Scheduling is temporarily unavailable because the database connection failed. Please try again or use the contact form.";
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
