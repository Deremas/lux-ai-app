// import { config } from "dotenv";
// config({ path: ".env.local", override: true });

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// const ORG_NAME =
//   process.env.SEED_ORG_NAME ?? "Lux AI Consultancy & Automation";
// const STAFF_EMAIL = (process.env.SEED_STAFF_EMAIL ?? "staff@luxai.test")
//   .trim()
//   .toLowerCase();
// const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "LuxAI@1234";
// const STAFF_NAME = process.env.SEED_STAFF_NAME ?? "Lux AI Staff";

// const WORKING_HOURS = {
//   timezone: "Europe/Luxembourg",
//   slotStepMin: 60,
//   bufferMin: 0,
//   week: {
//     mon: [{ start: "08:00", end: "17:00" }],
//     tue: [{ start: "08:00", end: "17:00" }],
//     wed: [{ start: "08:00", end: "17:00" }],
//     thu: [{ start: "08:00", end: "17:00" }],
//     fri: [{ start: "08:00", end: "17:00" }],
//     sat: [],
//     sun: [],
//   },
// };

// async function main() {
//   const row = await prisma.org.findFirst({
//     where: { name: ORG_NAME },
//     select: { id: true },
//   });
//   if (!row) throw new Error(`Org not found by name: ${ORG_NAME}`);

//   const orgId = row.id;

//   const existingUser = await prisma.appUser.findFirst({
//     where: { email: STAFF_EMAIL },
//     select: { id: true },
//   });
//   let staffUserId = existingUser?.id;

//   if (!staffUserId) {
//     const passwordHash = await import("bcryptjs").then((m) =>
//       m.default.hash(DEFAULT_PASSWORD, 10)
//     );
//     const created = await prisma.appUser.create({
//       data: { email: STAFF_EMAIL, name: STAFF_NAME, passwordHash },
//       select: { id: true },
//     });
//     staffUserId = created.id;
//   }

//   await prisma.orgMember.createMany({
//     data: [{ orgId, userId: staffUserId, role: "staff" }],
//     skipDuplicates: true,
//   });

//   await prisma.staffCalendar.create({
//     data: {
//       orgId,
//       staffUserId,
//       isActive: true,
//       workingHours: WORKING_HOURS,
//     },
//   });

//   console.log("✅ Staff calendar created", {
//     orgId,
//     staffUserId,
//   });
// }

// main().catch((e) => {
//   console.error("Failed to create staff calendar", e);
//   process.exit(1);
// });
