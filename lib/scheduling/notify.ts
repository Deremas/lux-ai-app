// lib/scheduling/notify.ts
import "server-only";
import crypto from "crypto";
import { Resend } from "resend";
import { DateTime } from "luxon";
import { render } from "@react-email/render";

import { prisma } from "@/lib/prisma";
import BookingCreatedEmail from "@/emails/scheduling/BookingCreatedEmail";
import BookingCreatedInternalEmail from "@/emails/scheduling/BookingCreatedInternalEmail";
import BookingStatusEmail from "@/emails/scheduling/BookingStatusEmail";
import BookingStatusInternalEmail from "@/emails/scheduling/BookingStatusInternalEmail";
import RescheduleRequestEmail from "@/emails/scheduling/RescheduleRequestEmail";
import { getMeetingLink } from "@/lib/scheduling/meeting-link";
import { decryptSecret } from "@/lib/security/secret-crypto";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeRender(
  componentOrFactory: React.ReactElement | (() => React.ReactElement),
  fallbackText: string
) {
  try {
    if (!componentOrFactory) {
      return `<pre style=\"font-family:monospace\">${escapeHtml(
        fallbackText
      )}</pre>`;
    }
    const component =
      typeof componentOrFactory === "function"
        ? componentOrFactory()
        : componentOrFactory;
    if (!component) {
      return `<pre style=\"font-family:monospace\">${escapeHtml(
        fallbackText
      )}</pre>`;
    }
    return render(component);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "render failed";
    console.error("email render failed", message);
    return `<pre style="font-family:monospace">${escapeHtml(fallbackText)}</pre>`;
  }
}

function getBaseUrl() {
  const env = process.env.NEXTAUTH_URL;
  return env?.replace(/\/+$/, "") || "";
}

function formatIcsUtc(dtIso: string) {
  return DateTime.fromISO(dtIso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function toIsoUtc(value: Date | string | null | undefined) {
  if (!value) return "";
  const dt = value instanceof Date ? value : new Date(value);
  const iso = DateTime.fromJSDate(dt).toUTC().toISO();
  return iso ?? "";
}

function buildGoogleCalendarUrl(args: {
  title: string;
  details: string;
  startUtc: string;
  endUtc: string;
}) {
  if (!args.startUtc || !args.endUtc) return null;
  const start = formatIcsUtc(args.startUtc);
  const end = formatIcsUtc(args.endUtc);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    details: args.details,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function normalizeRecipients(primary: string | null, notifyEmails: string[] | null) {
  const recipients = new Set<string>();
  if (typeof primary === "string" && primary.trim()) recipients.add(primary.trim());
  if (typeof process.env.CONTACT_TO_EMAIL === "string" && process.env.CONTACT_TO_EMAIL.trim()) {
    recipients.add(process.env.CONTACT_TO_EMAIL.trim());
  }
  if (Array.isArray(notifyEmails)) {
    notifyEmails
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((email) => recipients.add(email));
  }
  return Array.from(recipients);
}

function normalizeSingleRecipient(email: string | null | undefined) {
  if (typeof email !== "string") return [];
  const trimmed = email.trim();
  return trimmed ? [trimmed] : [];
}

async function logNotification(params: {
  appointmentId: string;
  channel: "email" | "whatsapp" | "calendar";
  toAddress: string | null;
  templateKey: string;
  status: "queued" | "sent" | "failed";
  error?: string | null;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        id: crypto.randomUUID(),
        appointmentId: params.appointmentId,
        channel: params.channel,
        toAddress: params.toAddress,
        templateKey: params.templateKey,
        status: params.status,
        error: params.error ?? null,
      },
    });
  } catch (err) {
    console.error("logNotification failed", {
      appointmentId: params.appointmentId,
      templateKey: params.templateKey,
      status: params.status,
      error: err instanceof Error ? err.message : err,
    });
  }
}

