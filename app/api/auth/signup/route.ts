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

  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY || !fromEmail) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.emailVerification.upsert({
    where: { email },
    create: {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      token: tokenHash,
      expiresAt,
    },
    update: {
      name,
      passwordHash,
      token: tokenHash,
      expiresAt,
      usedAt: null,
    },
  });

  const baseUrl = (process.env.NEXTAUTH_URL ?? "https://luxaiautomation.com").replace(
    /\/+$/,
    ""
  );
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromHeader = `"Lux AI Consultancy & Automation" <${fromEmail}>`;
  const replyTo = "support@luxaiautomation.com";
  const subject = "Verify your email — Lux AI";
  const text = `Hi ${name ?? "there"},\n\nPlease confirm your email to finish creating your Lux AI account:\n\n${verifyUrl}\n\nThis link expires in 60 minutes.\n\nIf you did not request this account, you can ignore this email.\n\nLux AI Consultancy & Automation\nhttps://luxaiautomation.com`;

  const sendResult = await sendWithTimeout(
    resend.emails.send({
      from: fromHeader,
      replyTo,
      to: email,
      subject,
      text,
      html: render(VerifyEmail({ name, verifyUrl, expiresInHours: 1 })),
    }),
    8000
  );

  if (!sendResult) {
    console.error("verify email send timeout", { email });
    return NextResponse.json(
      { error: "Email delivery timed out" },
      { status: 504 }
    );
  }

  if ("error" in sendResult && sendResult.error) {
    console.error("verify email send failed", sendResult.error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
