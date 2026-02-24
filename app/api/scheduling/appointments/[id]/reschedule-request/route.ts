import { NextResponse } from "next/server";
import { DateTime } from "luxon";

import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";
import { isBodyTooLarge, isValidUuid } from "@/lib/validation";
import { sendRescheduleRequestEmails } from "@/lib/scheduling/notify";

type Body = {
  reason?: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  if (isBodyTooLarge(req, 4096)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers },
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

  const appointmentId = cleanString(params.id);
  const reason = cleanString(body.reason);

  if (!appointmentId || !isValidUuid(appointmentId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const current = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    select: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
    },
  });
  if (!current) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }
  if (current.userId !== who.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["pending", "confirmed"].includes(String(current.status))) {
    return NextResponse.json(
      { error: "Only pending or confirmed bookings can be rescheduled." },
      { status: 400 },
    );
  }

  const createdAtUtc = DateTime.fromJSDate(
    current.createdAt instanceof Date
      ? current.createdAt
      : new Date(current.createdAt),
  ).toUTC();
  const rescheduleWindowEnds = createdAtUtc.plus({ hours: 1 });
  if (DateTime.utc() <= rescheduleWindowEnds) {
    return NextResponse.json(
      { error: "Reschedule is still available. Please reschedule directly." },
      { status: 400 },
    );
  }

  const result = await sendRescheduleRequestEmails({
    appointmentId,
    reason: reason || undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to send request" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
