/**
 * Gettext PO (Portable Object) parser/writer.
 *
 * PO files are the de-facto interchange format for software localization.
 * Every gettext-based toolchain (GNU gettext, Babel, Poedit, Lokalise,
 * Crowdin, Weblate, Transifex, polib, react-i18next, etc.) speaks PO.
 *
 * A real PO entry can carry:
 *
 *     #  translator comment
 *     #. developer comment (extracted from source)
 *     #: file:line  (where the string appears)
 *     #, fuzzy, c-format  (flags)
 *     msgctxt "disambiguation context"
 *     msgid "Hello"
 *     msgid_plural "Hellos"
 *     msgstr[0] "Hola"
 *     msgstr[1] "Holas"
 *
 * Or the simpler singular form:
 *
 *     msgid "Bye"
 *     msgstr "Adiós"
 *
 * Multi-line strings concatenate across consecutive "..." lines, and
 * embedded characters use C-style escapes (\n, \t, \", \\, \r).
 *
 * Lines starting with #~ are "obsolete" entries kept around as
 * translation memory; we drop them on parse and don't emit them on build.
 */

export interface PoEntry {
  /** Disambiguation context, for when the same English word means different things. */
  msgctxt?: string;
  /** The source string (key). Empty msgid "" is the metadata header. */
  msgid: string;
  /** Plural source string. Presence here flips msgstr to an array. */
  msgid_plural?: string;
  /**
   * Translation. String for singular entries; string[] indexed by plural
   * form for plural entries. Order matches msgstr[0], msgstr[1], ...
   */
  msgstr: string | string[];
  /** Translator comments ("# foo"). */
  comments?: string[];
  /** Developer comments ("#. foo"). Stored separately so emit order is correct. */
  extracted_comments?: string[];
  /** Source references ("#: file.js:42"). */
  references?: string[];
  /** Flags ("#, fuzzy, c-format"). */
  flags?: string[];
}

const HEADER = "PO";

function unescapePoString(s: string): string {
  // Standard gettext escapes. Process in one pass to handle \\ correctly.
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && i + 1 < s.length) {
      const next = s[i + 1];
      i++;
      switch (next) {
        case "n": out += "\n"; break;
        case "t": out += "\t"; break;
        case "r": out += "\r"; break;
        case '"': out += '"'; break;
        case "\\": out += "\\"; break;
        default: out += next; // unknown escape: keep the literal char
      }
    } else {
      out += c;
    }
  }
  return out;
}

function escapePoString(s: string): string {
  return `"${s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r")}"`;
}

/** Extract the content between the outer quotes of a PO string line. */
function extractQuoted(s: string): string {
  const trimmed = s.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return "";
  return trimmed.slice(1, -1);
}

