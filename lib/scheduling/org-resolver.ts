import { isValidUuid } from "@/lib/validation";
import type { OrgRole } from "@/lib/scheduling/authz";
import {
  getFirstOrgContext,
  getOrgContextById,
  getUserOrgContext,
} from "@/lib/scheduling/org-context";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function resolveOrgIdForRequest(params: {
  orgId?: string | null;
  userId?: string | null;
  allowedRoles?: OrgRole[];
  allowPublic?: boolean;
}): Promise<string> {
  const requested = cleanString(params.orgId);
  if (requested && isValidUuid(requested)) {
    const ctx = await getOrgContextById(requested);
    if (ctx?.orgId) return ctx.orgId;
  }

  if (params.userId) {
    const ctx = await getUserOrgContext(
      params.userId,
      params.allowedRoles ?? ["admin", "staff", "customer"]
    );
    if (ctx?.orgId) return ctx.orgId;
  }

  if (params.allowPublic) {
    const ctx = await getFirstOrgContext();
    if (ctx?.orgId) return ctx.orgId;
  }

  return "";
}

