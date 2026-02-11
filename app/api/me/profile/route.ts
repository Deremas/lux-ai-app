import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { isValidTimezone } from "@/lib/validation";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  const profile = await prisma.appUser.findFirst({
    where: { id: who.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      timezone: true,
      email: true,
    },
  });

  return NextResponse.json({ profile: profile ?? null }, { status: 200 });
}

export async function POST(req: Request) {
  const who = await requireUserIdFromSession();
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: 401 });

  let body: { name?: string; phone?: string; timezone?: string };
  try {
    body = (await req.json()) as {
      name?: string;
      phone?: string;
      timezone?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = cleanString(body.name);
  const phone = cleanString(body.phone);
  const timezone = cleanString(body.timezone);

  if (name && (name.length < 2 || name.length > 30)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  if (phone && (phone.length < 6 || phone.length > 12)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  if (timezone && !isValidTimezone(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const updated = await prisma.appUser.update({
    where: { id: who.userId },
    data: {
      name: name || null,
      phone: phone || null,
      timezone: timezone || null,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      timezone: true,
      email: true,
    },
  });

  return NextResponse.json({ profile: updated ?? null }, { status: 200 });
}
