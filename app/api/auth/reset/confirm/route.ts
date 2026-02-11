import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { isBodyTooLarge, isValidResetToken } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

type Body = {
  token?: string;
  password?: string;
};

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 2048)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

  const token = body.token?.trim();
  const password = body.password ?? "";

  if (!token || !isValidResetToken(token)) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  const reset = await prisma.passwordReset.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    select: {
      id: true,
      userId: true,
    },
  });
  if (!reset) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.appUser.update({
    where: { id: reset.userId },
    data: { passwordHash },
  });

  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
