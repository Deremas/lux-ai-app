// import { PrismaClient, Prisma } from "@prisma/client";
// import { config } from "dotenv";
// import bcrypt from "bcryptjs";
// import { DateTime } from "luxon";
// import crypto from "crypto";

// config({ path: ".env.local" });

// const prisma = new PrismaClient();

// async function main() {
//   // 1) Create/find org
//   const orgName =
//     process.env.SEED_ORG_NAME ?? "Lux AI Consultancy & Automation";

//   const existingOrg = await prisma.org.findFirst({ where: { name: orgName } });
//   const orgRow =
//     existingOrg ??
//     (await prisma.org.create({
//       data: { id: crypto.randomUUID(), name: orgName },
//     }));

//   // 2) Ensure settings exist
//   const settingsExisting = await prisma.orgSettings.findFirst({
//     where: { orgId: orgRow.id },
//     select: { id: true },
//   });

//   if (!settingsExisting) {
//     await prisma.orgSettings.create({
//       data: {
//         id: crypto.randomUUID(),
//         orgId: orgRow.id,
//         approvalPolicy: "REQUIRES_APPROVAL",
//         paymentPolicy: "FREE",
//         defaultLocale: "en",
//         defaultTz: "Europe/Luxembourg",
//         notifyEmails: [],
//         defaultPaymentCents: 15000,
//         defaultCurrency: "EUR",
//         workingHours: {
//           timezone: "Europe/Luxembourg",
//           slotStepMin: 60,
//           bufferMin: 0,
//           week: {
//             mon: [{ start: "08:00", end: "17:00" }],
//             tue: [{ start: "08:00", end: "17:00" }],
//             wed: [{ start: "08:00", end: "17:00" }],
//             thu: [{ start: "08:00", end: "17:00" }],
//             fri: [{ start: "08:00", end: "17:00" }],
//             sat: [],
//             sun: [],
//           },
//         },
//       },
//     });
//   }

//   // 2b) Seed admin + staff users and org membership
//   const adminEmail = (
//     process.env.SEED_ADMIN_EMAIL ??
//     process.env.CONTACT_TO_EMAIL ??
//     "admin@luxai.test"
//   )
//     .trim()
//     .toLowerCase();
//   const staffEmail = (process.env.SEED_STAFF_EMAIL ?? "staff@luxai.test")
//     .trim()
//     .toLowerCase();
//   const defaultPassword = process.env.SEED_PASSWORD ?? "LuxAI@1234";
//   const adminName = process.env.SEED_ADMIN_NAME ?? "Lux AI Admin";
//   const staffName = process.env.SEED_STAFF_NAME ?? "Lux AI Staff";

//   async function upsertUser(email: string, name: string) {
//     const existingUser = await prisma.appUser.findFirst({
//       where: { email },
//       select: { id: true, email: true, name: true },
//     });

//     const passwordHash = await bcrypt.hash(defaultPassword, 10);
//     if (existingUser) {
//       // Keep seed logins consistent in dev by ensuring the seeded password matches.
//       return await prisma.appUser.update({
//         where: { id: existingUser.id },
//         data: {
//           name: existingUser.name ?? name,
//           passwordHash,
//         },
//         select: { id: true, email: true, name: true },
//       });
//     }
//     const inserted = await prisma.appUser.create({
//       data: {
//         id: crypto.randomUUID(),
//         email,
//         name,
//         passwordHash,
//       },
//     });

//     return inserted;
//   }

//   const adminUser = await upsertUser(adminEmail, adminName);
//   const staffUser = await upsertUser(staffEmail, staffName);

//   async function upsertMember(userId: string, role: "admin" | "staff") {
//     const existingMember = await prisma.orgMember.findFirst({
//       where: { orgId: orgRow.id, userId },
//       select: { id: true },
//     });

//     if (existingMember) return;
//     await prisma.orgMember.create({
//       data: { id: crypto.randomUUID(), orgId: orgRow.id, userId, role },
//     });
//   }

//   await upsertMember(adminUser.id, "admin");
//   await upsertMember(staffUser.id, "staff");

//   const DEFAULT_WORKING_HOURS = {
//     timezone: "Europe/Luxembourg",
//     slotStepMin: 60,
//     bufferMin: 0,
//     week: {
//       mon: [{ start: "08:00", end: "17:00" }],
//       tue: [{ start: "08:00", end: "17:00" }],
//       wed: [{ start: "08:00", end: "17:00" }],
//       thu: [{ start: "08:00", end: "17:00" }],
//       fri: [{ start: "08:00", end: "17:00" }],
//       sat: [],
//       sun: [],
//     },
//   };

//   // Ensure org settings include working hours defaults
//   await prisma.orgSettings.updateMany({
//     where: { orgId: orgRow.id, workingHours: { equals: Prisma.DbNull } },
//     data: { workingHours: DEFAULT_WORKING_HOURS },
//   });