async function deliverEmail(params: {
  appointmentId: string;
  templateKey: string;
  subject: string;
  text: string;
  html: string;
  to: string[];
  attachments?: Array<{ filename: string; content: string }>;
  skipLog?: boolean;
}) {
  const cleanedTo = params.to.filter((value) => typeof value === "string" && value.trim());
  const subject = typeof params.subject === "string" ? params.subject : "Notification";
  const text = typeof params.text === "string" ? params.text : "";
  const html = typeof params.html === "string" ? params.html : "";
  const toAddress = cleanedTo.join(", ");
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM_EMAIL) {
    if (!params.skipLog) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress,
        templateKey: params.templateKey,
        status: "failed",
        error: "Email not configured",
      });
    }
    return;
  }

  if (cleanedTo.length === 0) {
    if (!params.skipLog) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: params.templateKey,
        status: "failed",
        error: "No recipients",
      });
    }
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    console.log("deliverEmail sending", {
      appointmentId: params.appointmentId,
      templateKey: params.templateKey,
      toCount: cleanedTo.length,
      hasSubject: Boolean(subject),
      hasText: Boolean(text),
      hasHtml: Boolean(html),
    });
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL,
      to: cleanedTo,
      subject,
      text,
      html,
      ...(params.attachments?.length ? { attachments: params.attachments } : {}),
    });
    if (!params.skipLog) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress,
        templateKey: params.templateKey,
        status: "sent",
      });
    }
  } catch (err: unknown) {
    const error =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
    if (!params.skipLog) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress,
        templateKey: params.templateKey,
        status: "failed",
        error,
      });
    }
    throw err;
  }
}

async function getAppointmentEmailContext(appointmentId: string) {
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    include: {
      meetingType: true,
    },
  });

  if (!appt) return null;

  const [user, profile, settings] = await Promise.all([
    prisma.appUser.findFirst({
      where: { id: appt.userId },
      select: { email: true, name: true, phone: true, timezone: true },
    }),
    prisma.bookingProfile.findFirst({
      where: { userId: appt.userId },
      select: {
        fullName: true,
        phone: true,
        company: true,
        companyRole: true,
        notes: true,
        timezone: true,
      },
    }),
    prisma.orgSettings.findFirst({
      where: { orgId: appt.orgId },
      select: {
        notifyEmails: true,
        notifyWhatsapp: true,
        notifyEmailEnabled: true,
        notifyWhatsappEnabled: true,
        notifyCalendarEnabled: true,
      },
    }),
  ]);

  return {
    id: appt.id,
    orgId: appt.orgId,
    status: appt.status,
    mode: appt.mode,
    startAtUtc: appt.startAtUtc,
    endAtUtc: appt.endAtUtc,
    staffUserId: appt.staffUserId,
    userEmail: user?.email ?? null,
    userName: user?.name ?? null,
    userPhone: profile?.phone ?? user?.phone ?? null,
    userFullName: profile?.fullName ?? null,
    userCompany: profile?.company ?? null,
    userCompanyRole: profile?.companyRole ?? null,
    userNotes: profile?.notes ?? null,
    userTimezone: profile?.timezone ?? user?.timezone ?? null,
    meetingKey: appt.meetingType?.key ?? null,
    meetingTitle: appt.meetingType?.key ?? null,
    notifyEmails: settings?.notifyEmails ?? null,
    notifyWhatsapp: settings?.notifyWhatsapp ?? null,
    notifyEmailEnabled: settings?.notifyEmailEnabled ?? true,
    notifyWhatsappEnabled: settings?.notifyWhatsappEnabled ?? false,
    notifyCalendarEnabled: settings?.notifyCalendarEnabled ?? false,
  };
}

