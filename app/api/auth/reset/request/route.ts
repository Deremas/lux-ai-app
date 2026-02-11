import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";

import { prisma } from "@/lib/prisma";
import { isBodyTooLarge, isValidEmail } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import ResetPasswordEmail from "@/emails/auth/ResetPasswordEmail";

type Body = {
  email?: string;
};

async function sendWithTimeout<T>(promise: Promise<T>, ms: number) {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

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

  const email = body.email?.trim().toLowerCase();
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.auth, {
    identity: email,
    methodGroup: "auth",
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.appUser.findFirst({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM_EMAIL) {
    return NextResponse.json(
      { error: "Email service unavailable" },
      { status: 500 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.passwordReset.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL ?? ""}/auth/reset?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await sendWithTimeout(
    resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      text: `Reset your password (valid for 1 hour):\n${resetUrl}`,
      html: render(ResetPasswordEmail({ resetUrl, expiresInHours: 1 })),
    }),
    3000
  );

  return NextResponse.json({ ok: true });
}
