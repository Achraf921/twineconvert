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
 * Real-world quirks we handle (caught via PostHog convert_error on
 * /bibtex-to-ris from a Spanish-speaking user):
 *   - BOM at file start (Windows Notepad UTF-8-with-BOM)
 *   - Entries with no trailing comma after key (`@misc{key}` with no fields)
 *   - Paren-delimited entries: `@article(key, ...)` (legacy style)
 *   - LaTeX accent macros in field values: `Garc{\'i}a` -> `García`
 *   - BibTeX case-preservation braces: `{NASA}` -> `NASA`
 *
 * v1 simplifications still in place:
 *   - Doesn't expand @string {abbrev = "..."} macros
 *   - Treats unknown entry types as "misc"
 */

import { type Citation, type CitationType, generateCitationKey } from "./citation";

// LaTeX accent macros that real bibliography files actually use. Map of
// (accent char after backslash) -> (base char -> Unicode result).
const LATEX_ACCENT_MAP: Record<string, Record<string, string>> = {
  "'": { a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý", c: "ć", n: "ń", r: "ŕ", s: "ś", z: "ź", l: "ĺ",
    A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", Y: "Ý", C: "Ć", N: "Ń", R: "Ŕ", S: "Ś", Z: "Ź" },
  "`": { a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù" },
  '"': { a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", y: "ÿ", A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü" },
  "~": { a: "ã", n: "ñ", o: "õ", A: "Ã", N: "Ñ", O: "Õ" },
  "^": { a: "â", e: "ê", i: "î", o: "ô", u: "û", A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û" },
  "=": { a: "ā", e: "ē", i: "ī", o: "ō", u: "ū", A: "Ā", E: "Ē", I: "Ī", O: "Ō", U: "Ū" },
  ".": { c: "ċ", e: "ė", g: "ġ", z: "ż", I: "İ" },
  c: { c: "ç", s: "ş", e: "ȩ", C: "Ç", S: "Ş", E: "Ȩ" },
  v: { c: "č", s: "š", z: "ž", n: "ň", r: "ř", C: "Č", S: "Š", Z: "Ž", N: "Ň", R: "Ř" },
  u: { a: "ă", g: "ğ", A: "Ă", G: "Ğ" },
};

// Special LaTeX commands that map directly to a single Unicode character.
const LATEX_SPECIAL_MAP: Record<string, string> = {
  ss: "ß", aa: "å", AA: "Å", o: "ø", O: "Ø", l: "ł", L: "Ł",
  ae: "æ", AE: "Æ", oe: "œ", OE: "Œ", i: "ı", j: "ȷ",
};

/**
 * Decode common LaTeX accent macros to their Unicode equivalents and strip
 * BibTeX case-preservation braces. Idempotent: text without any LaTeX
 * markup passes through unchanged.
 *
 * Examples:
 *   "Garc{\\'i}a"   -> "García"
 *   "M\\'exico"     -> "México"
 *   "Mu\\~noz"      -> "Muñoz"
 *   "{NASA}"        -> "NASA"
 *   "\\ss"          -> "ß"
 */
export function decodeLatex(s: string | undefined): string | undefined {
  if (s == null) return s;
  let out = s;
  // Accent macros: handle every common bracing variant in one regex.
  //   \'a       \'{a}       {\'a}       {\'{a}}
  out = out.replace(
    /\{?\\([\'`^"~=.cvub])\{?([a-zA-Z])\}?\}?/g,
    (m, accent, ch) => LATEX_ACCENT_MAP[accent]?.[ch] ?? m,
  );
  // Special-character commands: \ss, \aa, \ae, \o, \l, dotless \i, \j.
  // We require the command end at a non-letter boundary so `\or` doesn't
  // become `ør`. Optional trailing braces `{}` are common in LaTeX.
  out = out.replace(/\\([a-zA-Z]+)\{?\}?(?=[^a-zA-Z]|$)/g, (m, name) => LATEX_SPECIAL_MAP[name] ?? m);
  // Strip BibTeX case-preservation braces. Only innermost {...} wrapping
  // plain text -- preserves accent-decoded characters from the steps above.
  out = out.replace(/\{([^{}]*)\}/g, "$1");
  return out.trim();
}

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
  // Strip UTF-8 BOM: Windows Notepad saves text files with a leading
  // U+FEFF byte sequence, which doesn't break our entry regex (since it
  // scans for `@` anywhere) but does break key/author fields that start
  // at offset 0 of any value.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const citations: Citation[] = [];
  // Entry header. Differences from the original regex:
  //   - Captures the opening delimiter so we can match its closing pair
  //     (matters for `@article(key, ...)` style)
  //   - Trailing comma is optional: `@misc{key}` with no fields, or
  //     legacy/hand-edited files that lack the comma still parse
  //   - Key character class excludes both close delimiters AND comma
  const entryRe = /@(\w+)\s*([{(])\s*([^,\s)}]+)\s*,?/g;

  for (const match of text.matchAll(entryRe)) {
    const entryType = match[1].toLowerCase();
    const openChar = match[2];
    const closeChar = openChar === "{" ? "}" : ")";
    const key = match[3];
    if (entryType === "string" || entryType === "comment" || entryType === "preamble") continue;

    // Walk forward from the match end to find the matching closing
    // delimiter. We count balanced open/close of the entry delimiter
    // (either {} or ()) so paren-style entries terminate correctly.
    const startIdx = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (c === openChar) depth++;
      else if (c === closeChar) depth--;
      i++;
    }
    if (depth > 0) i = text.length + 1; // unbalanced; take through EOF
    const body = text.slice(startIdx, i - 1);
    const fields = parseFields(body);

    const citation: Citation = {
      id: key,
      type: TYPE_MAP_IN[entryType] ?? "misc",
      title: decodeLatex(fields.title),
      authors: fields.author
        ? splitBibtexAuthors(fields.author).map((a) => decodeLatex(a) ?? a)
        : undefined,
      editors: fields.editor
        ? splitBibtexAuthors(fields.editor).map((a) => decodeLatex(a) ?? a)
        : undefined,
      year: fields.year,
      month: fields.month,
      journal: decodeLatex(fields.journal),
      booktitle: decodeLatex(fields.booktitle),
      publisher: decodeLatex(fields.publisher),
      address: decodeLatex(fields.address),
      volume: fields.volume,
      issue: fields.number ?? fields.issue,
      pages: fields.pages,
      doi: fields.doi,
      url: fields.url,
      isbn: fields.isbn,
      issn: fields.issn,
      abstract: decodeLatex(fields.abstract),
      keywords: fields.keywords
        ? fields.keywords.split(/[,;]\s*/).map((k) => decodeLatex(k) ?? k)
        : undefined,
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