function buildIcsContent(args: {
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
}) {
  const uid = `${crypto.randomUUID()}@luxai`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lux AI//Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date().toISOString())}`,
    `DTSTART:${formatIcsUtc(args.startUtc)}`,
    `DTEND:${formatIcsUtc(args.endUtc)}`,
    `SUMMARY:${args.title}`,
    `DESCRIPTION:${args.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

async function sendWhatsAppMessage(params: {
  orgId: string;
  appointmentId: string;
  to: string[];
  templateKey: string;
  body: string;
  skipLog?: boolean;
}) {
  const cleaned = params.to.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    if (!params.skipLog) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "whatsapp",
        toAddress: null,
        templateKey: params.templateKey,
        status: "failed",
        error: "No recipients",
      });
    }
    return;
  }

  const secretRow = await prisma.orgSecret.findFirst({
    where: { orgId: params.orgId },
  });
  const metaToken =
    decryptSecret(secretRow?.metaWhatsappTokenEnc) ||
    process.env.META_WHATSAPP_TOKEN;
  const metaPhoneId =
    decryptSecret(secretRow?.metaWhatsappPhoneIdEnc) ||
    process.env.META_WHATSAPP_PHONE_ID;
  const twilioSid =
    decryptSecret(secretRow?.twilioAccountSidEnc) ||
    process.env.TWILIO_ACCOUNT_SID;
  const twilioToken =
    decryptSecret(secretRow?.twilioAuthTokenEnc) ||
    process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom =
    decryptSecret(secretRow?.twilioWhatsappFromEnc) ||
    process.env.TWILIO_WHATSAPP_FROM;
  const telnyxApiKey =
    decryptSecret(secretRow?.telnyxApiKeyEnc) || process.env.TELNYX_API_KEY;
  const telnyxFrom =
    decryptSecret(secretRow?.telnyxWhatsappFromEnc) ||
    process.env.TELNYX_WHATSAPP_FROM;

  let provider: "meta" | "twilio" | "telnyx" | null = null;
  if (metaToken && metaPhoneId) provider = "meta";
  else if (twilioSid && twilioToken && twilioFrom) provider = "twilio";
  else if (telnyxApiKey && telnyxFrom) provider = "telnyx";

  if (!provider) {
    if (!params.skipLog) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "whatsapp",
        toAddress: cleaned.join(", "),
        templateKey: params.templateKey,
        status: "failed",
        error: "WhatsApp not configured",
      });
    }
    return;
  }

  for (const recipient of cleaned) {
    try {
      if (provider === "meta") {
        const url = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${metaToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: recipient.replace(/\s+/g, ""),
            type: "text",
            text: { body: params.body },
          }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "send failed");
          throw new Error(msg);
        }
      } else if (provider === "twilio") {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const body = new URLSearchParams({
          To: `whatsapp:${recipient.replace(/\s+/g, "")}`,
          From: `whatsapp:${twilioFrom}`,
          Body: params.body,
        });
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const res = await fetch(url, {
          method: "POST",
          headers: {
            authorization: `Basic ${auth}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body,
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "send failed");
          throw new Error(msg);
        }
      } else {
        const normalize = (value: string) =>
          value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
        const url = "https://api.telnyx.com/v2/messages";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${telnyxApiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: normalize(telnyxFrom as string),
            to: normalize(recipient.replace(/\s+/g, "")),
            text: params.body,
          }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "send failed");
          throw new Error(msg);
        }
      }

      if (!params.skipLog) {
        await logNotification({
          appointmentId: params.appointmentId,
          channel: "whatsapp",
          toAddress: recipient,
          templateKey: params.templateKey,
          status: "sent",
        });
      }
    } catch (err) {
      const error =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
      if (!params.skipLog) {
        await logNotification({
          appointmentId: params.appointmentId,
          channel: "whatsapp",
          toAddress: recipient,
          templateKey: params.templateKey,
          status: "failed",
          error,
        });
      }
    }
  }
}

