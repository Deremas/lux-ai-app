import { NextRequest } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  PDFName,
  PDFArray,
  PDFFont,
} from "pdf-lib";
import { t } from "@/lib/site-copy";

export const runtime = "nodejs";

type Lang = "en" | "fr" | "de" | "lb";

function normalizeLang(input: string | null): Lang {
  const v = (input || "en").toLowerCase();
  if (v === "fr" || v === "de" || v === "lb" || v === "en") return v;
  return "en";
}

type SectionBlock = { h: string; b: string[] };

/**
 * Generic builder:
 * - Titles: keys ending with "t"
 * - Bodies: keys starting with same prefix and matching /b\d*$/
 * Supports s1t+s1b, s10t+s10b, etc.
 */
function buildBlocksFromSections(
  sections: Record<string, string | undefined>
): SectionBlock[] {
  const titleKeys = Object.keys(sections)
    .filter((k) => k.endsWith("t"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return titleKeys
    .map((titleKey) => {
      const prefix = titleKey.slice(0, -1); // remove trailing "t"

      const bodyKeys = Object.keys(sections)
        .filter(
          (k) => k.startsWith(prefix) && k !== titleKey && /b\d*$/.test(k) // b, b1, b2...
        )
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const h = (sections[titleKey] ?? "").trim();
      const b = bodyKeys.map((k) => (sections[k] ?? "").trim()).filter(Boolean);

      return { h, b };
    })
    .filter((x) => x.h.length > 0);
}

/** Robust link annotation push */
function addLinkAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  rect: [number, number, number, number],
  url: string
) {
  const ctx = pdfDoc.context;

  const annotRef = ctx.register(
    ctx.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: rect,
      Border: [0, 0, 0],
      A: { S: "URI", URI: url },
    })
  );

  const annotsKey = PDFName.of("Annots");
  const existing = page.node.get(annotsKey);

  if (existing) {
    (existing as PDFArray).push(annotRef);
  } else {
    page.node.set(annotsKey, ctx.obj([annotRef]) as unknown as PDFArray);
  }
}

/**
 * Wrap a paragraph into lines that fit maxWidth using actual font metrics.
 * This eliminates overlap and "random" wrapping issues.
 */
function wrapTextByWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const words = clean.split(" ");
  const lines: string[] = [];
  let line = "";

  const widthOf = (s: string) => font.widthOfTextAtSize(s, fontSize);

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;

    // If the whole word is longer than the line, hard-split the word.
    if (!line && widthOf(test) > maxWidth) {
      let chunk = "";
      for (const ch of w) {
        const tryChunk = chunk + ch;
        if (widthOf(tryChunk) > maxWidth && chunk.length > 0) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = tryChunk;
        }
      }
      if (chunk) lines.push(chunk);
      line = "";
      continue;
    }

    if (widthOf(test) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }

  if (line) lines.push(line);
  return lines;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang: Lang = normalizeLang(searchParams.get("lang"));

  const sections = t<Record<string, string | undefined>>(
    lang,
    "legal.terms.sections"
  );

  const title = t<string>(lang, "legal.terms.title");

  const metaDate = (sections.metaDate ?? "").trim();
  const metaCompany = (sections.metaCompany ?? "").trim();
  const metaDomain = (sections.metaDomain ?? "").trim();

  const domainText = metaDomain || "luxaiautomation.com";
  const domainUrl = domainText.startsWith("http")
    ? domainText
    : `https://${domainText}`;

  const metaLeft = [metaDate, metaCompany].filter(Boolean).join(" · ");
  const endLine = (sections.end ?? "").trim();

  const blocks = buildBlocksFromSections(sections);

  // Contact info (in PDF)
  const contactEmail = "molla@luxaiautomation.com";
  const emailUrl = `mailto:${contactEmail}`;

  // PDF setup
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const titleSize = 18;
  const hSize = 12.5;
  const bodySize = 10.5;
  const metaSize = 10;

  // Better spacing to avoid overlap
  const leading = 1.35; // line-height multiplier
  const gap = (size: number) => size * leading;

  const textColor = rgb(0.12, 0.12, 0.12);
  const bodyColor = rgb(0.18, 0.18, 0.18);
  const linkColor = rgb(0.05, 0.25, 0.55);

  let page: PDFPage = pdfDoc.addPage();
  let { width, height } = page.getSize();

  const maxWidth = width - margin * 2;
  let y = height - margin;

  const newPage = () => {
    page = pdfDoc.addPage();
    ({ width, height } = page.getSize());
    y = height - margin;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  const drawLine = (
    text: string,
    size: number,
    bold = false,
    color = textColor
  ) => {
    ensureSpace(gap(size));
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color,
      maxWidth,
    });
    y -= gap(size);
  };

  const drawParagraph = (
    text: string,
    size: number,
    usedFont: PDFFont = font,
    color = bodyColor
  ) => {
    const lines = wrapTextByWidth(text, usedFont, size, maxWidth);
    for (const ln of lines) {
      ensureSpace(gap(size));
      page.drawText(ln, {
        x: margin,
        y,
        size,
        font: usedFont,
        color,
      });
      y -= gap(size);
    }
  };

  // ---- Render ----

  // Title
  drawLine(title, titleSize, true, textColor);
  y -= 6;

  // Meta left (wrapped by width)
  if (metaLeft) {
    drawParagraph(metaLeft, metaSize, font, bodyColor);
  }

  // Website line (label + clickable domain)
  {
    const label = "Website: ";
    ensureSpace(gap(metaSize));

    // draw label
    page.drawText(label, {
      x: margin,
      y,
      size: metaSize,
      font,
      color: bodyColor,
    });

    const labelW = font.widthOfTextAtSize(label, metaSize);
    const xLink = margin + labelW;
    const yLink = y;

    // draw domain (bold + blue)
    page.drawText(domainText, {
      x: xLink,
      y: yLink,
      size: metaSize,
      font: fontBold,
      color: linkColor,
    });

    const domainW = fontBold.widthOfTextAtSize(domainText, metaSize);
    addLinkAnnotation(
      pdfDoc,
      page,
      [xLink, yLink - 2, xLink + domainW, yLink + metaSize + 2],
      domainUrl
    );

    y -= gap(metaSize);
  }

  y -= 10;

  // Sections
  for (const sec of blocks) {
    // Heading wrapped properly too (bold font width differs!)
    const headingLines = wrapTextByWidth(sec.h, fontBold, hSize, maxWidth);
    for (const hl of headingLines) drawLine(hl, hSize, true, textColor);
    y -= 2;

    for (const p of sec.b) {
      drawParagraph(p, bodySize, font, bodyColor);
      y -= 6;
    }

    y -= 4;
  }

  // End line
  if (endLine) {
    y -= 2;
    drawParagraph(endLine, bodySize, fontBold, textColor);
    y -= 10;
  }

  // Contact block (always visible)
  ensureSpace(90);
  drawLine("Contact", hSize, true, textColor);
  y -= 2;

  // Email label + clickable email
  {
    const label = "Email: ";
    ensureSpace(gap(bodySize));

    page.drawText(label, {
      x: margin,
      y,
      size: bodySize,
      font,
      color: bodyColor,
    });

    const labelW = font.widthOfTextAtSize(label, bodySize);
    const xLink = margin + labelW;
    const yLink = y;

    page.drawText(contactEmail, {
      x: xLink,
      y: yLink,
      size: bodySize,
      font: fontBold,
      color: linkColor,
    });

    const emailW = fontBold.widthOfTextAtSize(contactEmail, bodySize);
    addLinkAnnotation(
      pdfDoc,
      page,
      [xLink, yLink - 2, xLink + emailW, yLink + bodySize + 2],
      emailUrl
    );

    y -= gap(bodySize);
  }

  // Website label + clickable domain
  {
    const label = "Website: ";
    ensureSpace(gap(bodySize));

    page.drawText(label, {
      x: margin,
      y,
      size: bodySize,
      font,
      color: bodyColor,
    });

    const labelW = font.widthOfTextAtSize(label, bodySize);
    const xLink = margin + labelW;
    const yLink = y;

    page.drawText(domainText, {
      x: xLink,
      y: yLink,
      size: bodySize,
      font: fontBold,
      color: linkColor,
    });

    const webW = fontBold.widthOfTextAtSize(domainText, bodySize);
    addLinkAnnotation(
      pdfDoc,
      page,
      [xLink, yLink - 2, xLink + webW, yLink + bodySize + 2],
      domainUrl
    );

    y -= gap(bodySize);
  }

  // Output bytes safely
  const pdfBytes = await pdfDoc.save();
  const safeBytes = Uint8Array.from(pdfBytes);

  return new Response(new Blob([safeBytes], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="terms-${lang}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

// import { NextRequest } from "next/server";
// import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
// import { t } from "@/lib/site-copy";

// export const runtime = "nodejs";

// type Lang = "en" | "fr" | "de" | "lb";

// function normalizeLang(input: string | null): Lang {
//   const v = (input || "en").toLowerCase();
//   if (v === "fr" || v === "de" || v === "lb" || v === "en") return v;
//   return "en";
// }

// type SectionBlock = { h: string; b: string[] };

// function wrapText(text: string, maxChars: number) {
//   const clean = (text ?? "").replace(/\s+/g, " ").trim();
//   if (!clean) return [];
//   const words = clean.split(" ");
//   const lines: string[] = [];
//   let line = "";

//   for (const w of words) {
//     const test = line ? `${line} ${w}` : w;
//     if (test.length > maxChars) {
//       if (line) lines.push(line);
//       line = w;
//     } else {
//       line = test;
//     }
//   }
//   if (line) lines.push(line);
//   return lines;
// }

// function buildBlocksFromSections(
//   sections: Record<string, string | undefined>
// ): SectionBlock[] {
//   const titleKeys = Object.keys(sections)
//     .filter((k) => k.endsWith("t"))
//     .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

//   return titleKeys
//     .map((titleKey) => {
//       const prefix = titleKey.slice(0, -1);

//       const bodyKeys = Object.keys(sections)
//         .filter(
//           (k) => k.startsWith(prefix) && k !== titleKey && /b\d*$/.test(k) // b, b1, b2...
//         )
//         .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

//       const h = (sections[titleKey] ?? "").trim();
//       const b = bodyKeys.map((k) => (sections[k] ?? "").trim()).filter(Boolean);

//       return { h, b };
//     })
//     .filter((x) => x.h.length > 0);
// }

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const lang: Lang = normalizeLang(searchParams.get("lang"));

//   const sections = t<Record<string, string | undefined>>(
//     lang,
//     "legal.terms.sections"
//   );

//   const title = t<string>(lang, "legal.terms.title");

//   const metaLine = [
//     sections.metaDate,
//     sections.metaCompany,
//     sections.metaDomain,
//   ]
//     .filter(Boolean)
//     .join(" · ");

//   const endLine = (sections.end ?? "").toString().trim();
//   const blocks = buildBlocksFromSections(sections);

//   const pdfDoc = await PDFDocument.create();
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//   const margin = 56;
//   const titleSize = 18;
//   const hSize = 12.5;
//   const bodySize = 10.5;
//   const metaSize = 10;
//   const lineGap = 5;

//   const textColor = rgb(0.12, 0.12, 0.12);
//   const bodyColor = rgb(0.18, 0.18, 0.18);

//   let page: PDFPage = pdfDoc.addPage();
//   let { width, height } = page.getSize();
//   const maxWidth = width - margin * 2;

//   let y = height - margin;

//   const newPage = () => {
//     page = pdfDoc.addPage();
//     ({ width, height } = page.getSize());
//     y = height - margin;
//   };

//   const ensureSpace = (needed: number) => {
//     if (y - needed < margin) newPage();
//   };

//   const drawLine = (
//     text: string,
//     size: number,
//     bold = false,
//     color = textColor
//   ) => {
//     ensureSpace(size + lineGap);
//     page.drawText(text, {
//       x: margin,
//       y,
//       size,
//       font: bold ? fontBold : font,
//       color,
//       maxWidth,
//     });
//     y -= size + lineGap;
//   };

//   const drawParagraph = (text: string, size: number, maxChars: number) => {
//     for (const ln of wrapText(text, maxChars)) {
//       drawLine(ln, size, false, bodyColor);
//     }
//   };

//   // Title
//   drawLine(title, titleSize, true, textColor);
//   y -= 6;

//   // Meta
//   if (metaLine) {
//     for (const ml of wrapText(metaLine, 95)) {
//       drawLine(ml, metaSize, false, bodyColor);
//     }
//     y -= 10;
//   }

//   // Sections
//   for (const sec of blocks) {
//     for (const hl of wrapText(sec.h, 95)) {
//       drawLine(hl, hSize, true, textColor);
//     }
//     y -= 2;

//     for (const p of sec.b) {
//       drawParagraph(p, bodySize, 105);
//       y -= 8;
//     }

//     y -= 6;
//   }

//   // End
//   if (endLine) {
//     y -= 6;
//     for (const el of wrapText(endLine, 105)) {
//       drawLine(el, bodySize, true, textColor);
//     }
//   }

//   const pdfBytes = await pdfDoc.save();
//   const safeBytes = Uint8Array.from(pdfBytes);

//   return new Response(new Blob([safeBytes], { type: "application/pdf" }), {
//     headers: {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename="terms-${lang}.pdf"`,
//       "Cache-Control": "no-store",
//     },
//   });
// }
