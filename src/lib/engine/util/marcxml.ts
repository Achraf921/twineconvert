/**
 * MARCXML (MARC21 slim XML) parser for the bibliography family. MARCXML
 * is what library catalogs (Koha, Alma, Sierra, the Library of Congress)
 * export. Each <record> has numbered <datafield tag="..."> elements with
 * lettered <subfield code="..."> children.
 *
 * Parses INTO the unified Citation model. Import-only: writing valid MARC
 * (leader, indicators, control fields) reliably is its own project, and
 * catalogs are the source of MARC, not the destination, so there is no
 * writer here.
 *
 * Field map (subset):
 *   245 $a/$b title + subtitle   100 $a main author   700 $a added author
 *   260/264 $a place $b publisher $c date
 *   020 $a ISBN   022 $a ISSN   024 $a (ind1=7, $2=doi) DOI
 *   773 host item ($t journal, $g volume/issue/pages)
 *   520 $a abstract   650/653 $a subject keywords
 *   leader[7] bibliographic level (m=book, s=serial, a=article component)
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

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

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

/** Strip the trailing ISBD punctuation MARC subfields carry (" / : ; , ."). */
function clean(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.replace(/\s*[\/:;,]\s*$/, "").replace(/\s*\.\s*$/, "").trim() || undefined;
}

interface DataField {
  "@_tag"?: string;
  subfield?: unknown;
}

/** All datafields with a given tag. */
function fieldsByTag(record: Record<string, unknown>, tag: string): DataField[] {
  return asArray(record.datafield as DataField | DataField[]).filter(
    (df) => df && df["@_tag"] === tag,
  );
}

/** First subfield value with the given code in a datafield. */
function sub(df: DataField | undefined, code: string): string | undefined {
  if (!df) return undefined;
  for (const sf of asArray(df.subfield)) {
    if (attr(sf, "code") === code) return textOf(sf);
  }
  return undefined;
}

function subAll(df: DataField | undefined, code: string): string[] {
  if (!df) return [];
  const out: string[] = [];
  for (const sf of asArray(df.subfield)) {
    if (attr(sf, "code") === code) {
      const t = textOf(sf);
      if (t) out.push(t);
    }
  }
  return out;
}

/** "Smith, John, 1970-" -> "Smith, John" (drop trailing dates / punctuation). */
function cleanName(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.replace(/\s*,?\s*\d{4}-(\d{4})?\.?\s*$/, ""); // birth-death dates
  s = s.replace(/\s*[,.]\s*$/, "").trim();
  return s || undefined;
}

function recordToCitation(record: Record<string, unknown>, idx: number): Citation {
  // Title: 245 $a (+ $b subtitle).
  const f245 = fieldsByTag(record, "245")[0];
  const titleA = clean(sub(f245, "a"));
  const titleB = clean(sub(f245, "b"));
  const title = titleA && titleB ? `${titleA}: ${titleB}` : titleA || titleB;

  // Authors: 100 $a (main) + 700 $a (added personal).
  const authors: string[] = [];
  const main = cleanName(sub(fieldsByTag(record, "100")[0], "a"));
  if (main) authors.push(main);
  for (const f of fieldsByTag(record, "700")) {
    const n = cleanName(sub(f, "a"));
    if (n) authors.push(n);
  }

  // Publication: 264 (RDA) preferred, else 260.
  const pub = fieldsByTag(record, "264")[0] ?? fieldsByTag(record, "260")[0];
  const place = clean(sub(pub, "a"));
  const publisher = clean(sub(pub, "b"));
  const dateRaw = sub(pub, "c");
  let year = dateRaw?.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/)?.[1];

  // Identifiers.
  const isbn = clean(sub(fieldsByTag(record, "020")[0], "a"))?.replace(/\s.*$/, "");
  const issn = clean(sub(fieldsByTag(record, "022")[0], "a"));
  let doi: string | undefined;
  for (const f of fieldsByTag(record, "024")) {
    if (attr(f, "ind1") === "7" && sub(f, "2")?.toLowerCase() === "doi") {
      doi = sub(f, "a");
      break;
    }
  }

  // Host item (773) -> journal + volume/issue/pages for article components.
  const host = fieldsByTag(record, "773")[0];
  const journal = clean(sub(host, "t"));
  const g = sub(host, "g"); // e.g. "Vol. 253, no. 11 (2006), p. 1499-1508"
  let volume: string | undefined;
  let issue: string | undefined;
  let pages: string | undefined;
  if (g) {
    volume = g.match(/vol\.?\s*(\w+)/i)?.[1];
    issue = g.match(/no\.?\s*(\w+)/i)?.[1];
    pages = g.match(/p\.?\s*([\d]+\s*-\s*[\d]+|\d+)/i)?.[1]?.replace(/\s+/g, "");
    // For article components the year lives in the host-item string,
    // e.g. "Vol. 253, no. 11 (2006), p. 1499-1508".
    if (!year) year = g.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/)?.[1];
  }

  // Abstract (520) + keywords (650/653 $a).
  const abstract = clean(sub(fieldsByTag(record, "520")[0], "a"));
  const keywords: string[] = [];
  for (const tag of ["650", "653"]) {
    for (const f of fieldsByTag(record, tag)) {
      for (const k of subAll(f, "a")) {
        const c = clean(k);
        if (c) keywords.push(c);
      }
    }
  }

  // Type from leader[7] (bibliographic level) + presence of a host item.
  const leader = textOf(record.leader) ?? "";
  const level = leader[7];
  let type: CitationType;
  if (journal) type = "article";
  else if (level === "m") type = "book";
  else if (level === "a") type = "article";
  else type = "book";

  return {
    id: `marc-${idx}`,
    type,
    title,
    authors: authors.length > 0 ? authors : undefined,
    year,
    journal,
    publisher,
    address: place,
    volume,
    issue,
    pages,
    doi,
    isbn,
    issn,
    abstract,
    keywords: keywords.length > 0 ? keywords : undefined,
  };
}

export function parseMarcxml(text: string): Citation[] {
  const doc = parser.parse(text) as Record<string, unknown>;
  const collection = (doc.collection ?? doc) as Record<string, unknown>;
  const records = asArray(collection.record ?? doc.record);
  return records
    .map((r, i) => recordToCitation(r as Record<string, unknown>, i + 1))
    .filter((c) => c.title || c.authors);
}
