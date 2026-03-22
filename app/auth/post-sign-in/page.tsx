import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CALLBACK_URL = "/scheduling";

function pickFirst(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function normalizeCallbackUrl(value: string | string[] | undefined): string {
  const raw = pickFirst(value).trim();
  if (!raw) return DEFAULT_CALLBACK_URL;

  if (raw.startsWith("/")) {
    return raw;
  }

  try {
    const url = new URL(raw);
    return `${url.pathname}${url.search}${url.hash}` || DEFAULT_CALLBACK_URL;
  } catch {
    return DEFAULT_CALLBACK_URL;
  }
}

function isGenericSchedulingCallback(callbackUrl: string): boolean {
  try {
    const url = new URL(callbackUrl, "http://localhost");
    return url.pathname === "/scheduling";
  } catch {
    return false;
  }
}

export default async function PostSignInPage({
  searchParams,
}: {
  searchParams?: {
    callbackUrl?: string | string[];
  };
}) {
  const callbackUrl = normalizeCallbackUrl(searchParams?.callbackUrl);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const adminMember = await prisma.orgMember.findFirst({
    where: { userId, role: "admin" },
    select: { id: true },
    orderBy: {
      org: {
        createdAt: "asc",
      },
    },
  });

  if (adminMember && isGenericSchedulingCallback(callbackUrl)) {
    redirect("/admin/scheduling");
  }

  redirect(callbackUrl);
}
