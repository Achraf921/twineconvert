/**
 * MODS (Metadata Object Description Schema, Library of Congress) parser
 * and writer for the bibliography family. MODS is the XML metadata
 * format used by DSpace, Fedora, Islandora, and most institutional
 * repositories and library catalogs.
 *
 * Parses INTO and writes FROM the unified Citation model. Uses
 * fast-xml-parser (already a dependency, browser-safe) with namespace
 * prefixes stripped so <mods:title> and <title> are handled the same.
 *
 * Structure mapped:
 *   <titleInfo><title>           -> title
 *   <name type=personal>         -> authors ("Family, Given")
 *   <originInfo><dateIssued>     -> year
 *   <originInfo><publisher>      -> publisher
 *   <relatedItem type=host>      -> journal + volume/issue/pages
 *   <identifier type=doi/issn>   -> doi / issn / isbn
 *   <subject><topic>             -> keywords
 *   <abstract>                   -> abstract
 *   <genre> / <typeOfResource>   -> citation type
 */

import { XMLParser } from "fast-xml-parser";
import type { Citation, CitationType } from "./citation";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: true,
  removeNSPrefix: true,
});

const GENRE_TYPE: Record<string, CitationType> = {
  "journal article": "article",
  "article": "article",
  "book": "book",
  "book section": "incollection",
  "book chapter": "incollection",
  "conference publication": "inproceedings",
  "conference paper": "inproceedings",
  "thesis": "thesis",
  "report": "report",
  "web page": "online",
  "website": "online",
};

const TYPE_GENRE: Record<CitationType, string> = {
  article: "journal article",
  book: "book",
  inbook: "book section",
  incollection: "book section",
  inproceedings: "conference publication",
  thesis: "thesis",
  report: "report",
  manual: "text",
  misc: "text",
  online: "web page",
  patent: "patent",
  audiovisual: "moving image",
};

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Text content of a node that may be a bare string or { "#text", "@_..." }. */
function textOf(node: unknown): string | undefined {
  if (node == null) return undefined;
  if (typeof node === "string") return node.trim() || undefined;
  if (typeof node === "number") return String(node);
  if (typeof node === "object") {
    const t = (node as Record<string, unknown>)["#text"];
    if (typeof t === "string") return t.trim() || undefined;
    if (typeof t === "number") return String(t);
  }
  return undefined;
}

function attr(node: unknown, name: string): string | undefined {
  if (node && typeof node === "object") {
    const v = (node as Record<string, unknown>)[`@_${name}`];
    if (typeof v === "string") return v;
  }
  return undefined;
}

interface ModsNode {
  titleInfo?: unknown;
  name?: unknown;
  originInfo?: unknown;
  relatedItem?: unknown;
  identifier?: unknown;
  subject?: unknown;
  abstract?: unknown;
  genre?: unknown;
  typeOfResource?: unknown;
}

function nameToString(nameNode: unknown): string | undefined {
  if (!nameNode || typeof nameNode !== "object") return undefined;
  const parts = asArray((nameNode as Record<string, unknown>).namePart);
  if (parts.length === 0) return undefined;
  let family: string | undefined;
  let given: string | undefined;
  const untyped: string[] = [];
  for (const p of parts) {
    const text = textOf(p);
    if (!text) continue;
    const type = attr(p, "type");
    if (type === "family") family = text;
    else if (type === "given") given = text;
    else if (type === "date" || type === "termsOfAddress") continue;
    else untyped.push(text);
  }
  if (family && given) return `${family}, ${given}`;
  if (family) return family;
  if (untyped.length > 0) return untyped.join(" ");
  return undefined;
}

