import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { render } from "@react-email/render";
import ContactRequestEmail from "@/emails/contact/ContactRequestEmail";
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
    const confirmEmail = clean(body?.confirmEmail).toLowerCase();
    const phoneRaw = clean(body?.phone);
    const company = clean(body?.company);
    const taskDescription = clean(body?.taskDescription);

    if (
      !name ||
      !email ||
      !confirmEmail ||
      !phoneRaw ||
      !company ||
      !taskDescription
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    if (!isEmailLike(email) || email !== confirmEmail) {
      return NextResponse.json(
        { ok: false, error: "Email mismatch" },
        { status: 400 }
      );
    }

    if (!isValidName(name) || !isValidCompany(company)) {
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

    const to = process.env.CONTACT_TO_EMAIL || "derejemasresha27@gmail.com";
    const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    const subject = `New contact request — ${name} (${company})`;

    const text =
      `New contact request\n` +
      `Name: ${name}\n\n` +
      `Email: ${email}\n\n` +
      `Phone: ${phoneE164}\n\n` +
      `Country: ${phoneCountry}\n\n` +
      `Company: ${company}\n\n` +
      `Task:\n\n${taskDescription}\n`;

    const html = render(
      ContactRequestEmail({
        name,
        email,
        phone: phoneE164,
        country: phoneCountry,
        company,
        taskDescription,
      })
    );

    const result = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { ok: true, id: result.data?.id },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to send" },
      { status: 500 }
    );
  }
}
