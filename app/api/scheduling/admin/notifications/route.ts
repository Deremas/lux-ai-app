import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  requireUserIdFromSession,
  requireOrgRole,
} from "@/lib/scheduling/authz";
import { isValidUuid } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

// GET: list notifications, filter by seen/unseen
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");
  const statusFilter = (url.searchParams.get("status") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();
  const pageParam = Number(url.searchParams.get("page"));
  const pageSizeParam = Number(url.searchParams.get("pageSize"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && [10, 25, 50].includes(pageSizeParam)
      ? pageSizeParam
      : 10;
  const offset = (page - 1) * pageSize;
  const seenFilter = url.searchParams.get("seen");

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  if (!isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: 403 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers },
    );
  }

  const queryMode: Prisma.QueryMode = "insensitive";
  const where: Prisma.NotificationLogWhereInput = {
    appointment: { orgId },
    ...(seenFilter === "false"
      ? { seen: false }
      : seenFilter === "true"
      ? { seen: true }
      : {}),
    ...(statusFilter && ["sent", "failed"].includes(statusFilter)
      ? { status: statusFilter }
      : {}),
    ...(q
      ? {
          OR: [
            { toAddress: { contains: q, mode: queryMode } },
            { templateKey: { contains: q, mode: queryMode } },
            {
              appointment: {
                meetingType: { key: { contains: q, mode: queryMode } },
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.notificationLog.count({ where });

  const rows = await prisma.notificationLog.findMany({
    where,
    include: {
      appointment: {
        select: {
          id: true,
          status: true,
          startAtUtc: true,
          meetingType: { select: { key: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip: offset,
  });

  const items = rows.map((row) => ({
    id: row.id,
    appointmentId: row.appointmentId,
    channel: row.channel,
    toAddress: row.toAddress,
    templateKey: row.templateKey,
    status: row.status,
    error: row.error,
    createdAt: row.createdAt,
    meetingTypeKey: row.appointment?.meetingType?.key ?? null,
    apptStatus: row.appointment?.status ?? "",
    startAtUtc: row.appointment?.startAtUtc ?? row.createdAt,
    seen: row.seen,
  }));

  return NextResponse.json({
    orgId,
    items,
    page,
    pageSize,
    total,
    totalPages: pageSize ? Math.ceil(total / pageSize) : 1,
  });
}

// PATCH: mark notifications as seen
export async function PATCH(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers },
    );
  }

  const body = await req.json();
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  const orgId = typeof body?.orgId === "string" ? body.orgId.trim() : "";
  if (!orgId || !isValidUuid(orgId)) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "No notification IDs provided" },
      { status: 400 },
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });
  const authz = await requireOrgRole({
    orgId,
    userId: who.userId,
    allowed: ["admin", "staff"],
  });
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: 403 });
  }

  const result = await prisma.notificationLog.updateMany({
    where: { id: { in: ids }, appointment: { orgId } },
    data: { seen: true },
  });
  return NextResponse.json({ ok: true, updated: result.count });
}
