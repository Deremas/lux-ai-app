// lib/scheduling/authz.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type OrgRole = "admin" | "staff" | "customer";

export async function getOrgRole(params: { orgId: string; userId: string }) {
  const row = await prisma.orgMember.findFirst({
    where: { orgId: params.orgId, userId: params.userId },
    select: { role: true },
  });

  return (row?.role ?? null) as OrgRole | null;
}

export async function requireUserIdFromSession() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false as const, error: "Unauthenticated" };
  }
  return { ok: true as const, userId };
}

export async function requireOrgRole(params: {
  orgId: string;
  userId: string;
  allowed: OrgRole[];
}) {
  const role = await getOrgRole({ orgId: params.orgId, userId: params.userId });
  if (!role) return { ok: false as const, error: "Not a member of this org" };
  if (!params.allowed.includes(role)) {
    return { ok: false as const, error: `Forbidden (role=${role})` };
  }
  return { ok: true as const, role };
}
