// import { config } from "dotenv";
// config({ path: ".env.local", override: true });

// import { DateTime } from "luxon";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// const ORG_NAME =
//   process.env.SEED_ORG_NAME ?? "Lux AI Consultancy & Automation";
// const STAFF_EMAIL = (process.env.SEED_STAFF_EMAIL ?? "staff@luxai.test")
//   .trim()
//   .toLowerCase();

// // pick one meeting type by key (stable)
// const MEETING_TYPE_KEY = "discovery_call"; // or "automation_audit"

// // create up to 10 appointments inside next 7 working hours (08:00–17:00 Europe/Luxembourg)
// const TIMEZONE = "Europe/Luxembourg";
// const WORK_START = { hour: 8, minute: 0 };
// const WORK_END = { hour: 17, minute: 0 };
// const DURATION_MIN = 30;
// const MAX_APPOINTMENTS = 10;
// const WORKING_HOURS_TO_FILL = 7; // next 7 working hours

// const CUSTOMER_IDS = Array.from({ length: MAX_APPOINTMENTS }).map(
//   (_, i) => `00000000-0000-0000-0000-${(i + 1).toString().padStart(12, "0")}`
// );

// function isWorkingDay(dt: DateTime) {
//   return dt.weekday >= 1 && dt.weekday <= 5; // Mon–Fri
// }

// function clampToWorkingWindow(dt: DateTime) {
//   const start = dt.set({ ...WORK_START, second: 0, millisecond: 0 });
//   const end = dt.set({ ...WORK_END, second: 0, millisecond: 0 });
//   if (dt < start) return start;
//   if (dt > end) return end;
//   return dt;
// }

// async function main() {
//   // 1) Find orgId
//   const orgRow = await prisma.org.findFirst({
//     where: { name: ORG_NAME },
//     select: { id: true },
//   });
//   if (!orgRow) throw new Error(`Org not found by name: ${ORG_NAME}`);
//   const orgId = orgRow.id;

//   const staffUser = await prisma.appUser.findFirst({
//     where: { email: STAFF_EMAIL },
//     select: { id: true },
//   });
//   if (!staffUser)
//     throw new Error(`Staff user not found by email: ${STAFF_EMAIL}`);

//   // 2) Find meetingTypeId by stable key
//   const mtRow = await prisma.meetingType.findFirst({
//     where: { orgId, key: MEETING_TYPE_KEY },
//     select: { id: true },
//   });

//   if (!mtRow)
//     throw new Error(
//       `Meeting type not found: key=${MEETING_TYPE_KEY} for orgId=${orgId}`
//     );
//   const meetingTypeId = mtRow.id;

//   // 3) Build appointments starting from "now" in Luxembourg time,
//   // within next 7 working hours (across days if needed)
//   const now = DateTime.now().setZone(TIMEZONE);

//   let cursor = clampToWorkingWindow(now);
//   let created = 0;
//   let remainingWorkingMinutes = WORKING_HOURS_TO_FILL * 60;

//   const rows: Array<{
//     orgId: string;
//     userId: string;
//     staffUserId: string;
//     meetingTypeId: string;
//     status: "confirmed";
//     mode: "google_meet";
//     startAtUtc: Date;
//     endAtUtc: Date;
//     notes: string;
//   }> = [];

//   while (
//     created < MAX_APPOINTMENTS &&
//     remainingWorkingMinutes >= DURATION_MIN
//   ) {
//     // move to next working day if weekend
//     if (!isWorkingDay(cursor)) {
//       cursor = cursor
//         .plus({ days: 1 })
//         .startOf("day")
//         .setZone(TIMEZONE)
//         .set(WORK_START);
//       continue;
//     }

//     const dayStart = cursor.startOf("day").setZone(TIMEZONE).set(WORK_START);
//     const dayEnd = cursor.startOf("day").setZone(TIMEZONE).set(WORK_END);

//     // if past working hours, jump to next day 08:00
//     if (cursor >= dayEnd) {
//       cursor = cursor
//         .plus({ days: 1 })
//         .startOf("day")
//         .setZone(TIMEZONE)
//         .set(WORK_START);
//       continue;
//     }

//     // ensure we start no earlier than today 08:00
//     if (cursor < dayStart) cursor = dayStart;

//     // if this slot would exceed the working window, go to next day
//     const endLocal = cursor.plus({ minutes: DURATION_MIN });
//     if (endLocal > dayEnd) {
//       cursor = cursor
//         .plus({ days: 1 })
//         .startOf("day")
//         .setZone(TIMEZONE)
//         .set(WORK_START);
//       continue;
//     }

//     rows.push({
//       id: crypto.randomUUID(),
//       orgId,
//       userId: CUSTOMER_IDS[created],
//       staffUserId: staffUser.id,
//       meetingTypeId,
//       status: "confirmed",
//       mode: "google_meet",
//       startAtUtc: cursor.toUTC().toJSDate(),
//       endAtUtc: endLocal.toUTC().toJSDate(),
//       notes: "Seeded test appointment",
//     });

//     created++;
//     remainingWorkingMinutes -= DURATION_MIN;
//     cursor = cursor.plus({ minutes: DURATION_MIN });
//   }

//   if (rows.length === 0) {
//     console.log("ℹ️ No appointments to insert (no working window available)");
//     return;
//   }

//   await prisma.appointment.createMany({ data: rows });

//   console.log(`✅ Seeded ${rows.length} appointments`, {
//     orgId,
//     meetingTypeId,
//     staffUserId: staffUser.id,
//   });
// }

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error("Failed to seed appointments", err);
//     process.exit(1);
//   });
