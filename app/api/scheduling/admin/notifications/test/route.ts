import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { requireOrgRole } from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";
import { sendTestNotifications } from "@/lib/scheduling/notify";

type Body = {
  orgId?: string;
  channel?: "email" | "whatsapp";
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveOrgId(orgIdParam: string, userId: string) {
  if (orgIdParam) return orgIdParam;
  const ctx = await getUserOrgContext(userId, ["admin"]);
  return ctx?.orgId ?? "";
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 2048)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgIdParam = cleanString(body.orgId);
  const orgId = await resolveOrgId(orgIdParam, who.userId);
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });

  const channel = body.channel === "whatsapp" ? "whatsapp" : "email";

  const settings = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { id: true },
  });
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const result = await sendTestNotifications({ orgId, channel });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Test failed" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
