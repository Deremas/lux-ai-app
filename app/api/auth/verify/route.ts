import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidResetToken, isBodyTooLarge } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (isBodyTooLarge(req, 1024)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

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
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  const pending = await prisma.emailVerification.findFirst({
    where: {
      token,
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
    return NextResponse.redirect(new URL("/auth/signin", req.url));
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

  return NextResponse.redirect(new URL("/auth/signin", req.url));
}
