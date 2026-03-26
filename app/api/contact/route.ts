import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  isBodyTooLarge,
  isValidEmail,
  isValidMessage,
  isValidName,
  isValidCompany,
} from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function isEmailLike(email: string) {
  return isValidEmail(email);
}

export async function POST(req: Request) {
  try {
    if (isBodyTooLarge(req, 8192)) {
      return NextResponse.json(
        { ok: false, error: "Request too large" },
        { status: 413 }
      );
    }

    const limit = await applyRateLimit(req, RATE_LIMIT_RULES.contact);
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: limit.headers }
      );
    }

    const body = await req.json();

    // Honeypot: silently accept
    const website = clean(body?.website);
    if (website) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const name = clean(body?.name);
    const email = clean(body?.email).toLowerCase();
    const phoneRaw = clean(body?.phone);
    const company = clean(body?.company);
    const taskDescription = clean(body?.taskDescription);

    if (!name || !email || !phoneRaw || !taskDescription) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    if (!isEmailLike(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    if (!isValidName(name) || (company && !isValidCompany(company))) {
      return NextResponse.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    if (!isValidMessage(taskDescription, 10, 2000)) {
      return NextResponse.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    // ✅ derive country from phone number
    const digitsOnly = phoneRaw.replace(/\D+/g, "");
    const phoneParsed = parsePhoneNumberFromString(
      phoneRaw,
      phoneRaw.startsWith("+") ? undefined : "ET"
    );
    if (!phoneParsed || !phoneParsed.isValid()) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone" },
        { status: 400 }
      );
    }
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone" },
        { status: 400 }
      );
    }

    const phoneE164 = phoneParsed.number; // normalized +xxxxxxxx
    const phoneCountry = phoneParsed.country
      ? String(phoneParsed.country).toLowerCase()
      : "unknown"; // et, us, etc.

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Email not configured" },
        { status: 500 }
      );
    }

    const adminEmail = process.env.CONTACT_ADMIN_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;

    if (!adminEmail || !from) {
      return NextResponse.json(
        { ok: false, error: "Email not configured" },
        { status: 500 }
      );
    }

    const adminResult = await resend.emails.send({
      from,
      to: adminEmail,
      subject: "New Contact Submission",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phoneE164}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Message:</strong> ${taskDescription}</p>
      `,
    });

    await resend.emails.send({
      from,
      to: email,
      subject: "We received your message",
      html: `
        <h2>Thank you for contacting Lux AI Automation</h2>
        <p>Hi ${name},</p>
        <p>We have received your message and will be in touch shortly.</p>
      `,
    });

    return NextResponse.json(
      { ok: true, id: adminResult.data?.id },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to send" },
      { status: 500 }
    );
  }
}
