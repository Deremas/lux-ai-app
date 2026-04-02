import { Prisma } from "@prisma/client";

const COMPATIBILITY_ERROR_CODES = new Set(["P2021", "P2022"]);

export function isPrismaSchemaCompatibilityError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return COMPATIBILITY_ERROR_CODES.has(error.code);
  }

  const message = error instanceof Error ? error.message : "";
  if (!message) return false;

  return (
    /table .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message) ||
    /The table .* does not exist/i.test(message) ||
    /The column .* does not exist/i.test(message)
  );
}
