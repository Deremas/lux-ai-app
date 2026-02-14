import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import type { OrgRole } from "@/lib/scheduling/authz";

const FALLBACK_TZ = "Europe/Luxembourg";
const FALLBACK_LOCALE = "en";
const DEFAULT_PAYMENT_CENTS = Number(
  process.env.DEFAULT_PAYMENT_CENTS ?? "15000"
);
const DEFAULT_PAYMENT_CURRENCY = (
  process.env.DEFAULT_PAYMENT_CURRENCY ?? "EUR"
).trim();
const DEFAULT_WORKING_HOURS = {
  timezone: FALLBACK_TZ,
  slotStepMin: 60,
  bufferMin: 0,
  week: {
    mon: [{ start: "08:00", end: "17:00" }],
    tue: [{ start: "08:00", end: "17:00" }],
    wed: [{ start: "08:00", end: "17:00" }],
    thu: [{ start: "08:00", end: "17:00" }],
    fri: [{ start: "08:00", end: "17:00" }],
    sat: [],
    sun: [],
  },
};

export type OrgContext = {
  orgId: string;
  orgName: string;
  defaultTz: string;
  defaultLocale: string;
};

export async function getOrgContextById(
  orgId: string
): Promise<OrgContext | null> {
  const row = await prisma.org.findFirst({
    where: { id: orgId },
    include: { settings: true },
  });

  if (!row) return null;

  if (!row.settings) {
    await ensureOrgSettings(row.id);
  }

  return {
    orgId: row.id,
    orgName: row.name,
    defaultTz: row.settings?.defaultTz ?? FALLBACK_TZ,
    defaultLocale: row.settings?.defaultLocale ?? FALLBACK_LOCALE,
  };
}

export async function getUserOrgContext(
  userId: string,
  allowedRoles: OrgRole[] = ["admin", "staff", "customer"]
): Promise<OrgContext | null> {
  const row = await prisma.orgMember.findFirst({
    where: {
      userId,
      role: { in: allowedRoles },
    },
    include: {
      org: {
        include: {
          settings: true,
        },
      },
    },
    orderBy: {
      org: {
        createdAt: "asc",
      },
    },
  });

  if (!row?.org) {
    return await autoProvisionOrgForUser(userId, allowedRoles);
  }

  if (!row.org.settings) {
    await ensureOrgSettings(row.org.id);
  }

  return {
    orgId: row.org.id,
    orgName: row.org.name,
    defaultTz: row.org.settings?.defaultTz ?? FALLBACK_TZ,
    defaultLocale: row.org.settings?.defaultLocale ?? FALLBACK_LOCALE,
  };
}

async function ensureOrgSettings(orgId: string) {
  const existing = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.orgSettings.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      approvalPolicy: "REQUIRES_APPROVAL",
      paymentPolicy: "FREE",
      defaultLocale: FALLBACK_LOCALE,
      defaultTz: FALLBACK_TZ,
      notifyEmails: [],
      defaultPaymentCents: Number.isFinite(DEFAULT_PAYMENT_CENTS)
        ? DEFAULT_PAYMENT_CENTS
        : null,
      defaultCurrency: DEFAULT_PAYMENT_CURRENCY || null,
      workingHours: DEFAULT_WORKING_HOURS,
    },
  });
}

async function ensureStaffCalendar(orgId: string, staffUserId: string) {
  const existing = await prisma.staffCalendar.findFirst({
    where: { orgId, staffUserId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.staffCalendar.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      staffUserId,
      isActive: true,
      workingHours: DEFAULT_WORKING_HOURS,
    },
  });
}