//   // Ensure a staff calendar exists for the seeded staff user
//   const existingStaffCal = await prisma.staffCalendar.findFirst({
//     where: { orgId: orgRow.id, staffUserId: staffUser.id },
//     select: { id: true },
//   });
//   if (!existingStaffCal) {
//     await prisma.staffCalendar.create({
//       data: {
//         id: crypto.randomUUID(),
//         orgId: orgRow.id,
//         staffUserId: staffUser.id,
//         isActive: true,
//         workingHours: DEFAULT_WORKING_HOURS,
//       },
//     });
//   }

//   // Helper to upsert meeting types by key
//   async function upsertMeetingType(input: {
//     key: string;
//     durationMin: number;
//     requiresPayment?: boolean;
//     priceCents?: number | null;
//     currency?: string | null;
//     modes: Array<"google_meet" | "zoom" | "phone" | "in_person">;
//     translations: Record<
//       "en" | "fr" | "de" | "lb",
//       { title: string; description?: string }
//     >;
//   }) {
//     const mtExisting = await prisma.meetingType.findFirst({
//       where: { orgId: orgRow.id, key: input.key },
//     });

//     const mt =
//       mtExisting ??
//       (await prisma.meetingType.create({
//         data: {
//           id: crypto.randomUUID(),
//           orgId: orgRow.id,
//           key: input.key,
//           durationMin: input.durationMin,
//           requiresPayment: input.requiresPayment ?? false,
//           priceCents: input.priceCents ?? null,
//           currency: input.currency ?? null,
//           isActive: true,
//         },
//       }));

//     if (input.modes.length) {
//       await prisma.meetingTypeMode.createMany({
//         data: input.modes.map((mode) => ({
//           id: crypto.randomUUID(),
//           meetingTypeId: mt.id,
//           mode,
//         })),
//         skipDuplicates: true,
//       });
//     }

//     const translations = (["en", "fr", "de", "lb"] as const).map((locale) => {
//       const t = input.translations[locale];
//       return {
//         id: crypto.randomUUID(),
//         meetingTypeId: mt.id,
//         locale,
//         title: t.title,
//         description: t.description ?? null,
//       };
//     });
//     await prisma.meetingTypeTranslation.createMany({
//       data: translations,
//       skipDuplicates: true,
//     });

//     return mt;
//   }

//   // 3) Seed meeting types
//   await upsertMeetingType({
//     key: "discovery_call",
//     durationMin: 60,
//     modes: ["google_meet", "zoom", "phone", "in_person"],
//     requiresPayment: true,
//     priceCents: 15000,
//     currency: "EUR",
//     translations: {
//       en: {
//         title: "Discovery Call (30 min)",
//         description:
//           "Intro call to understand your needs and propose next steps.",
//       },
//       fr: {
//         title: "Appel découverte (30 min)",
//         description:
//           "Appel d’introduction pour comprendre vos besoins et proposer les prochaines étapes.",
//       },
//       de: {
//         title: "Erstgespräch (30 Min.)",
//         description:
//           "Kurzes Kennenlerngespräch, um Ihre Anforderungen zu verstehen und nächste Schritte zu definieren.",
//       },
//       lb: {
//         title: "Entdeckungsruff (30 Minutten)",
//         description:
//           "Kuerzen Kenneléieren-Ruff fir Är Besoinen ze verstoen an déi nächst Schrëtt ze plangen.",
//       },
//     },
//   });

//   await upsertMeetingType({
//     key: "automation_audit",
//     durationMin: 60,
//     modes: ["google_meet", "zoom", "phone", "in_person"],
//     requiresPayment: true,
//     priceCents: 25000,
//     currency: "EUR",
//     translations: {
//       en: {
//         title: "Automation Audit (60 min)",
//         description:
//           "Deep dive into your workflows to identify automation opportunities.",
//       },
//       fr: {
//         title: "Audit d’automatisation (60 min)",
//         description:
//           "Analyse approfondie de vos processus pour identifier des opportunités d’automatisation.",
//       },
//       de: {
//         title: "Automatisierungs-Audit (60 Min.)",
//         description:
//           "Tiefgehende Analyse Ihrer Abläufe zur Identifikation von Automatisierungspotenzial.",
//       },
//       lb: {
//         title: "Automatiséierungs-Audit (60 Minutten)",
//         description:
//           "Déifgräifend Analyse vun Äre Workflows fir Automatiséierungsméiglechkeeten ze fannen.",
//       },
//     },
//   });

//   // 4) Seed appointments across last 30 days + next 60 days
//   const settingsRow = await prisma.orgSettings.findFirst({
//     where: { orgId: orgRow.id },
//     select: { defaultTz: true },
//   });

//   const timezone = settingsRow?.defaultTz ?? "Europe/Luxembourg";
//   const meetingTypes = await prisma.meetingType.findMany({
//     where: { orgId: orgRow.id },
//     select: { id: true, durationMin: true },
//   });

//   const statuses = [
//     "pending",
//     "confirmed",
//     "declined",
//     "completed",
//   ] as const;

