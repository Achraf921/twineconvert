/**
 * Minimal BibTeX parser/writer.
 *
 * BibTeX entries look like:
 *   @article{smith2024,
 *     author = {Smith, John and Doe, Jane},
 *     title  = {A Paper About Things},
 *     journal= {Nature},
 *     year   = {2024},
 *   }
 *
 * Field values can be wrapped in {} OR "..." OR be a bare number.
 * Multi-word fields use {...}. Authors are " and "-joined.
 *
 * v1 simplifications:
 *   - Doesn't expand @string {abbrev = "..."} macros (rare in modern exports)
 *   - Doesn't handle nested braces in values beyond depth 1 (rare in real entries)
 *   - Treats unknown entry types as "misc"
 */

import { type Citation, type CitationType, generateCitationKey } from "./citation";

const TYPE_MAP_IN: Record<string, CitationType> = {
  article: "article",
  book: "book",
  inbook: "inbook",
  incollection: "incollection",
  conference: "inproceedings",
  inproceedings: "inproceedings",
  proceedings: "inproceedings",
  phdthesis: "thesis",
  mastersthesis: "thesis",
  thesis: "thesis",
  techreport: "report",
  manual: "manual",
  misc: "misc",
  online: "online",
  electronic: "online",
  patent: "patent",
  audio: "audiovisual",
};

const TYPE_MAP_OUT: Record<CitationType, string> = {
  article: "article",
  book: "book",
  inbook: "inbook",
  incollection: "incollection",
  inproceedings: "inproceedings",
  thesis: "phdthesis",
  report: "techreport",
  manual: "manual",
  misc: "misc",
  online: "online",
  patent: "patent",
  audiovisual: "misc",
};

export function parseBibtex(text: string): Citation[] {
  const citations: Citation[] = [];
  const entryRe = /@(\w+)\s*[{(]\s*([^,\s]+)\s*,/g;
  // matchAll iterator gives us index + groups without needing the .exec loop pattern.
  const matches = Array.from(text.matchAll(entryRe));

  for (const match of matches) {
    const entryType = match[1].toLowerCase();
    const key = match[2];
    if (entryType === "string" || entryType === "comment" || entryType === "preamble") continue;

    // Walk forward from the match end to find the matching closing brace.
    const startIdx = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      i++;
    }
    const body = text.slice(startIdx, i - 1);
    const fields = parseFields(body);

    const citation: Citation = {
      id: key,
      type: TYPE_MAP_IN[entryType] ?? "misc",
      title: fields.title,
      authors: fields.author ? splitBibtexAuthors(fields.author) : undefined,
      editors: fields.editor ? splitBibtexAuthors(fields.editor) : undefined,
      year: fields.year,
      month: fields.month,
      journal: fields.journal,
      booktitle: fields.booktitle,
      publisher: fields.publisher,
      address: fields.address,
      volume: fields.volume,
      issue: fields.number ?? fields.issue,
      pages: fields.pages,
      doi: fields.doi,
      url: fields.url,
      isbn: fields.isbn,
      issn: fields.issn,
      abstract: fields.abstract,
      keywords: fields.keywords ? fields.keywords.split(/[,;]\s*/) : undefined,
    };
    citations.push(citation);
  }
  return citations;
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    if (i >= body.length) break;
    const eqIdx = body.indexOf("=", i);
    if (eqIdx < 0) break;
    const name = body.slice(i, eqIdx).trim().toLowerCase();
    i = eqIdx + 1;
    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length) break;

    let value = "";
    if (body[i] === "{") {
      let depth = 1;
      i++;
      const start = i;
      while (i < body.length && depth > 0) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}") depth--;
        if (depth > 0) i++;
      }
      value = body.slice(start, i);
      i++;
    } else if (body[i] === '"') {
      i++;
      const start = i;
      while (i < body.length && body[i] !== '"') i++;
      value = body.slice(start, i);
      i++;
    } else {
      const start = i;
      while (i < body.length && body[i] !== "," && body[i] !== "\n") i++;
      value = body.slice(start, i).trim();
    }
    fields[name] = value.trim();
  }
  return fields;
}

function splitBibtexAuthors(raw: string): string[] {
  return raw.split(/\s+and\s+/).map((a) => a.trim());
}

export function buildBibtex(citations: Citation[]): string {
  return citations
    .map((c) => {
      const id = c.id || generateCitationKey(c);
      const type = TYPE_MAP_OUT[c.type] ?? "misc";
      const fields: string[] = [];
      const add = (k: string, v?: string) => {
        if (v) fields.push(`  ${k} = {${v.replace(/\\/g, "\\\\")}}`);
      };
      add("author", c.authors?.join(" and "));
      add("editor", c.editors?.join(" and "));
      add("title", c.title);
      add("journal", c.journal);
      add("booktitle", c.booktitle);
      add("publisher", c.publisher);
      add("address", c.address);
      add("year", c.year);
      add("month", c.month);
      add("volume", c.volume);
      add("number", c.issue);
      add("pages", c.pages);
      add("doi", c.doi);
      add("url", c.url);
      add("isbn", c.isbn);
      add("issn", c.issn);
      add("abstract", c.abstract);
      add("keywords", c.keywords?.join(", "));
      return `@${type}{${id},\n${fields.join(",\n")}\n}\n`;
    })
    .join("\n");
}