export async function sendBookingEmails(params: { appointmentId: string }) {
  let stage = "start";
  try {
    stage = "load-context";
    const ctx = await getAppointmentEmailContext(params.appointmentId);
    if (!ctx) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: "booking_created",
        status: "failed",
        error: "Appointment not found",
      });
      return;
    }

    stage = "prepare-recipients";
    const userRecipients = normalizeSingleRecipient(ctx.userEmail);
    const staffEmail = ctx.staffUserId
      ? (
          await prisma.appUser.findFirst({
            where: { id: ctx.staffUserId },
            select: { email: true },
          })
        )?.email ?? null
      : null;
    const staffRecipients = normalizeRecipients(
      staffEmail,
      Array.isArray(ctx.notifyEmails) ? ctx.notifyEmails : null
    );
    stage = "prepare-times";
    const startIso = toIsoUtc(ctx.startAtUtc);
    const endIso = toIsoUtc(ctx.endAtUtc);
    stage = "meeting-link";
    const meetingLink =
      ctx.status === "confirmed"
        ? getMeetingLink({
            appointmentId: ctx.id,
            mode: ctx.mode,
          })
        : null;
    stage = "approval-link";
    const baseUrl = getBaseUrl();
    const approvalLink =
      ctx.status === "pending" && baseUrl
        ? `${baseUrl}/admin/scheduling/bookings?orgId=${ctx.orgId}`
        : null;
    let calendarLink: string | null = null;
    try {
      stage = "calendar-link";
      calendarLink = buildGoogleCalendarUrl({
        title: ctx.meetingTitle ?? ctx.meetingKey ?? "Lux AI Meeting",
        details: [
          `Mode: ${ctx.mode ?? "tbd"}`,
          meetingLink ? `Meeting link: ${meetingLink}` : "",
          ctx.userPhone ? `Phone: ${ctx.userPhone}` : "",
          ctx.userNotes ? `Notes: ${ctx.userNotes}` : "Lux AI meeting",
        ]
          .filter(Boolean)
          .join("\n"),
        startUtc: startIso,
        endUtc: endIso,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "calendar link failed";
      console.error("calendar link build failed", message);
      calendarLink = null;
    }

    stage = "render-user-email";
    const subject =
      ctx.status === "confirmed" ? "Booking confirmed" : "New booking received";
    const text = `A new booking was created.\n\nMeeting: ${ctx.meetingKey}\nMode: ${ctx.mode}\nStatus: ${ctx.status}\nStart (UTC): ${startIso}\nEnd (UTC): ${endIso}\n`;
    const html = safeRender(
      BookingCreatedEmail({
        name: ctx.userFullName ?? ctx.userName,
        meetingKey: ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting",
        mode: String(ctx.mode),
        status: String(ctx.status),
        startUtc: startIso,
        endUtc: endIso,
        meetingLink,
        phone: ctx.userPhone ?? null,
        calendarLink,
      }),
      text
    );

    const calendarDetails = [
      `Mode: ${ctx.mode ?? "tbd"}`,
      meetingLink ? `Meeting link: ${meetingLink}` : "",
      ctx.userPhone ? `Phone: ${ctx.userPhone}` : "",
      ctx.userNotes ? `Notes: ${ctx.userNotes}` : "Lux AI meeting",
    ]
      .filter(Boolean)
      .join("\n");
    const calendarIcs = ctx.notifyCalendarEnabled
      ? buildIcsContent({
          title: ctx.meetingTitle ?? ctx.meetingKey ?? "Lux AI Meeting",
          description: calendarDetails,
          startUtc: startIso,
          endUtc: endIso,
        })
      : null;

    if (ctx.notifyEmailEnabled && userRecipients.length > 0) {
      try {
        stage = "send-user-email";
        await deliverEmail({
          appointmentId: params.appointmentId,
          templateKey: "booking_created",
          subject,
          text,
          html,
          to: userRecipients,
          ...(calendarIcs
            ? { attachments: [{ filename: "booking.ics", content: calendarIcs }] }
            : {}),
        });
        if (ctx.notifyCalendarEnabled && calendarIcs) {
          await logNotification({
            appointmentId: params.appointmentId,
            channel: "calendar",
            toAddress: userRecipients.join(", "),
            templateKey: "calendar_invite",
            status: "sent",
          });
        }
      } catch (err) {
        console.error("deliverEmail booking_created failed", {
          appointmentId: params.appointmentId,
          error: err instanceof Error ? err.message : err,
        });
      }
    } else if (!ctx.notifyEmailEnabled) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: userRecipients.join(", "),
        templateKey: "booking_created",
        status: "failed",
        error: "Email notifications disabled",
      });
    } else {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: "booking_created",
        status: "failed",
        error: "No recipients",
      });
    }

    const staffText = `New booking created by ${ctx.userFullName ?? ctx.userName ?? "Customer"}.\n\nMeeting: ${ctx.meetingKey}\nMode: ${ctx.mode}\nStatus: ${ctx.status}\nStart (UTC): ${startIso}\nEnd (UTC): ${endIso}\nEmail: ${ctx.userEmail ?? "n/a"}\nPhone: ${ctx.userPhone ?? "n/a"}\n${approvalLink ? `Approval: ${approvalLink}\n` : ""}`;
    if (ctx.notifyEmailEnabled && staffRecipients.length > 0) {
      const staffHtml = safeRender(
        BookingCreatedInternalEmail({
          name: ctx.userFullName ?? ctx.userName,
          email: ctx.userEmail,
          phone: ctx.userPhone ?? null,
          meetingKey: ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting",
          mode: String(ctx.mode),
          status: String(ctx.status),
          startUtc: startIso,
          endUtc: endIso,
          meetingLink,
          approvalLink,
          calendarLink,
          userCompany: ctx.userCompany ?? null,
          userCompanyRole: ctx.userCompanyRole ?? null,
          userNotes: ctx.userNotes ?? null,
        }),
        staffText
      );

      try {
        stage = "send-staff-email";
        await deliverEmail({
          appointmentId: params.appointmentId,
          templateKey: "booking_created_internal",
          subject: "New booking received (staff)",
          text: staffText,
          html: staffHtml,
          to: staffRecipients,
          ...(calendarIcs
            ? { attachments: [{ filename: "booking.ics", content: calendarIcs }] }
            : {}),
        });
        if (ctx.notifyCalendarEnabled && calendarIcs) {
          await logNotification({
            appointmentId: params.appointmentId,
            channel: "calendar",
            toAddress: staffRecipients.join(", "),
            templateKey: "calendar_invite_internal",
            status: "sent",
          });
        }
      } catch (err) {
        console.error("deliverEmail booking_created_internal failed", {
          appointmentId: params.appointmentId,
          error: err instanceof Error ? err.message : err,
        });
      }
    } else if (!ctx.notifyEmailEnabled) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: staffRecipients.join(", "),
        templateKey: "booking_created_internal",
        status: "failed",
        error: "Email notifications disabled",
      });
    } else {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: "booking_created_internal",
        status: "failed",
        error: "No recipients",
      });
    }

    if (ctx.notifyWhatsappEnabled) {
      const customerPhone = ctx.userPhone ?? null;
      const staffPhones = Array.isArray(ctx.notifyWhatsapp) ? ctx.notifyWhatsapp : [];
      const customerMessage = `Your booking is ${ctx.status}. ${ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting"} · ${startIso} UTC.`;
      const staffMessage = `New booking from ${ctx.userFullName ?? ctx.userName ?? "Customer"}. ${ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting"} · ${startIso} UTC.`;
      if (customerPhone) {
        await sendWhatsAppMessage({
          orgId: ctx.orgId,
          appointmentId: params.appointmentId,
          to: [customerPhone],
          templateKey: "booking_created_whatsapp",
          body: customerMessage,
        });
      } else {
        await logNotification({
          appointmentId: params.appointmentId,
          channel: "whatsapp",
          toAddress: null,
          templateKey: "booking_created_whatsapp",
          status: "failed",
          error: "Customer phone missing",
        });
      }
      if (staffPhones.length > 0) {
        await sendWhatsAppMessage({
          orgId: ctx.orgId,
          appointmentId: params.appointmentId,
          to: staffPhones,
          templateKey: "booking_created_whatsapp_internal",
          body: staffMessage,
        });
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
    console.error("sendBookingEmails internal failed", {
      appointmentId: params.appointmentId,
      stage,
      error: message,
    });
    await logNotification({
      appointmentId: params.appointmentId,
      channel: "email",
      toAddress: null,
      templateKey: "booking_created",
      status: "failed",
      error: message,
    });
    return;
  }
}

