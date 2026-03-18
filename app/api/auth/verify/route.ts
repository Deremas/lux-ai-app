import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isValidResetToken, isBodyTooLarge } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { getPublicBaseUrl } from "@/lib/public-url";

export async function GET(req: Request) {
  if (isBodyTooLarge(req, 1024)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const baseUrl = getPublicBaseUrl(req);
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, baseUrl));

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.auth, {
    methodGroup: "auth",
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (!token || !isValidResetToken(token)) {
    return redirectTo("/auth/signin");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const pending = await prisma.emailVerification.findFirst({
    where: {
      token: tokenHash,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });
  if (!pending) {
    return redirectTo("/auth/signin");
  }

  const existing = await prisma.appUser.findFirst({
    where: { email: pending.email },
    select: { id: true },
  });

  if (!existing) {
    await prisma.appUser.create({
      data: {
        id: crypto.randomUUID(),
        email: pending.email,
        name: pending.name ?? null,
        passwordHash: pending.passwordHash,
      },
    });
  }

  await prisma.emailVerification.update({
    where: { id: pending.id },
    data: { usedAt: new Date() },
  });

  return redirectTo("/auth/verified");
}
