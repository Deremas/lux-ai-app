import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ORG_NAME = "Lux AI Consultancy & Automation";

  const orgRow = await prisma.org.findFirst({
    where: { name: ORG_NAME },
    select: { id: true, name: true },
  });
  if (!orgRow) throw new Error("Org not found");
  const orgId = orgRow.id;

  const mtRows = await prisma.meetingType.findMany({
    where: { orgId },
    select: { id: true, key: true, durationMin: true },
  });

  console.log("orgId:", orgId);
  console.log("meetingTypes:", mtRows);

  // show members so you can pick ADMIN/USER UUIDs
  const members = await prisma.orgMember.findMany({
    where: { orgId },
    select: {
      id: true,
      orgId: true,
      userId: true,
      role: true,
      createdAt: true,
    },
  });
  console.log("orgMembers:", members);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