export async function sendStatusEmails(params: {
  appointmentId: string;
  status: "confirmed" | "declined" | "canceled";
  reason?: string;
}) {
  let stage = "start";
  try {
    stage = "load-context";
    const ctx = await getAppointmentEmailContext(params.appointmentId);
    if (!ctx) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: `booking_${params.status}`,
        status: "failed",
        error: "Appointment not found",
      });
      return;
    }

    stage = "prepare-recipients";
    const userRecipients = normalizeSingleRecipient(ctx.userEmail);
    const staffEmail = ctx.staffUserId
      ? (
          await prisma.appUser.findFirst({
            where: { id: ctx.staffUserId },
            select: { email: true },
          })
        )?.email ?? null
      : null;
    const staffRecipients = normalizeRecipients(
      staffEmail,
      Array.isArray(ctx.notifyEmails) ? ctx.notifyEmails : null
    );
    stage = "prepare-times";
    const startIso = toIsoUtc(ctx.startAtUtc);
    const endIso = toIsoUtc(ctx.endAtUtc);
    stage = "meeting-link";
    const meetingLink =
      params.status === "confirmed"
        ? getMeetingLink({
            appointmentId: ctx.id,
            mode: ctx.mode,
          })
        : null;
    let calendarLink: string | null = null;
    try {
      stage = "calendar-link";
      calendarLink = buildGoogleCalendarUrl({
        title: ctx.meetingTitle ?? ctx.meetingKey ?? "Lux AI Meeting",
        details: [
          `Mode: ${ctx.mode ?? "tbd"}`,
          meetingLink ? `Meeting link: ${meetingLink}` : "",
          ctx.userPhone ? `Phone: ${ctx.userPhone}` : "",
          ctx.userNotes ? `Notes: ${ctx.userNotes}` : "Lux AI meeting",
        ]
          .filter(Boolean)
          .join("\n"),
        startUtc: startIso,
        endUtc: endIso,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "calendar link failed";
      console.error("calendar link build failed", message);
      calendarLink = null;
    }
    stage = "render-user-email";
    const subject =
      params.status === "confirmed"
        ? "Booking confirmed"
        : params.status === "declined"
        ? "Booking declined"
        : "Booking canceled";

    const text = `Your booking was ${params.status}.\n\nMeeting: ${ctx.meetingKey}\nMode: ${ctx.mode}\nStart (UTC): ${startIso}\nEnd (UTC): ${endIso}\n${params.reason ? `\nReason: ${params.reason}\n` : ""}`;
    const html = safeRender(
      () =>
        BookingStatusEmail({
          name: ctx.userFullName ?? ctx.userName,
          status: params.status,
          meetingKey: ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting",
          mode: String(ctx.mode),
          startUtc: startIso,
          endUtc: endIso,
          meetingLink,
          phone: ctx.userPhone ?? null,
          calendarLink,
          reason: params.reason ?? null,
        }),
      text
    );

    const calendarDetails = [
      `Mode: ${ctx.mode ?? "tbd"}`,
      meetingLink ? `Meeting link: ${meetingLink}` : "",
      ctx.userPhone ? `Phone: ${ctx.userPhone}` : "",
      ctx.userNotes ? `Notes: ${ctx.userNotes}` : "Lux AI meeting",
    ]
      .filter(Boolean)
      .join("\n");
    const calendarIcs = ctx.notifyCalendarEnabled
      ? buildIcsContent({
          title: ctx.meetingTitle ?? ctx.meetingKey ?? "Lux AI Meeting",
          description: calendarDetails,
          startUtc: startIso,
          endUtc: endIso,
        })
      : null;

    if (ctx.notifyEmailEnabled && userRecipients.length > 0) {
      try {
        stage = "send-user-email";
        await deliverEmail({
          appointmentId: params.appointmentId,
          templateKey: `booking_${params.status}`,
          subject,
          text,
          html,
          to: userRecipients,
          ...(calendarIcs
            ? { attachments: [{ filename: "booking.ics", content: calendarIcs }] }
            : {}),
        });
        if (ctx.notifyCalendarEnabled && calendarIcs) {
          await logNotification({
            appointmentId: params.appointmentId,
            channel: "calendar",
            toAddress: userRecipients.join(", "),
            templateKey: `calendar_${params.status}`,
            status: "sent",
          });
        }
      } catch (err) {
        console.error("deliverEmail status user failed", {
          appointmentId: params.appointmentId,
          status: params.status,
          error: err instanceof Error ? err.message : err,
        });
      }
    } else if (!ctx.notifyEmailEnabled) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: userRecipients.join(", "),
        templateKey: `booking_${params.status}`,
        status: "failed",
        error: "Email notifications disabled",
      });
    } else {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: `booking_${params.status}`,
        status: "failed",
        error: "No recipients",
      });
    }

    const staffText = `Booking ${params.status}.\n\nMeeting: ${ctx.meetingKey}\nMode: ${ctx.mode}\nStart (UTC): ${startIso}\nEnd (UTC): ${endIso}\nEmail: ${ctx.userEmail ?? "n/a"}\nPhone: ${ctx.userPhone ?? "n/a"}\n${params.reason ? `\nReason: ${params.reason}\n` : ""}`;
    if (ctx.notifyEmailEnabled && staffRecipients.length > 0) {
      const staffHtml = safeRender(
        () =>
          BookingStatusInternalEmail({
            name: ctx.userFullName ?? ctx.userName,
            email: ctx.userEmail,
            phone: ctx.userPhone ?? null,
            status: params.status,
            meetingKey: ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting",
            mode: String(ctx.mode),
            startUtc: startIso,
            endUtc: endIso,
            meetingLink,
            calendarLink,
            userCompany: ctx.userCompany ?? null,
            userCompanyRole: ctx.userCompanyRole ?? null,
            userNotes: ctx.userNotes ?? null,
            reason: params.reason ?? null,
          }),
        staffText
      );
      try {
        stage = "send-staff-email";
        await deliverEmail({
          appointmentId: params.appointmentId,
          templateKey: `booking_${params.status}_internal`,
          subject: `Booking ${params.status} (staff)`,
          text: staffText,
          html: staffHtml,
          to: staffRecipients,
          ...(calendarIcs
            ? { attachments: [{ filename: "booking.ics", content: calendarIcs }] }
            : {}),
        });
        if (ctx.notifyCalendarEnabled && calendarIcs) {
          await logNotification({
            appointmentId: params.appointmentId,
            channel: "calendar",
            toAddress: staffRecipients.join(", "),
            templateKey: `calendar_${params.status}_internal`,
            status: "sent",
          });
        }
      } catch (err) {
        console.error("deliverEmail status staff failed", {
          appointmentId: params.appointmentId,
          status: params.status,
          error: err instanceof Error ? err.message : err,
        });
      }
    } else if (!ctx.notifyEmailEnabled) {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: staffRecipients.join(", "),
        templateKey: `booking_${params.status}_internal`,
        status: "failed",
        error: "Email notifications disabled",
      });
    } else {
      await logNotification({
        appointmentId: params.appointmentId,
        channel: "email",
        toAddress: null,
        templateKey: `booking_${params.status}_internal`,
        status: "failed",
        error: "No recipients",
      });
    }

    if (ctx.notifyWhatsappEnabled) {
      const customerPhone = ctx.userPhone ?? null;
      const staffPhones = Array.isArray(ctx.notifyWhatsapp) ? ctx.notifyWhatsapp : [];
      const customerMessage = `Your booking was ${params.status}. ${ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting"} · ${startIso} UTC.`;
      const staffMessage = `Booking ${params.status}. ${ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting"} · ${startIso} UTC.`;
      if (customerPhone) {
        await sendWhatsAppMessage({
          orgId: ctx.orgId,
          appointmentId: params.appointmentId,
          to: [customerPhone],
          templateKey: `booking_${params.status}_whatsapp`,
          body: customerMessage,
        });
      } else {
        await logNotification({
          appointmentId: params.appointmentId,
          channel: "whatsapp",
          toAddress: null,
          templateKey: `booking_${params.status}_whatsapp`,
          status: "failed",
          error: "Customer phone missing",
        });
      }
      if (staffPhones.length > 0) {
        await sendWhatsAppMessage({
          orgId: ctx.orgId,
          appointmentId: params.appointmentId,
          to: staffPhones,
          templateKey: `booking_${params.status}_whatsapp_internal`,
          body: staffMessage,
        });
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
    console.error("sendStatusEmails internal failed", {
      appointmentId: params.appointmentId,
      stage,
      error: message,
    });
    await logNotification({
      appointmentId: params.appointmentId,
      channel: "email",
      toAddress: null,
      templateKey: `booking_${params.status}`,
      status: "failed",
      error: message,
    });
    return;
  }
}

