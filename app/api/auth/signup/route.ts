import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";

import { prisma } from "@/lib/prisma";
import { isBodyTooLarge, isValidEmail, isValidName } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import VerifyEmail from "@/emails/auth/VerifyEmail";

type Body = {
  name?: string;
  email?: string;
  password?: string;
};

async function sendWithTimeout<T>(promise: Promise<T>, ms: number) {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 4096)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const name = body.name?.trim() || null;

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

  if (name && !isValidName(name)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (password.length > 128) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.appUser.findFirst({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM_EMAIL) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.emailVerification.upsert({
    where: { email },
    create: {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      token,
      expiresAt,
    },
    update: {
      name,
      passwordHash,
      token,
      expiresAt,
      usedAt: null,
    },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? ""}/api/auth/verify?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await sendWithTimeout(
    resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL,
      to: email,
      subject: "Verify your email",
      text: `Verify your email (valid for 1 hour):\n${verifyUrl}`,
      html: render(
        VerifyEmail({ name, verifyUrl, expiresInHours: 1 })
      ),
    }),
    3000
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