//   const targetCount = 36;
//   const startWindow = DateTime.now().setZone(timezone).minus({ days: 30 });
//   const endWindow = DateTime.now().setZone(timezone).plus({ days: 60 });

//   const daySlots = [
//     { hour: 9, minute: 0 },
//     { hour: 10, minute: 0 },
//     { hour: 11, minute: 0 },
//     { hour: 14, minute: 0 },
//     { hour: 15, minute: 0 },
//   ];

//   const apptRows: Array<{
//     id: string;
//     orgId: string;
//     userId: string;
//     staffUserId: string;
//     meetingTypeId: string;
//     status: (typeof statuses)[number];
//     mode: "google_meet" | "phone" | "in_person" | "zoom";
//     startAtUtc: Date;
//     endAtUtc: Date;
//     notes: string;
//   }> = [];

//   // Pre-create a pool of customer users so appointments have valid FKs
//   const customerUsers: Array<{ id: string }> = [];
//   for (let i = 1; i <= 24; i += 1) {
//     const email = `customer${i}@luxai.test`;
//     const existing = await prisma.appUser.findFirst({
//       where: { email },
//       select: { id: true },
//     });
//     if (existing) {
//       customerUsers.push(existing);
//       continue;
//     }
//     const passwordHash = await bcrypt.hash(defaultPassword, 10);
//     const created = await prisma.appUser.create({
//       data: {
//         id: crypto.randomUUID(),
//         email,
//         name: `Lux AI Customer ${i}`,
//         passwordHash,
//       },
//       select: { id: true },
//     });
//     customerUsers.push(created);
//   }

//   let cursor = startWindow.startOf("day");
//   let idx = 0;

//   while (cursor <= endWindow && apptRows.length < targetCount) {
//     const weekday = cursor.weekday; // 1=Mon..7=Sun
//     if (weekday <= 5) {
//       for (const slot of daySlots) {
//         if (apptRows.length >= targetCount) break;
//         const mt = meetingTypes[idx % meetingTypes.length];
//         if (!mt) break;

//         const startLocal = cursor.set({
//           hour: slot.hour,
//           minute: slot.minute,
//           second: 0,
//           millisecond: 0,
//         });
//         const endLocal = startLocal.plus({ minutes: mt.durationMin });

//         const customer = customerUsers[idx % customerUsers.length];
//         apptRows.push({
//           id: crypto.randomUUID(),
//           orgId: orgRow.id,
//           userId: customer.id,
//           staffUserId: staffUser.id,
//           meetingTypeId: mt.id,
//           status: statuses[idx % statuses.length],
//           mode: idx % 2 === 0 ? "google_meet" : "phone",
//           startAtUtc: startLocal.toUTC().toJSDate(),
//           endAtUtc: endLocal.toUTC().toJSDate(),
//           notes: `Seeded appointment (${statuses[idx % statuses.length]})`,
//         });

//         idx += 1;
//       }
//     }
//     cursor = cursor.plus({ days: 1 });
//   }

//   const internationalTzs = [
//     "Europe/London",
//     "Europe/Berlin",
//     "Europe/Luxembourg",
//     "Asia/Dubai",
//     "Asia/Kolkata",
//     "Asia/Singapore",
//     "Asia/Tokyo",
//     "America/New_York",
//     "America/Chicago",
//     "America/Los_Angeles",
//   ];

//   for (let i = 0; i < internationalTzs.length; i += 1) {
//     const tz = internationalTzs[i];
//     const baseDate = DateTime.now()
//       .setZone(tz)
//       .plus({ days: i + 1 });
//     const mt = meetingTypes[(idx + i) % meetingTypes.length];
//     if (!mt) break;

//     const startLocal = baseDate.set({
//       hour: daySlots[i % daySlots.length].hour,
//       minute: daySlots[i % daySlots.length].minute,
//       second: 0,
//       millisecond: 0,
//     });
//     const endLocal = startLocal.plus({ minutes: mt.durationMin });
//     const status = statuses[(idx + i) % statuses.length];

//     const customer = customerUsers[(idx + i) % customerUsers.length];
//     apptRows.push({
//       id: crypto.randomUUID(),
//       orgId: orgRow.id,
//       userId: customer.id,
//       staffUserId: staffUser.id,
//       meetingTypeId: mt.id,
//       status,
//       mode: i % 2 === 0 ? "google_meet" : "phone",
//       startAtUtc: startLocal.toUTC().toJSDate(),
//       endAtUtc: endLocal.toUTC().toJSDate(),
//       notes: `Seeded appointment (${status})\nbooker_tz=${tz}`,
//     });
//   }

//   if (apptRows.length > 0) {
//     await prisma.appointment.createMany({ data: apptRows });
//   }

//   console.log("✅ Seed complete:", {
//     orgId: orgRow.id,
//     orgName,
//     adminEmail,
//     staffEmail,
//     password: defaultPassword,
//     appointments: apptRows.length,
//   });
// }

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error("❌ Seed failed", err);
//     process.exit(1);
//   });
