import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { COMPANY_ORG_NAME, LEGACY_ORG_NAMES } from "@/lib/company";

config({ path: ".env.local", override: true });
config({ path: ".env" });

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
] as const;

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "Luxai@123";
const rawSeedName = (process.env.SEED_ORG_NAME ?? "").trim();
const ORG_NAME =
  !rawSeedName || LEGACY_ORG_NAMES.includes(rawSeedName as (typeof LEGACY_ORG_NAMES)[number])
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

async function main() {
  // Prefer running db/seed_super_admins.cjs in production/Docker.
  const org = await ensureCanonicalOrg();
  console.log("Use npm run db:seed:super-admins for full seed.", {
    orgId: org.id,
    orgName: org.name,
    password: DEFAULT_PASSWORD,
    admins: SUPER_ADMINS.map((a) => a.email),
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
