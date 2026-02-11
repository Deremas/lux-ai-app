import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const defaultCents = Number(process.env.DEFAULT_PAYMENT_CENTS ?? "15000");
  const defaultCurrency = (process.env.DEFAULT_PAYMENT_CURRENCY ?? "EUR").trim();

  const orgs = await prisma.orgSettings.findMany({
    where: { paymentPolicy: { not: "FREE" } },
    select: { orgId: true, paymentPolicy: true },
  });

  if (orgs.length === 0) {
    console.log("No orgs with payment enabled.");
    return;
  }

  const orgIds = orgs.map((o) => o.orgId);
  const result = await prisma.meetingType.updateMany({
    where: {
      orgId: { in: orgIds },
      OR: [{ priceCents: null }, { currency: null }],
    },
    data: {
      priceCents: defaultCents,
      currency: defaultCurrency,
    },
  });

  console.log("✅ Updated meeting types:", {
    orgs: orgIds.length,
    updated: result.count,
    defaultCents,
    defaultCurrency,
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Payment defaults seed failed", err);
    process.exit(1);
  });
