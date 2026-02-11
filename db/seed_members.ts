// import { PrismaClient } from "@prisma/client";
// import { config } from "dotenv";

// config({ path: ".env.local", override: true });

// const prisma = new PrismaClient();

// const ORG_NAME =
//   process.env.SEED_ORG_NAME ?? "Lux AI Consultancy & Automation";
// const ADMIN_EMAIL = (
//   process.env.SEED_ADMIN_EMAIL ??
//   process.env.CONTACT_TO_EMAIL ??
//   "admin@luxai.test"
// )
//   .trim()
//   .toLowerCase();
// const CUSTOMER_EMAIL = (process.env.SEED_CUSTOMER_EMAIL ?? "user@luxai.test")
//   .trim()
//   .toLowerCase();
// const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "LuxAI@1234";

// async function upsertUser(email: string, name: string) {
//   const existingUser = await prisma.appUser.findFirst({
//     where: { email },
//     select: { id: true, email: true, name: true },
//   });

//   if (existingUser) return existingUser;

//   const passwordHash = await import("bcryptjs").then((m) =>
//     m.default.hash(DEFAULT_PASSWORD, 10)
//   );
//   return await prisma.appUser.create({
//     data: {
//       email,
//       name,
//       passwordHash,
//     },
//   });
// }

// async function main() {
//   const o = await prisma.org.findFirst({
//     where: { name: ORG_NAME },
//     select: { id: true },
//   });
//   if (!o) throw new Error("Org not found");
//   const orgId = o.id;

//   const adminUser = await upsertUser(ADMIN_EMAIL, "Lux AI Admin");
//   const customerUser = await upsertUser(CUSTOMER_EMAIL, "Lux AI Customer");

//   await prisma.orgMember.createMany({
//     data: [
//       { orgId, userId: adminUser.id, role: "admin" },
//       { orgId, userId: customerUser.id, role: "customer" },
//     ],
//     skipDuplicates: true,
//   });

//   console.log("✅ Seeded org members", {
//     orgId,
//     adminEmail: ADMIN_EMAIL,
//     customerEmail: CUSTOMER_EMAIL,
//   });
// }

// main()
//   .then(() => process.exit(0))
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });
