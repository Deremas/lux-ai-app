import { NextResponse } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isValidResetToken } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { getPublicBaseUrl } from "@/lib/public-url";

function redirectTo(baseUrl: string, path: string) {
  try {
    return NextResponse.redirect(new URL(path, baseUrl));
  } catch (error) {
    console.error("[api/auth/verify] invalid redirect base", { baseUrl, path, error });
    return NextResponse.redirect(new URL(path, "https://luxaiautomation.com"));
  }
}

export async function GET(req: Request) {
  const baseUrl = getPublicBaseUrl(req);

  try {
    const limit = await applyRateLimit(req, RATE_LIMIT_RULES.auth, {
      methodGroup: "auth",
    });
    if (!limit.ok) {
      return redirectTo(baseUrl, "/auth/signin?error=rate_limited");
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim() ?? "";

    if (!token || !isValidResetToken(token)) {
      return redirectTo(baseUrl, "/auth/signin?error=invalid_token");
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
      return redirectTo(baseUrl, "/auth/signin?error=expired_token");
    }

    const email = pending.email.trim().toLowerCase();

    await prisma.$transaction(async (tx) => {
      const existing = await tx.appUser.findFirst({
        where: { email },
        select: { id: true },
      });

      if (!existing) {
        try {
          await tx.appUser.create({
            data: {
              id: crypto.randomUUID(),
              email,
              name: pending.name ?? null,
              passwordHash: pending.passwordHash,
            },
          });
        } catch (error) {
          // Concurrent verify clicks can race on the unique email index.
          if (
            !(
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            )
          ) {
            throw error;
          }
        }
      }

      await tx.emailVerification.update({
        where: { id: pending.id },
        data: { usedAt: new Date() },
      });
    });

    return redirectTo(baseUrl, "/auth/verified");
  } catch (error) {
    console.error("[api/auth/verify] failed", error);
    return redirectTo(baseUrl, "/auth/signin?error=verify_failed");
  }
}