async function autoProvisionOrgForUser(
  userId: string,
  allowedRoles: OrgRole[]
): Promise<OrgContext | null> {
  const shouldAutoProvision = process.env.AUTO_PROVISION_ORG !== "false";
  if (!shouldAutoProvision) return null;

  const userRow = await prisma.appUser.findFirst({
    where: { id: userId },
    select: { id: true },
  });
  if (!userRow) {
    console.warn(
      "[org-context] autoProvision skipped: app_user not found for userId",
      userId
    );
    return null;
  }

  const provisionRole = allowedRoles.includes("customer")
    ? "customer"
    : allowedRoles.includes("admin")
      ? "admin"
      : allowedRoles.includes("staff")
        ? "staff"
        : allowedRoles[0] ?? "customer";

  const orgs = await prisma.org.findMany({
    include: { settings: true },
    orderBy: { createdAt: "asc" },
    take: 2,
  });

  if (orgs.length === 0) {
    const orgName = process.env.SEED_ORG_NAME ?? "Default Organization";
    const orgId = crypto.randomUUID();
    const settingsId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    const created = await prisma.$transaction(async (tx) => {
      const org = await tx.org.create({
        data: { id: orgId, name: orgName },
      });

      const settings = await tx.orgSettings.create({
        data: {
          id: settingsId,
          orgId: org.id,
          notifyEmails: [],
          approvalPolicy: "REQUIRES_APPROVAL",
          paymentPolicy: "FREE",
          defaultLocale: FALLBACK_LOCALE,
          defaultTz: FALLBACK_TZ,
          defaultPaymentCents: Number.isFinite(DEFAULT_PAYMENT_CENTS)
            ? DEFAULT_PAYMENT_CENTS
            : null,
          defaultCurrency: DEFAULT_PAYMENT_CURRENCY || null,
          workingHours: DEFAULT_WORKING_HOURS,
        },
      });

      await tx.orgMember.create({
        data: {
          id: memberId,
          orgId: org.id,
          userId,
          role: provisionRole,
        },
      });

      return { org, settings };
    });

    if (provisionRole === "admin") {
      await ensureStaffCalendar(created.org.id, userId);
    }

    return {
      orgId: created.org.id,
      orgName: created.org.name,
      defaultTz: created.settings.defaultTz ?? FALLBACK_TZ,
      defaultLocale: created.settings.defaultLocale ?? FALLBACK_LOCALE,
    };
  }

  if (orgs.length === 1) {
    const org = orgs[0];

    await prisma.orgMember.upsert({
      where: { orgId_userId: { orgId: org.id, userId } },
      create: {
        id: crypto.randomUUID(),
        orgId: org.id,
        userId,
        role: provisionRole,
      },
      update: {},
    });

    if (provisionRole === "admin") {
      await ensureOrgSettings(org.id);
      await ensureStaffCalendar(org.id, userId);
    }

    return {
      orgId: org.id,
      orgName: org.name,
      defaultTz: org.settings?.defaultTz ?? FALLBACK_TZ,
      defaultLocale: org.settings?.defaultLocale ?? FALLBACK_LOCALE,
    };
  }

  return null;
}

export async function getOrCreateUserOrgContext(
  userId: string,
  allowedRoles: OrgRole[] = ["admin", "staff", "customer"]
): Promise<OrgContext | null> {
  return await getUserOrgContext(userId, allowedRoles);
}

export async function getFirstOrgContext(): Promise<OrgContext | null> {
  let row = await prisma.org.findFirst({
    include: { settings: true },
    orderBy: { createdAt: "asc" },
  });

  if (!row) {
    const shouldAutoProvision = process.env.AUTO_PROVISION_ORG !== "false";
    if (!shouldAutoProvision) return null;

    const orgName = process.env.SEED_ORG_NAME ?? "Default Organization";
    const orgId = crypto.randomUUID();
    await prisma.org.create({
      data: { id: orgId, name: orgName },
    });
    await ensureOrgSettings(orgId);
    row = await prisma.org.findFirst({
      where: { id: orgId },
      include: { settings: true },
    });
  }

  if (!row) return null;

  return {
    orgId: row.id,
    orgName: row.name,
    defaultTz: row.settings?.defaultTz ?? FALLBACK_TZ,
    defaultLocale: row.settings?.defaultLocale ?? FALLBACK_LOCALE,
  };
}
