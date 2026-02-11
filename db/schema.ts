import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";
import { generateUuidV7 } from "@/lib/uuid";

export const localeEnum = pgEnum("locale", ["en", "fr", "de", "lb"]);

// -------------------- Enums --------------------

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "declined",
  "completed",
]);

export const approvalPolicyEnum = pgEnum("approval_policy", [
  "AUTO_APPROVE",
  "REQUIRES_APPROVAL",
]);

export const paymentPolicyEnum = pgEnum("payment_policy", [
  "FREE",
  "PAY_BEFORE_CONFIRM",
  "APPROVE_THEN_PAY",
]);

export const meetingModeEnum = pgEnum("meeting_mode", [
  "google_meet",
  "zoom",
  "phone",
  "in_person",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "whatsapp",
  "calendar",
]);

// -------------------- Users (NextAuth credentials) --------------------
export const appUser = pgTable(
  "app_user",
  {
    id: uuid("id").defaultRandom().primaryKey(), // fallback to .defaultRandom() for runtime UUIDv7
    name: text("name"),
    phone: text("phone"),
    timezone: text("timezone"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameUnique: uniqueIndex("app_user_name_unique").on(t.name),
  }),
);

// -------------------- Org --------------------
export const org = pgTable("org", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orgSettings = pgTable(
  "org_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => org.id, { onDelete: "cascade" }),

    approvalPolicy: approvalPolicyEnum("approval_policy")
      .default("REQUIRES_APPROVAL")
      .notNull(),
    paymentPolicy: paymentPolicyEnum("payment_policy")
      .default("FREE")
      .notNull(),

    defaultLocale: localeEnum("default_locale").default("en").notNull(),
    defaultTz: text("default_tz").default("Europe/Luxembourg").notNull(),

    // MVP: comma-separated list; later: JSONB
    notifyEmails: text("notify_emails"),
    workingHoursJson: text("working_hours_json"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orgIdUnique: uniqueIndex("org_settings_org_id_unique").on(t.orgId),
  }),
);

export const orgMember = pgTable(
  "org_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),

    // Supabase auth.users.id (UUID)
    userId: uuid("user_id").notNull(),

    // "admin" | "staff" | "customer" (keep text for flexibility)
    role: text("role").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orgUserUnique: uniqueIndex("org_member_org_user_unique").on(
      t.orgId,
      t.userId,
    ),
    userIdx: index("org_member_user_idx").on(t.userId),
  }),
);

// -------------------- Booking profile --------------------
export const bookingProfile = pgTable(
  "booking_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // optional (last-used org); must exist if provided
    orgId: uuid("org_id").references(() => org.id, { onDelete: "set null" }),

    userId: uuid("user_id").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    company: text("company"),
    companyRole: text("company_role"),
    timezone: text("timezone").notNull(),
    notes: text("notes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("booking_profile_user_unique").on(t.userId),
    userIdx: index("booking_profile_user_idx").on(t.userId),
  }),
);

// -------------------- Password reset --------------------
export const passwordReset = pgTable(
  "password_reset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    tokenUnique: uniqueIndex("password_reset_token_unique").on(t.token),
    userIdx: index("password_reset_user_idx").on(t.userId),
  }),
);

// -------------------- Email verification (pre-signup) --------------------
export const emailVerification = pgTable(
  "email_verification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    emailUnique: uniqueIndex("email_verification_email_unique").on(t.email),
    tokenUnique: uniqueIndex("email_verification_token_unique").on(t.token),
  }),
);

// -------------------- Meeting types + i18n --------------------
export const meetingType = pgTable(
  "meeting_type",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    heading: text("heading").notNull(),
    subheading: text("subheading"),
    description: text("description"),
    pricePolicy: paymentPolicyEnum("price_policy").default("FREE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameUnique: uniqueIndex("meeting_type_name_unique").on(t.name),
  }),
);

export const meetingTypeTranslation = pgTable(
  "meeting_type_translation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingTypeId: uuid("meeting_type_id")
      .notNull()
      .references(() => meetingType.id, { onDelete: "cascade" }),

    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
  },
  (t) => ({
    mtLocaleUnique: uniqueIndex("meeting_type_translation_mt_locale_unique").on(
      t.meetingTypeId,
      t.locale,
    ),
    localeIdx: index("meeting_type_translation_locale_idx").on(t.locale),
  }),
);

