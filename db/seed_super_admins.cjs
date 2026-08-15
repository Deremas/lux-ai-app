/**
 * Seeds the single Lux AI org + super-admin owners.
 * Safe to re-run: renames legacy orgs, upserts passwords, ensures admin role.
 * Runs on Docker/server startup after `prisma migrate deploy`.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  require("dotenv").config({ path: filePath, override: false });
}

try {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
} catch {
  // Env may already be injected by Docker / host process.
}

const { COMPANY_ORG_NAME, LEGACY_ORG_NAMES } = require(
  path.join(__dirname, "..", "lib", "company.cjs")
);

const prisma = new PrismaClient();

const SUPER_ADMINS = [
  {
    email: "derejemasresha27@gmail.com",
    name: "Dereje Masresha",
  },
  {
    email: "molla@luxaiautomation.com",
    name: "Molla Sisay Jemere",
  },
];

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "Luxai@123";
const rawSeedName = (process.env.SEED_ORG_NAME ?? "").trim();
const ORG_NAME =
  !rawSeedName || LEGACY_ORG_NAMES.includes(rawSeedName)
    ? COMPANY_ORG_NAME
    : rawSeedName;

async function ensureCanonicalOrg() {
  const byCanonical = await prisma.org.findFirst({
    where: { name: ORG_NAME },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  if (byCanonical) return byCanonical;

  const byLegacy = await prisma.org.findFirst({
    where: { name: { in: [...LEGACY_ORG_NAMES] } },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  if (byLegacy) {
    return prisma.org.update({
      where: { id: byLegacy.id },
      data: { name: ORG_NAME },
      select: { id: true, name: true },
    });
  }

  const first = await prisma.org.findFirst({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  if (first) {
    if (first.name !== ORG_NAME) {
      return prisma.org.update({
        where: { id: first.id },
        data: { name: ORG_NAME },
        select: { id: true, name: true },
      });
    }
    return first;
  }

  return prisma.org.create({
    data: { id: crypto.randomUUID(), name: ORG_NAME },
    select: { id: true, name: true },
  });
}

async function ensureOrgSettings(orgId) {
  const settingsExisting = await prisma.orgSettings.findFirst({
    where: { orgId },
    select: { id: true },
  });

  if (settingsExisting) return;

  await prisma.orgSettings.create({
    data: {
      id: crypto.randomUUID(),
      orgId,
      approvalPolicy: "REQUIRES_APPROVAL",
      paymentPolicy: "FREE",
      defaultLocale: "en",
      defaultTz: "Europe/Luxembourg",
      notifyEmails: ["molla@luxaiautomation.com"],
      notifyWhatsapp: [],
      allowedCurrencies: ["EUR"],
      defaultPaymentCents: 15000,
      defaultCurrency: "EUR",
      workingHours: {
        timezone: "Europe/Luxembourg",
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
      },
    },
  });
}

async function upsertUser(email, name, passwordHash) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.appUser.findFirst({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true },
  });

  if (existing) {
    return prisma.appUser.update({
      where: { id: existing.id },
      data: {
        name: existing.name ?? name,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });
  }

  return prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name,
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  });
}

async function upsertAdminMember(orgId, userId) {
  const existing = await prisma.orgMember.findFirst({
    where: { orgId, userId },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role !== "admin") {
      await prisma.orgMember.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
    }
  } else {
    await prisma.orgMember.create({
      data: {
        id: crypto.randomUUID(),
        orgId,
        userId,
        role: "admin",
      },
    });
  }

  // Keep ownership under the single company org only.
  await prisma.orgMember.deleteMany({
    where: {
      userId,
      orgId: { not: orgId },
    },
  });
}

async function ensureStaffCalendar(orgId, staffUserId) {
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
      workingHours: {
        timezone: "Europe/Luxembourg",
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
      },
    },
  });
}

async function main() {
  const org = await ensureCanonicalOrg();
  await ensureOrgSettings(org.id);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const seeded = [];

  for (const admin of SUPER_ADMINS) {
    const user = await upsertUser(admin.email, admin.name, passwordHash);
    await upsertAdminMember(org.id, user.id);
    await ensureStaffCalendar(org.id, user.id);
    seeded.push({ email: user.email, name: user.name });
  }

  console.log("✅ Company org + super admins ready", {
    orgId: org.id,
    orgName: org.name,
    admins: seeded.map((a) => a.email),
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Super admin seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
