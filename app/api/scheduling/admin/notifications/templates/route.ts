import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";

const CHANNELS = ["email", "whatsapp"] as const;
const MAX_BODY = 4096;

type Channel = (typeof CHANNELS)[number];

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function isValidTemplateKey(value: string) {
  return /^[a-z0-9_]+$/.test(value) && value.length <= 64;
}

async function resolveOrgId(req: Request, body?: any) {
  const url = new URL(req.url);
  const orgIdParam = cleanString(body?.orgId ?? url.searchParams.get("orgId"));

  const who = await requireUserIdFromSession();
  if (!who.ok) return { ok: false as const, error: who.error, status: 401 };

  const orgContext = orgIdParam
    ? null
    : await getUserOrgContext(who.userId, ["admin"]);

  const orgId = orgIdParam || orgContext?.orgId || "";
  if (!orgId) {
    return { ok: false as const, error: "Missing orgId", status: 400 };
  }
  if (!isValidUuid(orgId)) {
    return { ok: false as const, error: "Invalid input", status: 400 };
  }

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin"],
  });
  if (!authz.ok) {
    return { ok: false as const, error: authz.error, status: 403 };
  }

  return { ok: true as const, orgId, userId: who.userId };
}

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const resolved = await resolveOrgId(req);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const rows = await prisma.notificationTemplate.findMany({
    where: { orgId: resolved.orgId },
    orderBy: [{ channel: "asc" }, { key: "asc" }],
  });

  return NextResponse.json({
    orgId: resolved.orgId,
    templates: rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      key: row.key,
      subject: row.subject,
      body: row.body,
      updatedAt: row.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, MAX_BODY)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const body = await req.json().catch(() => ({}));
  const resolved = await resolveOrgId(req, body);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const channel = cleanString(body?.channel) as Channel;
  const key = normalizeKey(cleanString(body?.key));
  const subject = cleanString(body?.subject);
  const content = cleanString(body?.body);

  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }
  if (!key || !isValidTemplateKey(key)) {
    return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "Template body is required" }, { status: 400 });
  }

  const saved = await prisma.notificationTemplate.upsert({
    where: {
      orgId_channel_key: {
        orgId: resolved.orgId,
        channel,
        key,
      },
    },
    create: {
      id: crypto.randomUUID(),
      orgId: resolved.orgId,
      channel,
      key,
      subject: subject || null,
      body: content,
    },
    update: {
      subject: subject || null,
      body: content,
      updatedAt: new Date(),
    },
  });

  await writeAudit({
    orgId: resolved.orgId,
    actorUserId: resolved.userId,
    entityType: "notification_template",
    entityId: saved.id,
    action: "upsert",
    before: null,
    after: { channel, key },
  });

  return NextResponse.json({
    template: {
      id: saved.id,
      channel: saved.channel,
      key: saved.key,
      subject: saved.subject,
      body: saved.body,
      updatedAt: saved.updatedAt,
    },
  });
}

export async function DELETE(req: Request) {
  if (isBodyTooLarge(req, MAX_BODY)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const body = await req.json().catch(() => ({}));
  const resolved = await resolveOrgId(req, body);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const channel = cleanString(body?.channel) as Channel;
  const key = normalizeKey(cleanString(body?.key));

  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }
  if (!key || !isValidTemplateKey(key)) {
    return NextResponse.json({ error: "Invalid template key" }, { status: 400 });
  }

  await prisma.notificationTemplate.deleteMany({
    where: { orgId: resolved.orgId, channel, key },
  });

  await writeAudit({
    orgId: resolved.orgId,
    actorUserId: resolved.userId,
    entityType: "notification_template",
    entityId: `${channel}:${key}`,
    action: "delete",
    before: { channel, key },
    after: null,
  });

  return NextResponse.json({ ok: true });
}

