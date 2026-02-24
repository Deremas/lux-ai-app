import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { t } from "@/lib/site-copy";
import type { AppLanguage } from "@/lib/i18n";

export const runtime = "nodejs";

// type CookieSection = { title?: string; body?: string | string[] };
type CookieSection =
  | { title: string; body: string; bodyList?: never }
  | { title: string; bodyList: string[]; body?: never };

type CookieDoc = {
  title?: string;
  meta?: {
    effectiveDate?: string;
    company?: string;
    domain?: string;
    downloadPdf?: string;
  };
  sections?: CookieSection[];
  footer?: string;
};

// keep lang strict
const isLang = (v: any): v is AppLanguage =>
  v === "en" || v === "fr" || v === "de" || v === "lb";

// ✅ hard guard: pdf-lib must ALWAYS receive a string
const asText = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

function wrapText(text: string, maxWidth: number, font: any, fontSize: number) {
  const safe = asText(text, "");
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const langParam = url.searchParams.get("lang");
  const lang: AppLanguage = isLang(langParam) ? langParam : "en";

  // ✅ IMPORTANT: match your cookies page structure
  // If cookies is not language-nested, this is the right path:
  const doc = t<CookieDoc>(lang, "legal.cookies");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const maxWidth = width - margin * 2;

  let y = height - margin;

  const titleSize = 18;
  const hSize = 12;
  const bodySize = 10.5;
  const lineH = 14;

  // ---- Title ----
  const title = asText(doc?.title, "Cookie Policy");
  page.drawText(title, {
    x: margin,
    y: y - titleSize,
    size: titleSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= titleSize + 18;

  // ---- Meta ----
  const effectiveDate = asText(doc?.meta?.effectiveDate, "Effective date:");
  const company = asText(doc?.meta?.company, "Lux AI Consultancy & Automation");
  const domain = asText(doc?.meta?.domain, "luxaiautomation.com");

  // Use full URL so many PDF viewers auto-link it
  const metaLine = `${effectiveDate}  ·  ${company}  ·  https://${domain}`;
  for (const line of wrapText(metaLine, maxWidth, font, bodySize)) {
    page.drawText(line, { x: margin, y: y - bodySize, size: bodySize, font });
    y -= lineH;
  }
  y -= 10;

  // ---- Sections ----
  const sections = Array.isArray(doc?.sections) ? doc.sections : [];
  for (const sec of sections) {
    const secTitle = asText(sec?.title, "");
    if (secTitle) {
      for (const l of wrapText(secTitle, maxWidth, fontBold, hSize)) {
        page.drawText(l, {
          x: margin,
          y: y - hSize,
          size: hSize,
          font: fontBold,
        });
        y -= lineH;
      }
      y -= 4;
    }

    const body = sec?.body;
    const parts = Array.isArray(body) ? body : [asText(body, "")];

    for (const part of parts) {
      const text = asText(part, "");
      if (!text) continue;

      for (const l of wrapText(text, maxWidth, font, bodySize)) {
        page.drawText(l, { x: margin, y: y - bodySize, size: bodySize, font });
        y -= lineH;
      }
      y -= 4;
    }

    y -= 10;

    // simple new-page safeguard (optional)
    if (y < margin + 120) break; // keep it single-page safe; expand later if needed
  }

  // ---- Footer + Contact (only once) ----
  const footer = asText(
    doc?.footer,
    "Cookies help the website remember your preferences and operate smoothly."
  );

  y -= 6;
  for (const line of wrapText(footer, maxWidth, font, bodySize)) {
    page.drawText(line, { x: margin, y: y - bodySize, size: bodySize, font });
    y -= lineH;
  }

  y -= 10;
  page.drawText("Contact: molla@luxaiautomation.com", {
    x: margin,
    y: y - bodySize,
    size: bodySize,
    font,
  });

  const pdfBytes = await pdf.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cookies-${lang}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
