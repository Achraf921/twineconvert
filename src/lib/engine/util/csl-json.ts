/**
 * CSL-JSON (Citation Style Language JSON) parser + writer.
 *
 * CSL-JSON is the modern interop format for citation data — Zotero
 * exports it natively, Pandoc consumes it as `--bibliography file.json`,
 * every major academic tool (Mendeley, Zotero, Citavi, Papers, Bookends)
 * either uses it directly or has a one-click export.
 *
 * Spec: https://github.com/citation-style-language/schema/blob/master/schemas/input/csl-data.json
 *
 * Our Citation model is a strict subset of CSL-JSON, so the mapping is
 * mostly mechanical. Areas where the two differ:
 *
 *   - CSL "author"/"editor" are arrays of {family, given, suffix}
 *     objects. We store them as "Last, First" strings (BibTeX convention)
 *     and convert at the boundary.
 *
 *   - CSL "issued" is {date-parts: [[year, month, day]]}. We split into
 *     separate year/month/day fields.
 *
 *   - CSL "type" uses the OpenCitations vocabulary
 *     ("article-journal", "book", "chapter", etc.). We use BibTeX-style
 *     types and map via TYPE_MAP_IN / TYPE_MAP_OUT.
 *
 *   - CSL has 100+ optional fields (locator, container-title-short,
 *     publisher-place, original-date, etc.). We preserve everything
 *     unrecognized into our `extra` slot so round-trips don't lose
 *     CSL-specific data.
 */

import { type Citation, type CitationType, generateCitationKey } from "./citation";

// ---- Type mapping ---------------------------------------------------------

// CSL canonical type → our Citation.type
const TYPE_MAP_IN: Record<string, CitationType> = {
  "article-journal": "article",
  "article-magazine": "article",
  "article-newspaper": "article",
  article: "article",
  book: "book",
  chapter: "inbook",
  "paper-conference": "inproceedings",
  thesis: "thesis",
  report: "report",
  manuscript: "report",
  speech: "audiovisual",
  song: "audiovisual",
  motion_picture: "audiovisual",
  webpage: "online",
  post: "online",
  "post-weblog": "online",
  patent: "patent",
  software: "misc",
};

// Our Citation.type → CSL canonical type (reverse map with sensible defaults)
const TYPE_MAP_OUT: Record<CitationType, string> = {
  article: "article-journal",
  book: "book",
  inbook: "chapter",
  incollection: "chapter",
  inproceedings: "paper-conference",
  thesis: "thesis",
  report: "report",
  manual: "report",
  misc: "document",
  online: "webpage",
  patent: "patent",
  audiovisual: "motion_picture",
};

// ---- Author/editor name encoding -----------------------------------------

interface CslName {
  family?: string;
  given?: string;
  suffix?: string;
  literal?: string;
}

/** Parse a "Last, First Middle" or "First Middle Last" string into the CSL
 *  structured name. BibTeX convention is "Last, First"; CSL allows both
 *  forms, we always emit the structured form for clarity. */
function parseName(s: string): CslName {
  const trimmed = s.trim();
  if (!trimmed) return { literal: "" };
  // Organizations / corporate authors with no comma — emit as literal
  if (!trimmed.includes(",")) {
    // Try to split on whitespace heuristically (rare; most BibTeX uses commas)
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { literal: trimmed };
    const family = parts[parts.length - 1];
    const given = parts.slice(0, -1).join(" ");
    return { family, given };
  }
  const [family, ...rest] = trimmed.split(",");
  return { family: family.trim(), given: rest.join(",").trim() };
}

/** Flatten a CSL structured name back to "Last, First" for BibTeX. */
function formatName(n: CslName): string {
  if (n.literal) return n.literal;
  const family = n.family ?? "";
  const given = n.given ?? "";
  if (!family) return given;
  if (!given) return family;
  return `${family}, ${given}${n.suffix ? `, ${n.suffix}` : ""}`;
}

// ---- Date encoding -------------------------------------------------------

interface CslDate {
  "date-parts"?: Array<Array<string | number>>;
  literal?: string;
  raw?: string;
}

function parseCslDate(d: CslDate | undefined): { year?: string; month?: string; day?: string } {
  if (!d) return {};
  if (d.literal) return { year: d.literal };
  if (d.raw) {
    const m = d.raw.match(/(\d{4})(?:[-/](\d{1,2}))?(?:[-/](\d{1,2}))?/);
    if (m) return { year: m[1], month: m[2], day: m[3] };
    return { year: d.raw };
  }
  const parts = d["date-parts"]?.[0];
  if (!parts || parts.length === 0) return {};
  return {
    year: parts[0] != null ? String(parts[0]) : undefined,
    month: parts[1] != null ? String(parts[1]) : undefined,
    day: parts[2] != null ? String(parts[2]) : undefined,
  };
}

