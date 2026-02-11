import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import {
  requireOrgRole,
  requireUserIdFromSession,
} from "@/lib/scheduling/authz";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { writeAudit } from "@/lib/scheduling/audit";
import { isBodyTooLarge, isValidTimezone, isValidUuid } from "@/lib/validation";

type Body = {
  orgId?: string;
  email?: string;
  name?: string;
  phone?: string;
  timezone?: string;
  role?: string;
  password?: string;
};

const ALLOWED_ROLES = ["admin", "staff", "customer"] as const;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveOrgId(orgIdParam: string, userId: string) {
  if (orgIdParam) return orgIdParam;
  const ctx = await getUserOrgContext(userId, ["admin"]);
  return ctx?.orgId ?? "";
}

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const url = new URL(req.url);
  const orgIdParam = cleanString(url.searchParams.get("orgId"));
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

  const roleParam = cleanString(url.searchParams.get("role")).toLowerCase();
  const q = cleanString(url.searchParams.get("q"));
  const roleFilter =
    roleParam && ALLOWED_ROLES.includes(roleParam as (typeof ALLOWED_ROLES)[number])
      ? roleParam
      : "customer";
  const pageParam = Number(cleanString(url.searchParams.get("page")));
  const pageSizeParam = Number(cleanString(url.searchParams.get("pageSize")));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && [10, 25, 50].includes(pageSizeParam)
      ? pageSizeParam
      : 10;
  const offset = (page - 1) * pageSize;

  const memberWhere: any = { orgId, role: roleFilter };

  if (q) {
    const [users, profiles] = await Promise.all([
      prisma.appUser.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      }),
      prisma.bookingProfile.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { userId: true },
      }),
    ]);

    const userIds = Array.from(
      new Set([...users.map((u) => u.id), ...profiles.map((p) => p.userId)])
    );

    if (!userIds.length) {
      return NextResponse.json({
        orgId,
        items: [],
        page,
        pageSize,
        total: 0,
        totalPages: 1,
      });
    }

    memberWhere.userId = { in: userIds };
  }

  const total = await prisma.orgMember.count({ where: memberWhere });

  const members = await prisma.orgMember.findMany({
    where: memberWhere,
    take: pageSize,
    skip: offset,
  });

  const userIds = Array.from(new Set(members.map((m) => m.userId)));
  const [users, profiles] = await Promise.all([
    userIds.length
      ? prisma.appUser.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            timezone: true,
            createdAt: true,
          },
        })
      : [],
    userIds.length
      ? prisma.bookingProfile.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, fullName: true, phone: true, timezone: true },
        })
      : [],
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const items = members.map((m) => {
    const user = userMap.get(m.userId);
    const profile = profileMap.get(m.userId);
    return {
      id: m.userId,
      email: user?.email ?? "",
      name: profile?.fullName || user?.name || "",
      phone: profile?.phone || user?.phone || "",
      timezone: profile?.timezone || user?.timezone || "",
      role: m.role,
      createdAt: user?.createdAt ?? m.createdAt,
    };
  });

  return NextResponse.json({
    orgId,
    items,
    page,
    pageSize,
    total,
    totalPages: pageSize ? Math.ceil(total / pageSize) : 1,
  });
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 4096)) {
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

  const email = cleanString(body.email).toLowerCase();
  const name = cleanString(body.name);
  const phone = cleanString(body.phone);
  const timezone = cleanString(body.timezone);
  const role = cleanString(body.role).toLowerCase();
  const password = cleanString(body.password);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (timezone && !isValidTimezone(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.appUser.findFirst({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name: name || null,
      phone: phone || null,
      timezone: timezone || null,
      passwordHash,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  await prisma.orgMember.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      userId: user.id,
      role,
    },
  });

  await writeAudit({
    orgId,
    actorUserId: who.userId,
    entityType: "user",
    entityId: user.id,
    action: "create",
    before: null,
    after: { user, role },
  });

  return NextResponse.json({ item: user }, { status: 201 });
}