function modsToCitation(mods: ModsNode, idx: number): Citation {
  // Title: first titleInfo that isn't an alternative/abbreviated form.
  let title: string | undefined;
  for (const ti of asArray(mods.titleInfo)) {
    if (attr(ti, "type")) continue; // skip alternative/translated/abbreviated
    const t = textOf((ti as Record<string, unknown>)?.title);
    if (t) { title = t; break; }
  }
  if (!title) {
    const ti = asArray(mods.titleInfo)[0];
    title = textOf((ti as Record<string, unknown>)?.title);
  }

  // Authors: personal names (skip explicit non-author roles).
  const authors: string[] = [];
  for (const n of asArray(mods.name)) {
    if (attr(n, "type") && attr(n, "type") !== "personal") continue;
    const roles = asArray((n as Record<string, unknown>)?.role);
    const roleTerms = roles.flatMap((r) =>
      asArray((r as Record<string, unknown>)?.roleTerm).map((rt) => textOf(rt)?.toLowerCase()),
    );
    if (roleTerms.length > 0 && !roleTerms.some((rt) => rt === "author" || rt === "creator" || rt === "aut")) {
      continue;
    }
    const s = nameToString(n);
    if (s) authors.push(s);
  }

  // Origin: publisher + year.
  const origin = asArray(mods.originInfo)[0] as Record<string, unknown> | undefined;
  const publisher = textOf(asArray(origin?.publisher)[0]);
  let year: string | undefined;
  for (const d of asArray(origin?.dateIssued)) {
    const t = textOf(d);
    const m = t?.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);
    if (m) { year = m[1]; break; }
  }

  // Host relatedItem: journal + part volume/issue/pages.
  let journal: string | undefined;
  let volume: string | undefined;
  let issue: string | undefined;
  let pages: string | undefined;
  for (const ri of asArray(mods.relatedItem)) {
    if (attr(ri, "type") !== "host") continue;
    const r = ri as Record<string, unknown>;
    journal = textOf((asArray(r.titleInfo)[0] as Record<string, unknown>)?.title);
    const part = asArray(r.part)[0] as Record<string, unknown> | undefined;
    if (part) {
      for (const d of asArray(part.detail)) {
        const dt = attr(d, "type");
        const num = textOf((d as Record<string, unknown>)?.number);
        if (dt === "volume") volume = num;
        else if (dt === "issue") issue = num;
      }
      const extent = asArray(part.extent).find((e) => attr(e, "unit") === "pages" || attr(e, "unit") === "page") as Record<string, unknown> | undefined;
      if (extent) {
        const start = textOf(extent.start);
        const end = textOf(extent.end);
        pages = start && end ? `${start}-${end}` : start || end || undefined;
      }
    }
    break;
  }

  // Identifiers.
  let doi: string | undefined;
  let issn: string | undefined;
  let isbn: string | undefined;
  for (const id of asArray(mods.identifier)) {
    const t = attr(id, "type")?.toLowerCase();
    const val = textOf(id);
    if (!val) continue;
    if (t === "doi") doi = val;
    else if (t === "issn") issn = val;
    else if (t === "isbn") isbn = val;
  }

  // Subjects -> keywords.
  const keywords: string[] = [];
  for (const s of asArray(mods.subject)) {
    for (const topic of asArray((s as Record<string, unknown>)?.topic)) {
      const t = textOf(topic);
      if (t) keywords.push(t);
    }
  }

  const abstract = textOf(asArray(mods.abstract)[0]);

  const genre = textOf(asArray(mods.genre)[0])?.toLowerCase().trim();
  const type: CitationType = (genre && GENRE_TYPE[genre]) || "article";

  return {
    id: `mods-${idx}`,
    type,
    title,
    authors: authors.length > 0 ? authors : undefined,
    year,
    journal,
    publisher,
    volume,
    issue,
    pages,
    doi,
    issn,
    isbn,
    abstract,
    keywords: keywords.length > 0 ? keywords : undefined,
  };
}

export function parseMods(text: string): Citation[] {
  const doc = parser.parse(text) as Record<string, unknown>;
  const collection = (doc.modsCollection ?? doc) as Record<string, unknown>;
  const modsNodes = asArray(collection.mods ?? doc.mods);
  return modsNodes
    .map((m, i) => modsToCitation(m as ModsNode, i + 1))
    .filter((c) => c.title || c.authors);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nameXml(author: string): string {
  const comma = author.indexOf(",");
  if (comma !== -1) {
    const family = author.slice(0, comma).trim();
    const given = author.slice(comma + 1).trim();
    return (
      `  <name type="personal">\n` +
      `    <namePart type="family">${esc(family)}</namePart>\n` +
      (given ? `    <namePart type="given">${esc(given)}</namePart>\n` : "") +
      `    <role><roleTerm type="text" authority="marcrelator">author</roleTerm></role>\n` +
      `  </name>\n`
    );
  }
  return (
    `  <name type="personal">\n` +
    `    <namePart>${esc(author)}</namePart>\n` +
    `    <role><roleTerm type="text" authority="marcrelator">author</roleTerm></role>\n` +
    `  </name>\n`
  );
}

export function buildMods(citations: Citation[]): string {
  const records: string[] = [];
  for (const c of citations) {
    let m = `<mods version="3.7">\n`;
    if (c.title) m += `  <titleInfo><title>${esc(c.title)}</title></titleInfo>\n`;
    for (const a of c.authors ?? []) m += nameXml(a);
    m += `  <typeOfResource>text</typeOfResource>\n`;
    m += `  <genre>${esc(TYPE_GENRE[c.type] ?? "text")}</genre>\n`;
    if (c.publisher || c.year) {
      m += `  <originInfo>\n`;
      if (c.publisher) m += `    <publisher>${esc(c.publisher)}</publisher>\n`;
      if (c.year) m += `    <dateIssued>${esc(c.year)}</dateIssued>\n`;
      m += `  </originInfo>\n`;
    }
    if (c.journal || c.volume || c.issue || c.pages) {
      m += `  <relatedItem type="host">\n`;
      if (c.journal) m += `    <titleInfo><title>${esc(c.journal)}</title></titleInfo>\n`;
      m += `    <part>\n`;
      if (c.volume) m += `      <detail type="volume"><number>${esc(c.volume)}</number></detail>\n`;
      if (c.issue) m += `      <detail type="issue"><number>${esc(c.issue)}</number></detail>\n`;
      if (c.pages) {
        const [start, end] = c.pages.split(/\s*[-–]\s*/);
        m += `      <extent unit="pages">`;
        m += `<start>${esc(start)}</start>`;
        if (end) m += `<end>${esc(end)}</end>`;
        m += `</extent>\n`;
      }
      m += `    </part>\n`;
      m += `  </relatedItem>\n`;
    }
    if (c.doi) m += `  <identifier type="doi">${esc(c.doi)}</identifier>\n`;
    if (c.issn) m += `  <identifier type="issn">${esc(c.issn)}</identifier>\n`;
    if (c.isbn) m += `  <identifier type="isbn">${esc(c.isbn)}</identifier>\n`;
    for (const k of c.keywords ?? []) m += `  <subject><topic>${esc(k)}</topic></subject>\n`;
    if (c.abstract) m += `  <abstract>${esc(c.abstract)}</abstract>\n`;
    m += `</mods>`;
    records.push(m);
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<modsCollection xmlns="http://www.loc.gov/mods/v3">\n` +
    records.join("\n") +
    `\n</modsCollection>\n`
  );
}