export async function sendRescheduleRequestEmails(params: {
  appointmentId: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getAppointmentEmailContext(params.appointmentId);
  if (!ctx) {
    await logNotification({
      appointmentId: params.appointmentId,
      channel: "email",
      toAddress: null,
      templateKey: "reschedule_request",
      status: "failed",
      error: "Appointment not found",
    });
    return { ok: false, error: "Appointment not found" };
  }

  const staffEmail = ctx.staffUserId
    ? (
        await prisma.appUser.findFirst({
          where: { id: ctx.staffUserId },
          select: { email: true },
        })
      )?.email ?? null
    : null;
  const staffRecipients = normalizeRecipients(
    staffEmail,
    Array.isArray(ctx.notifyEmails) ? ctx.notifyEmails : null
  );

  if (staffRecipients.length === 0) {
    await logNotification({
      appointmentId: params.appointmentId,
      channel: "email",
      toAddress: null,
      templateKey: "reschedule_request",
      status: "failed",
      error: "No recipients",
    });
    return { ok: false, error: "No admin/staff recipients configured" };
  }

  const baseUrl = getBaseUrl();
  const adminLink = baseUrl
    ? `${baseUrl}/admin/scheduling/bookings?orgId=${ctx.orgId}`
    : null;
  const startIso = toIsoUtc(ctx.startAtUtc);
  const endIso = toIsoUtc(ctx.endAtUtc);
  const subject = "Reschedule request";
  const text = `Reschedule request from ${ctx.userFullName ?? ctx.userName ?? "Customer"}.\n\nMeeting: ${ctx.meetingKey}\nMode: ${ctx.mode}\nStart (UTC): ${startIso}\nEnd (UTC): ${endIso}\nEmail: ${ctx.userEmail ?? "n/a"}\nPhone: ${ctx.userPhone ?? "n/a"}\n${params.reason ? `\nNote: ${params.reason}\n` : ""}\n${adminLink ? `Admin: ${adminLink}\n` : ""}`;
  const html = safeRender(
    RescheduleRequestEmail({
      customerName: ctx.userFullName ?? ctx.userName,
      customerEmail: ctx.userEmail ?? null,
      customerPhone: ctx.userPhone ?? null,
      meetingKey: ctx.meetingTitle ?? ctx.meetingKey ?? "Meeting",
      mode: String(ctx.mode),
      startUtc: startIso,
      endUtc: endIso,
      reason: params.reason ?? null,
      adminLink,
    }),
    text
  );

  try {
    await deliverEmail({
      appointmentId: params.appointmentId,
      templateKey: "reschedule_request",
      subject,
      text,
      html,
      to: staffRecipients,
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
    return { ok: false, error: message };
  }
}

export async function sendTestNotifications(params: {
  orgId: string;
  channel: "email" | "whatsapp";
}): Promise<{ ok: boolean; error?: string }> {
  const settings = await prisma.orgSettings.findFirst({
    where: { orgId: params.orgId },
    select: {
      notifyEmails: true,
      notifyWhatsapp: true,
      notifyEmailEnabled: true,
      notifyWhatsappEnabled: true,
    },
  });
  if (!settings) return { ok: false, error: "Settings not found" };

  if (params.channel === "email") {
    if (!settings.notifyEmailEnabled) {
      return { ok: false, error: "Email notifications are disabled" };
    }
    const recipients = Array.isArray(settings.notifyEmails)
      ? settings.notifyEmails
      : [];
    if (recipients.length === 0) {
      return { ok: false, error: "No email recipients configured" };
    }
    try {
      const startIso = DateTime.utc().toISO() ?? new Date().toISOString();
      const endIso =
        DateTime.utc().plus({ minutes: 30 }).toISO() ?? new Date().toISOString();
      await deliverEmail({
        appointmentId: "test",
        templateKey: "test_email",
        subject: "Test notification",
        text: "This is a test notification from Lux AI Scheduling.",
        html: safeRender(
          BookingCreatedEmail({
            name: "Test recipient",
            meetingKey: "Test notification",
            mode: "email",
            status: "test",
            startUtc: startIso,
            endUtc: endIso,
            meetingLink: null,
            phone: null,
            calendarLink: null,
          }),
          "This is a test notification from Lux AI Scheduling."
        ),
        to: recipients,
        skipLog: true,
      });
      return { ok: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
      return { ok: false, error: message };
    }
  }

  if (!settings.notifyWhatsappEnabled) {
    return { ok: false, error: "WhatsApp notifications are disabled" };
  }
  const phones = Array.isArray(settings.notifyWhatsapp)
    ? settings.notifyWhatsapp
    : [];
  if (phones.length === 0) {
    return { ok: false, error: "No WhatsApp recipients configured" };
  }
  try {
    await sendWhatsAppMessage({
      orgId: params.orgId,
      appointmentId: "test",
      to: phones,
      templateKey: "test_whatsapp",
      body: "Test WhatsApp notification from Lux AI Scheduling.",
      skipLog: true,
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Send failed";
    return { ok: false, error: message };
  }
}
