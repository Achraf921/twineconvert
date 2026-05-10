/**
 * PACER docket HTML scraper.
 *
 * PACER (the federal court records system) lets users download a case
 * docket as an HTML page. The page is a simple table with one row per
 * filing, but the formatting varies a bit between PACER frontends
 * (NextGen vs older builds). We target the common shape:
 *
 *   Header section: case caption, court, judge, date filed
 *   Docket table:
 *     Date | # | Docket Text (with PDF links)
 *
 * We also accept zipped exports, some users save "Docket Sheet.zip"
 * which contains the HTML plus referenced PDFs. We extract the HTML
 * (and ignore the PDFs since the converter shape is single-file out).
 *
 * Output is a flat CSV of docket entries with the most useful columns:
 * date, entry number, document description, PDF link (if any).
 */

import type JSZipType from "jszip";

export interface DocketEntry {
  date?: string;
  number?: string;
  description: string;
  documentUrl?: string;
}

export interface ParsedPacer {
  caseCaption?: string;
  court?: string;
  judge?: string;
  dateFiled?: string;
  entries: DocketEntry[];
}

async function readDocketHtml(input: File | Blob): Promise<string> {
  const bytes = new Uint8Array(await input.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!isZip) {
    return new TextDecoder("utf-8").decode(bytes);
  }
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(bytes);
  const htmlEntry =
    zip.file(/docket.*\.html?$/i)[0] ??
    zip.file(/\.html?$/i)[0];
  if (!htmlEntry) throw new Error("No HTML file found inside the docket zip");
  return htmlEntry.async("string");
}

export async function parsePacerDocket(input: File | Blob): Promise<ParsedPacer> {
  if (typeof DOMParser === "undefined") throw new Error("DOMParser unavailable");
  const html = await readDocketHtml(input);
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Header: PACER pages typically have a centered header table at the top.
  // Heuristics rather than fixed selectors since the HTML varies between
  // courts and PACER versions.
  const bodyText = doc.body?.textContent ?? "";
  const captionMatch = bodyText.match(/CASE.{0,30}\n([^\n]+)\nv?\.\s*([^\n]+)/i);
  const caseCaption = captionMatch ? `${captionMatch[1].trim()} v. ${captionMatch[2].trim()}` : undefined;
  const courtMatch = bodyText.match(/U\.S\.\s+District\s+Court[^\n]*/i);
  const court = courtMatch?.[0]?.trim();
  const judgeMatch = bodyText.match(/(?:Honorable|Judge)[:\s]+([A-Z][\w.\-' ]+)/);
  const judge = judgeMatch?.[1]?.trim();
  const dateFiledMatch = bodyText.match(/Date\s+Filed[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const dateFiled = dateFiledMatch?.[1];

  // Find the docket table. PACER docket tables have a header row containing
  // "Date Filed" or "Date" + "#" + "Docket Text".
  const entries: DocketEntry[] = [];
  const tables = Array.from(doc.getElementsByTagName("table"));
  let docketTable: HTMLTableElement | null = null;

  for (const t of tables) {
    const headerRow = t.rows[0];
    if (!headerRow) continue;
    const headerText = headerRow.textContent?.toLowerCase() ?? "";
    if (
      (headerText.includes("date") && headerText.includes("docket text")) ||
      (headerText.includes("date filed") && headerText.includes("#"))
    ) {
      docketTable = t;
      break;
    }
  }

  if (docketTable) {
    for (let i = 1; i < docketTable.rows.length; i++) {
      const row = docketTable.rows[i];
      if (!row) continue;
      const cells = Array.from(row.cells);
      if (cells.length < 2) continue;
      const date = cells[0]?.textContent?.trim();
      const number = cells[1]?.textContent?.trim();
      const descCell = cells[2] ?? cells[1];
      const description = descCell?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const link = descCell?.querySelector("a")?.getAttribute("href") ?? undefined;
      if (description) entries.push({ date, number, description, documentUrl: link });
    }
  }

  return { caseCaption, court, judge, dateFiled, entries };
}