function buildCslDate(year?: string, month?: string, day?: string): CslDate | undefined {
  if (!year) return undefined;
  const parts: Array<string | number> = [parseInt(year, 10) || year];
  if (month) parts.push(parseInt(month, 10) || month);
  if (day) parts.push(parseInt(day, 10) || day);
  return { "date-parts": [parts] };
}

// ---- Main parse / build --------------------------------------------------

interface CslEntry {
  id?: string;
  type?: string;
  title?: string;
  author?: CslName[];
  editor?: CslName[];
  issued?: CslDate;
  "container-title"?: string;
  publisher?: string;
  "publisher-place"?: string;
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
  URL?: string;
  ISBN?: string;
  ISSN?: string;
  abstract?: string;
  keyword?: string;
  [k: string]: unknown;
}

const RECOGNIZED_KEYS = new Set([
  "id",
  "type",
  "title",
  "author",
  "editor",
  "issued",
  "container-title",
  "publisher",
  "publisher-place",
  "volume",
  "issue",
  "page",
  "DOI",
  "URL",
  "ISBN",
  "ISSN",
  "abstract",
  "keyword",
]);

export function parseCslJson(text: string): Citation[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `CSL-JSON must be valid JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!Array.isArray(data)) {
    throw new Error("CSL-JSON must be an array of citation entries at the top level");
  }
  return (data as CslEntry[]).map((entry, idx) => {
    const cslType = entry.type ?? "article-journal";
    const dateParts = parseCslDate(entry.issued);
    const citation: Citation = {
      id: entry.id ?? `entry${idx + 1}`,
      type: TYPE_MAP_IN[cslType] ?? "misc",
      title: entry.title,
      authors: entry.author?.map(formatName),
      editors: entry.editor?.map(formatName),
      ...dateParts,
      journal: entry["container-title"],
      booktitle: cslType === "chapter" ? entry["container-title"] : undefined,
      publisher: entry.publisher,
      address: entry["publisher-place"],
      volume: entry.volume,
      issue: entry.issue,
      pages: entry.page,
      doi: entry.DOI,
      url: entry.URL,
      isbn: entry.ISBN,
      issn: entry.ISSN,
      abstract: entry.abstract,
      keywords: entry.keyword?.split(/[,;]/).map((k) => k.trim()).filter(Boolean),
    };
    // Preserve unrecognized fields for round-trip fidelity
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(entry)) {
      if (RECOGNIZED_KEYS.has(k)) continue;
      if (typeof v === "string" || typeof v === "number") {
        extra[k] = String(v);
      }
    }
    if (Object.keys(extra).length > 0) citation.extra = extra;
    return citation;
  });
}

export function buildCslJson(citations: Citation[]): string {
  const entries = citations.map((c): CslEntry => {
    const entry: CslEntry = {
      id: c.id || generateCitationKey(c),
      type: TYPE_MAP_OUT[c.type] ?? "article-journal",
    };
    if (c.title) entry.title = c.title;
    if (c.authors && c.authors.length > 0) entry.author = c.authors.map(parseName);
    if (c.editors && c.editors.length > 0) entry.editor = c.editors.map(parseName);
    const issued = buildCslDate(c.year, c.month, c.day);
    if (issued) entry.issued = issued;
    if (c.journal) entry["container-title"] = c.journal;
    if (c.booktitle && c.type === "inbook") entry["container-title"] = c.booktitle;
    if (c.publisher) entry.publisher = c.publisher;
    if (c.address) entry["publisher-place"] = c.address;
    if (c.volume) entry.volume = c.volume;
    if (c.issue) entry.issue = c.issue;
    if (c.pages) entry.page = c.pages;
    if (c.doi) entry.DOI = c.doi;
    if (c.url) entry.URL = c.url;
    if (c.isbn) entry.ISBN = c.isbn;
    if (c.issn) entry.ISSN = c.issn;
    if (c.abstract) entry.abstract = c.abstract;
    if (c.keywords && c.keywords.length > 0) entry.keyword = c.keywords.join(", ");
    if (c.extra) {
      for (const [k, v] of Object.entries(c.extra)) {
        if (!RECOGNIZED_KEYS.has(k)) entry[k] = v;
      }
    }
    return entry;
  });
  return JSON.stringify(entries, null, 2) + "\n";
}
