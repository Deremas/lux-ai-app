// lib/scheduling/audit.ts
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaCompatibilityError } from "@/lib/scheduling/prisma-compat";

function toJsonValue(
  value: unknown | undefined
): Prisma.InputJsonValue | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull {
  if (value === undefined) return Prisma.DbNull;
  if (value === null) return Prisma.JsonNull;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return { error: "Could not serialize JSON" };
  }
}

export async function writeAudit(params: {
  orgId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        orgId: params.orgId,
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: toJsonValue(params.before),
        after: toJsonValue(params.after),
      },
    });
  } catch (error) {
    if (isPrismaSchemaCompatibilityError(error)) {
      console.warn(
        "[audit] audit_log is unavailable until database migrations are applied",
        error
      );
      return;
    }

    throw error;
  }
}