export function parsePo(text: string): PoEntry[] {
  // Strip UTF-8 BOM (common from Windows / Poedit Windows exports).
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  type Draft = {
    msgctxt?: string;
    msgid?: string;
    msgid_plural?: string;
    msgstrs: Record<number, string>; // -1 = singular msgstr, 0..N = plural
    comments: string[];
    extracted: string[];
    references: string[];
    flags: string[];
    obsolete: boolean;
  };

  const empty = (): Draft => ({
    msgstrs: {},
    comments: [],
    extracted: [],
    references: [],
    flags: [],
    obsolete: false,
  });

  let current = empty();
  let lastField: "msgctxt" | "msgid" | "msgid_plural" | "msgstr" | null = null;
  let lastMsgstrIdx = -1;
  const entries: PoEntry[] = [];

  const flush = () => {
    if (current.obsolete || current.msgid === undefined) {
      current = empty();
      lastField = null;
      return;
    }
    const isPlural = current.msgid_plural !== undefined;
    let msgstr: string | string[];
    if (isPlural) {
      const keys = Object.keys(current.msgstrs)
        .map(Number)
        .filter((k) => k >= 0)
        .sort((a, b) => a - b);
      msgstr = keys.length ? keys.map((k) => current.msgstrs[k] ?? "") : [""];
    } else {
      msgstr = current.msgstrs[-1] ?? current.msgstrs[0] ?? "";
    }
    const e: PoEntry = { msgid: current.msgid, msgstr };
    if (current.msgctxt !== undefined) e.msgctxt = current.msgctxt;
    if (current.msgid_plural !== undefined) e.msgid_plural = current.msgid_plural;
    if (current.comments.length) e.comments = current.comments;
    if (current.extracted.length) e.extracted_comments = current.extracted;
    if (current.references.length) e.references = current.references;
    if (current.flags.length) e.flags = current.flags;
    entries.push(e);
    current = empty();
    lastField = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine;
    if (!line.trim()) {
      flush();
      continue;
    }
    // Comment forms: '# ', '#.', '#:', '#,', '#~', or bare '#'.
    if (line.startsWith("#")) {
      const c1 = line[1];
      const rest = line.slice(2).trim();
      if (c1 === "~") {
        // Obsolete entry. Keep parsing fields but flag the whole entry to drop on flush.
        current.obsolete = true;
        continue;
      } else if (c1 === ".") {
        current.extracted.push(rest);
      } else if (c1 === ":") {
        // Multiple refs may share one line, split on whitespace.
        for (const ref of rest.split(/\s+/).filter(Boolean)) current.references.push(ref);
      } else if (c1 === ",") {
        for (const f of rest.split(/\s*,\s*/).filter(Boolean)) current.flags.push(f);
      } else {
        // bare '#' or '# foo' = translator comment
        current.comments.push(line.slice(1).replace(/^\s/, ""));
      }
      continue;
    }
    // Field lines: "msgctxt|msgid|msgid_plural|msgstr|msgstr[N] \"...\""
    const m = line.match(/^(msgctxt|msgid_plural|msgid|msgstr(?:\[(\d+)\])?)\s+(.*)$/);
    if (m) {
      const kind = m[1];
      const idx = m[2] !== undefined ? Number(m[2]) : null;
      const value = unescapePoString(extractQuoted(m[3]));
      if (kind === "msgctxt") {
        current.msgctxt = value;
        lastField = "msgctxt";
      } else if (kind === "msgid") {
        current.msgid = value;
        lastField = "msgid";
      } else if (kind === "msgid_plural") {
        current.msgid_plural = value;
        lastField = "msgid_plural";
      } else if (kind === "msgstr" && idx === null) {
        current.msgstrs[-1] = value;
        lastField = "msgstr";
        lastMsgstrIdx = -1;
      } else if (kind.startsWith("msgstr[") && idx !== null) {
        current.msgstrs[idx] = value;
        lastField = "msgstr";
        lastMsgstrIdx = idx;
      }
      continue;
    }
    // Continuation: lines starting with `"` concatenate onto the previous
    // field. PO writers wrap long strings into multiple "..." lines.
    if (line.trimStart().startsWith('"')) {
      const value = unescapePoString(extractQuoted(line));
      if (lastField === "msgctxt") current.msgctxt = (current.msgctxt ?? "") + value;
      else if (lastField === "msgid") current.msgid = (current.msgid ?? "") + value;
      else if (lastField === "msgid_plural")
        current.msgid_plural = (current.msgid_plural ?? "") + value;
      else if (lastField === "msgstr") {
        current.msgstrs[lastMsgstrIdx] = (current.msgstrs[lastMsgstrIdx] ?? "") + value;
      }
    }
  }
  flush();
  return entries;
}

export function buildPo(entries: PoEntry[]): string {
  const out: string[] = [];
  for (const e of entries) {
    for (const c of e.comments ?? []) out.push(c ? `# ${c}` : "#");
    for (const c of e.extracted_comments ?? []) out.push(`#. ${c}`);
    for (const r of e.references ?? []) out.push(`#: ${r}`);
    if (e.flags?.length) out.push(`#, ${e.flags.join(", ")}`);
    if (e.msgctxt !== undefined) out.push(`msgctxt ${escapePoString(e.msgctxt)}`);
    out.push(`msgid ${escapePoString(e.msgid)}`);
    if (e.msgid_plural !== undefined) {
      out.push(`msgid_plural ${escapePoString(e.msgid_plural)}`);
      const arr = Array.isArray(e.msgstr) ? e.msgstr : [String(e.msgstr ?? "")];
      arr.forEach((v, i) => out.push(`msgstr[${i}] ${escapePoString(v)}`));
    } else {
      const s = Array.isArray(e.msgstr) ? (e.msgstr[0] ?? "") : (e.msgstr ?? "");
      out.push(`msgstr ${escapePoString(s)}`);
    }
    out.push("");
  }
  return out.join("\n");
}

// Tag the module so consumers can do a quick type assertion in tests.
export const PO_FORMAT_NAME = HEADER;
