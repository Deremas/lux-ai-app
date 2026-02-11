import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { isBodyTooLarge } from "@/lib/validation";
import { requireUserIdFromSession } from "@/lib/scheduling/authz";

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

  const body = await req.json().catch(() => ({}));
  const sessionId =
    typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const meta = session.metadata ?? {};
  const sessionUserId =
    typeof meta.userId === "string" ? meta.userId.trim() : "";
  if (!sessionUserId || sessionUserId !== who.userId) {
    return NextResponse.json(
      { error: "Session does not match current user." },
      { status: 403 }
    );
  }
  const paid = session.payment_status === "paid";
  return NextResponse.json({
    paid,
    paymentStatus: session.payment_status,
    sessionId: session.id,
    metadata: {
      orgId: meta.orgId ?? "",
      meetingTypeId: meta.meetingTypeId ?? "",
      mode: meta.mode ?? "",
      startLocal: meta.startLocal ?? "",
      tz: meta.tz ?? "",
      staffUserId: meta.staffUserId ?? "",
      userId: meta.userId ?? "",
    },
  });
}
