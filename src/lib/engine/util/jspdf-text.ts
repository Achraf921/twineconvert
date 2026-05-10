/**
 * Text-mode PDF renderer using jsPDF's native text APIs (doc.text(),
 * doc.setFont(), doc.line()). Produces SEARCHABLE PDFs where the user
 * can copy/paste, ctrl-F, and have screen readers parse the content.
 *
 * Replaces the html2canvas pipeline in jspdf-html.ts for converters
 * whose source is structured text (EML, MBOX, GEDCOM, WhatsApp,
 * Discord). Those converters previously rendered HTML via
 * jsPDF.html() + html2canvas, producing image-only PDFs that broke
 * search and accessibility. The bug also showed up as blank pages
 * in headless Chromium because html2canvas can't capture off-screen
 * containers there.
 *
 * Layout philosophy: minimal but readable.
 *   - A4 portrait, 15mm margins
 *   - Geist (system-ui fallback in jsPDF) for body
 *   - Bold for the document title and section headers
 *   - Small print for metadata (date, sender, etc.)
 *   - Auto page-break when y exceeds page height
 */

export interface PdfTextSection {
  /** Section heading rendered in bold. Optional. */
  heading?: string;
  /** Plain text body. Newlines preserved. */
  body: string;
  /** Optional small-print metadata above the body. */
  meta?: string[];
}

export interface PdfTextDocOptions {
  /** Document title rendered at the top of page 1. */
  title?: string;
  /** Page margin in mm. Default 15. */
  margin?: number;
  /** Body font size in pt. Default 10. */
  bodyFontSize?: number;
  /** Heading font size in pt. Default 14. */
  headingFontSize?: number;
  /** Title font size in pt. Default 18. */
  titleFontSize?: number;
}

export async function renderTextPdf(
  sections: PdfTextSection[],
  opts: PdfTextDocOptions = {},
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = opts.margin ?? 15;
  const usableWidth = pageWidth - margin * 2;
  const bodyFs = opts.bodyFontSize ?? 10;
  const headingFs = opts.headingFontSize ?? 14;
  const titleFs = opts.titleFontSize ?? 18;
  const lineHeight = (fs: number) => fs * 0.4; // mm per line at given pt size

  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, fs: number, bold = false) => {
    doc.setFontSize(fs);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, usableWidth) as string[];
    const lh = lineHeight(fs);
    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, margin, y);
      y += lh;
    }
  };

  if (opts.title) {
    writeWrapped(opts.title, titleFs, true);
    y += 3;
    // Underline rule under the title
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  }

  for (const section of sections) {
    if (section.heading) {
      ensureSpace(lineHeight(headingFs) + 4);
      y += 3;
      writeWrapped(section.heading, headingFs, true);
      y += 1;
    }
    if (section.meta && section.meta.length > 0) {
      doc.setTextColor(120, 120, 120);
      for (const m of section.meta) {
        writeWrapped(m, bodyFs - 1, false);
      }
      doc.setTextColor(0, 0, 0);
      y += 1;
    }
    if (section.body) {
      // Preserve paragraph breaks while letting splitTextToSize wrap
      const paragraphs = section.body.split(/\n{2,}/);
      for (let i = 0; i < paragraphs.length; i++) {
        writeWrapped(paragraphs[i], bodyFs, false);
        if (i < paragraphs.length - 1) y += 2;
      }
    }
    y += 4;
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

/** Strip HTML and return plain text approximation. Preserves paragraph breaks. */
export function htmlToPlainText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // Remove script + style outright
  doc.querySelectorAll("script, style").forEach((el) => el.remove());
  // Convert <br> to \n and block elements to \n\n boundaries
  doc.querySelectorAll("br").forEach((el) => el.replaceWith("\n"));
  const blockTags = ["p", "div", "section", "article", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "blockquote"];
  for (const tag of blockTags) {
    doc.querySelectorAll(tag).forEach((el) => {
      el.appendChild(document.createTextNode("\n\n"));
    });
  }
  const text = doc.body.textContent || "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
