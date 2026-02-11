// app/api/scheduling/profile/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import {
  isBodyTooLarge,
  isValidCompany,
  isValidName,
  isValidNotes,
  isValidPhone,
  isValidRole,
  isValidTimezone,
} from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

type Body = {
  orgId?: string;
  fullName: string;
  phone: string;
  company?: string;
  companyRole?: string;
  timezone: string;
  notes: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(v: string): boolean {
  // strict enough for API validation
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

async function normalizeOrgId(input?: string): Promise<string | null> {
  const raw = cleanString(input);
  if (!raw) return null;
  if (!isUuid(raw)) return null;

  // Only persist orgId if it exists (prevents FK violation)
  const exists = await prisma.org.findFirst({
    where: { id: raw },
    select: { id: true },
  });

  return exists ? raw : null;
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

  const profile = await prisma.bookingProfile.findFirst({
    where: { userId: who.userId },
  });

  return NextResponse.json({ profile: profile ?? null }, { status: 200 });
}

export async function POST(req: Request) {
  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  if (isBodyTooLarge(req, 8192)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fullName = cleanString(body.fullName);
  const phone = cleanString(body.phone);
  const company = cleanString(body.company);
  const companyRole = cleanString(body.companyRole);
  const timezone = cleanString(body.timezone);
  const notes = cleanString(body.notes);

  if (!fullName || !phone || !timezone || !notes) {
    return NextResponse.json(
      { error: "Missing required profile fields" },
      { status: 400 }
    );
  }

  if (!isValidName(fullName)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isValidTimezone(timezone)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isValidNotes(notes)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (company && !isValidCompany(company)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (companyRole && !isValidRole(companyRole)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (company && !companyRole) {
    return NextResponse.json(
      { error: "Role is required when company is provided" },
      { status: 400 }
    );
  }

  const orgId = await normalizeOrgId(body.orgId);
  const now = new Date();

  const profile = await prisma.bookingProfile.upsert({
    where: { userId: who.userId },
    create: {
      id: crypto.randomUUID(),
      orgId,
      userId: who.userId,
      fullName,
      phone,
      company: company || null,
      companyRole: companyRole || null,
      timezone,
      notes,
      updatedAt: now,
    },
    update: {
      orgId,
      fullName,
      phone,
      company: company || null,
      companyRole: companyRole || null,
      timezone,
      notes,
      updatedAt: now,
    },
  });

  return NextResponse.json({ profile }, { status: 200 });
}
