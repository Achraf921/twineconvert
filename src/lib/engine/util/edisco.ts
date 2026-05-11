/**
 * eDiscovery load-file helpers.
 *
 * DAT (Concordance / Relativity load file): the metadata + extracted-text
 * format every U.S. eDiscovery production uses. Unlike CSV, DAT uses
 * non-printable Unicode characters as delimiters to avoid collisions
 * with quoted text inside fields:
 *
 *   - 0x14 (¶, U+0014) = field delimiter (was: column comma in CSV)
 *   - 0xFE (þ, U+00FE) = text qualifier (was: double quote in CSV)
 *
 * Real producers sometimes use the visible ASCII fallbacks (`|` or `,`)
 * but Concordance + Relativity default to the Unicode pair, and that's
 * what this util emits + parses by default.
 *
 * OPT (Concordance image load file): comma-separated, one row per page,
 * mapping Bates page IDs to image file paths:
 *
 *   ABC0000001,VOLUME1,IMAGES\001\ABC0000001.tif,Y,,,1
 *   ABC0000002,VOLUME1,IMAGES\001\ABC0000002.tif,,,,1
 *   ABC0000003,VOLUME1,IMAGES\001\ABC0000003.tif,,,,1
 *
 * Field order: PageID, Volume, ImagePath, IsBoundary (Y for first page
 * of a doc), GroupIdentifier, Type, PagesInDoc.
 */

const FIELD_DELIM = ""; // þ field separator
const TEXT_QUAL = "þ";   // þ text qualifier (around values)

export interface DatTable {
  headers: string[];
  rows: string[][];
}

export function parseDat(text: string): DatTable {
  // Auto-detect delimiter: prefer Unicode (Concordance default), fall
  // back to pipe `|` if no Unicode delimiters appear (older producers).
  const usesUnicode = text.includes(FIELD_DELIM);
  const fieldDelim = usesUnicode ? FIELD_DELIM : "|";
  const textQual = usesUnicode ? TEXT_QUAL : "";

  // DAT records are CRLF-delimited (Windows-native — Concordance is
  // Windows-only software). Tolerate LF too.
  const lines = text
    .split(/\r\n|\n/)
    .filter((l) => l.length > 0 && !/^[\sþ]*$/.test(l));
  if (lines.length === 0) {
    throw new Error("DAT load file is empty");
  }

  const splitLine = (line: string): string[] => {
    return line.split(fieldDelim).map((cell) => {
      if (!textQual) return cell.trim();
      // Strip surrounding text-qualifier characters
      return cell.replace(new RegExp(`^${textQual}|${textQual}$`, "g"), "");
    });
  };

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

export function buildDat(table: DatTable): string {
  const wrap = (cell: string): string => `${TEXT_QUAL}${cell}${TEXT_QUAL}`;
  const headerLine = table.headers.map(wrap).join(FIELD_DELIM);
  const dataLines = table.rows.map((row) => row.map(wrap).join(FIELD_DELIM));
  // CRLF for Windows compatibility (Concordance + Relativity expect it)
  return [headerLine, ...dataLines].join("\r\n") + "\r\n";
}

// ---- OPT (Concordance image load file) ---------------------------------

export interface OptRow {
  pageId: string;
  volume: string;
  imagePath: string;
  isBoundary: boolean;
  groupIdentifier: string;
  type: string;
  pagesInDoc: number | "";
}

export function parseOpt(text: string): OptRow[] {
  const lines = text
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.map((line) => {
    const cols = line.split(",");
    return {
      pageId: cols[0] ?? "",
      volume: cols[1] ?? "",
      imagePath: cols[2] ?? "",
      isBoundary: cols[3] === "Y",
      groupIdentifier: cols[4] ?? "",
      type: cols[5] ?? "",
      pagesInDoc: cols[6] ? parseInt(cols[6], 10) : "",
    };
  });
}

export function optToTable(rows: OptRow[]): DatTable {
  return {
    headers: ["PageID", "Volume", "ImagePath", "IsBoundary", "GroupIdentifier", "Type", "PagesInDoc"],
    rows: rows.map((r) => [
      r.pageId,
      r.volume,
      r.imagePath,
      r.isBoundary ? "Y" : "",
      r.groupIdentifier,
      r.type,
      String(r.pagesInDoc),
    ]),
  };
}
