// app/api/lead/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  isBodyTooLarge,
  isValidCompany,
  isValidEmail,
  isValidMessage,
  isValidName,
} from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

type Lead = {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  lang?: "en" | "fr" | "de" | "lb";
  createdAt: string;
};

const LEADS_PATH = path.join(process.cwd(), "data", "leads.json");

function readLeads(): Lead[] {
  try {
    if (!fs.existsSync(LEADS_PATH)) return [];
    const raw = fs.readFileSync(LEADS_PATH, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeLeads(leads: Lead[]) {
  fs.mkdirSync(path.dirname(LEADS_PATH), { recursive: true });
  fs.writeFileSync(LEADS_PATH, JSON.stringify(leads, null, 2), "utf8");
}

export async function POST(req: Request) {
  if (isBodyTooLarge(req, 4096)) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.lead);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: limit.headers }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const lang = body.lang;
  if (lang && !["en", "fr", "de", "lb"].includes(lang)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const lead: Lead = {
    name: body.name?.trim(),
    email: body.email?.trim(),
    company: body.company?.trim(),
    message: body.message?.trim(),
    lang,
    createdAt: new Date().toISOString(),
  };

  if (lead.name && !isValidName(lead.name)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (lead.email && !isValidEmail(lead.email)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (lead.company && !isValidCompany(lead.company)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (lead.message && !isValidMessage(lead.message, 1, 2000)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const leads = readLeads();
  leads.unshift(lead);
  writeLeads(leads);

  return NextResponse.json({ ok: true });
}
