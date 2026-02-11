import { NextRequest, NextResponse } from "next/server";
import { cookieDomain, cookieSecure } from "@/lib/cookieConfig";
import { isBodyTooLarge } from "@/lib/validation";
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  serializeConsent,
  type Consent,
} from "@/lib/consent";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (isBodyTooLarge(req, 1024)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const analytics = !!body?.analytics;

  const consent: Consent = {
    essential: true,
    analytics,
    v: CONSENT_VERSION,
  };

  const res = NextResponse.json({ ok: true });

  res.cookies.set(CONSENT_COOKIE, serializeConsent(consent), {
    httpOnly: false, // client reads it to decide script loading
    secure: cookieSecure(),
    sameSite: "strict",
    path: "/",
    domain: cookieDomain(),
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return res;
}
