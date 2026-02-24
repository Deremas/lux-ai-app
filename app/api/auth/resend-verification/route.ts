import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { isBodyTooLarge } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import VerifyEmail from "@/emails/auth/VerifyEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    if (isBodyTooLarge(req, 1024 * 1024)) {
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

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { email } = body;
    const emailTrim = email?.trim();

    if (!emailTrim || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailTrim)) {
        return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Check if user already exists and is verified
    const existingUser = await prisma.appUser.findFirst({
        where: { email: emailTrim },
        select: { id: true },
    });

    if (existingUser) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Check for existing pending verification
    const existingPending = await prisma.emailVerification.findFirst({
        where: {
            email: emailTrim,
            expiresAt: { gt: new Date() },
            usedAt: null,
        },
        select: {
            id: true,
        },
    });

    // Delete any existing expired or used tokens for this email
    await prisma.emailVerification.deleteMany({
        where: {
            email: emailTrim,
            OR: [
                { expiresAt: { lt: new Date() } },
                { usedAt: { not: null } },
            ],
        },
    });

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create or update verification record
    if (existingPending) {
        await prisma.emailVerification.update({
            where: { id: existingPending.id },
            data: {
                token: tokenHash,
                expiresAt,
            },
        });
    } else {
        // For new verification requests without signup, we need to handle this differently
        // This route should only be used for resending, not creating new verifications
        return NextResponse.json(
            { error: "No pending verification found. Please sign up first." },
            { status: 404 }
        );
    }

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify?token=${token}`;

    try {
        await resend.emails.send({
            from: "Lux AI Consultancy & Automation <noreply@luxaiautomation.com>",
            replyTo: "molla@luxaiautomation.com",
            to: [emailTrim],
            subject: "Verify your email — Lux AI",
            react: VerifyEmail({
                name: null,
                verifyUrl,
                expiresInHours: 1,
            }),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to send verification email:", error);
        return NextResponse.json(
            { error: "Failed to send verification email" },
            { status: 500 }
        );
    }
}