export const meetingTypeMode = pgTable(
  "meeting_type_mode",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingTypeId: uuid("meeting_type_id")
      .notNull()
      .references(() => meetingType.id, { onDelete: "cascade" }),

    mode: meetingModeEnum("mode").notNull(),
  },
  (t) => ({
    mtModeUnique: uniqueIndex("meeting_type_mode_mt_mode_unique").on(
      t.meetingTypeId,
      t.mode,
    ),
  }),
);

// -------------------- Staff calendar --------------------
export const staffCalendar = pgTable(
  "staff_calendar",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    staffUserId: uuid("staff_user_id").notNull(),
    googleCalendarId: text("google_calendar_id"),
    isActive: boolean("is_active").default(true).notNull(),
    workingHoursJson: text("working_hours_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orgStaffUnique: uniqueIndex("staff_calendar_org_staff_unique").on(
      t.orgId,
      t.staffUserId,
    ),
    staffIdx: index("staff_calendar_staff_idx").on(t.staffUserId),
  }),
);

// -------------------- Blocked/blackout times --------------------
export const blockedTime = pgTable(
  "blocked_time",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    staffUserId: uuid("staff_user_id"),
    startAtUtc: timestamp("start_at_utc", { withTimezone: true }).notNull(),
    endAtUtc: timestamp("end_at_utc", { withTimezone: true }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orgStartIdx: index("blocked_time_org_start_idx").on(t.orgId, t.startAtUtc),
    staffStartIdx: index("blocked_time_staff_start_idx").on(
      t.staffUserId,
      t.startAtUtc,
    ),
  }),
);

// -------------------- Appointments --------------------
export const appointment = pgTable(
  "appointment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    staffUserId: uuid("staff_user_id"),
    meetingTypeId: uuid("meeting_type_id")
      .notNull()
      .references(() => meetingType.id, { onDelete: "restrict" }),
    status: appointmentStatusEnum("status").default("pending").notNull(),
    mode: meetingModeEnum("mode").notNull(),
    joinLink: text("join_link"),
    startAtUtc: timestamp("start_at_utc", { withTimezone: true }).notNull(),
    endAtUtc: timestamp("end_at_utc", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orgStartIdx: index("appointment_org_start_idx").on(t.orgId, t.startAtUtc),
    userStartIdx: index("appointment_user_start_idx").on(
      t.userId,
      t.startAtUtc,
    ),
    staffStartIdx: index("appointment_staff_start_idx").on(
      t.staffUserId,
      t.startAtUtc,
    ),
  }),
);

// -------------------- Notification logs --------------------
export const notificationLog = pgTable(
  "notification_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    toAddress: text("to_address"),
    templateKey: text("template_key"),
    status: text("status").notNull(),
    providerMsgId: text("provider_msg_id"),
    error: text("error"),
    seen: boolean("seen").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    apptCreatedIdx: index("notification_log_appt_created_idx").on(
      t.appointmentId,
      t.createdAt,
    ),
  }),
);

// -------------------- Audit logs --------------------
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    orgCreatedIdx: index("audit_log_org_created_idx").on(t.orgId, t.createdAt),
    entityIdx: index("audit_log_entity_idx").on(t.entityType, t.entityId),
  }),
);

// -------------------- Knowledge base documents --------------------
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    createdAtIdx: index("documents_created_at_idx").on(t.createdAt),
  }),
);

// -------------------- Meeting Modes --------------------
export const meetingMode = pgTable(
  "meeting_mode",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    details: text("details"),
    meetingTypeId: uuid("meeting_type_id").references(() => meetingType.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameUnique: uniqueIndex("meeting_mode_name_unique").on(t.name),
  }),
);

// Add a new table for staff assignments
export const staffAssignment = pgTable(
  "staff_assignment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => orgMember.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    staffAppointmentUnique: uniqueIndex(
      "staff_assignment_staff_appointment_unique",
    ).on(t.staffId, t.appointmentId),
  }),
);
