/**
 * Alphabetize a RIS library by first-author surname, then year. RIS records
 * are uniformly delimited (each ends with an "ER  -" line) and never nest, so
 * we can split, reorder whole records, and rejoin without reparsing the
 * fields. That makes the sort non-lossy: every record survives byte-for-byte,
 * only the order changes.
 *
 * BibTeX is handled by an in-place slot sort: the raw text is split into
 * top-level blocks with a brace-depth + quote-aware scanner; non-entry blocks
 * (preamble text, @string, @preamble, @comment, whitespace) stay exactly where
 * they are, and only the bibliographic @entry blocks are permuted among their
 * existing positions. That keeps it non-lossy (every byte preserved, @string
 * stays before the entries) while reordering the references.
 */

interface SplitRis {
  records: string[];
  trailing: string;
}

function splitRisRecords(text: string): SplitRis {
  const lines = text.split(/\r?\n/);
  const records: string[] = [];
  let cur: string[] = [];
  for (const line of lines) {
    cur.push(line);
    if (/^ER\s{0,3}-/.test(line)) {
      records.push(cur.join("\n"));
      cur = [];
    }
  }
  return { records, trailing: cur.join("\n") };
}

/** Sort key: first-author surname (lowercased), then 4-digit year. Records
 *  with no author/year sort to the end. */
function recordSortKey(rec: string): string {
  const au = rec.match(/^(?:FAU|AU|A1)\s{0,3}-\s*(.+)$/m);
  const surname = au ? au[1].split(",")[0].trim().toLowerCase() : "~~~";
  const py = rec.match(/^(?:PY|Y1|DA)\s{0,3}-\s*(\d{4})/m);
  return `${surname}|${py ? py[1] : "9999"}`;
}

// ---- BibTeX -------------------------------------------------------------

/** @-block kinds that must NOT be reordered (they are not references and, for
 *  @string, must stay before the entries that reference them). */
const BIBTEX_PINNED = new Set(["string", "preamble", "comment"]);

interface BibtexBlock {
  kind: string; // lowercased @type, or "_pre" for inter-block text
  raw: string;
}

/** Split raw BibTeX into top-level blocks, brace-depth + quote aware. The
 *  concatenation of block.raw is always exactly the input (non-lossy). */
function splitBibtexBlocks(text: string): BibtexBlock[] {
  const blocks: BibtexBlock[] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const at = text.indexOf("@", i);
    if (at === -1) {
      if (i < n) blocks.push({ kind: "_pre", raw: text.slice(i) });
      break;
    }
    if (at > i) blocks.push({ kind: "_pre", raw: text.slice(i, at) });
    const m = /^@([A-Za-z]+)[ \t\r\n]*([{(])/.exec(text.slice(at));
    if (!m) {
      blocks.push({ kind: "_pre", raw: "@" });
      i = at + 1;
      continue;
    }
    const open = m[2];
    const close = open === "{" ? "}" : ")";
    let depth = 0;
    let j = at + m[0].length - 1;
    let inStr = false;
    for (; j < n; j++) {
      const ch = text[j];
      if (ch === '"') inStr = !inStr;
      else if (ch === open && !inStr) depth++;
      else if (ch === close && !inStr) {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    blocks.push({ kind: m[1].toLowerCase(), raw: text.slice(at, j) });
    i = j;
  }
  return blocks;
}

/** Sort key for one BibTeX entry block: first-author surname, then year.
 *  Extracted by regex so it survives string macros (journal = NAT) that trip
 *  a full parse. */
function bibtexEntryKey(raw: string): string {
  const am = raw.match(/\bauthor\s*=\s*(?:\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}|"([^"]*)")/i);
  let surname = "~~~";
  if (am) {
    const val = (am[1] ?? am[2] ?? "").trim();
    const first = val.split(/\s+and\s+/i)[0].trim();
    surname = (first.includes(",") ? first.split(",")[0] : first.split(/\s+/).pop() ?? first)
      .trim()
      .toLowerCase();
  }
  const ym = raw.match(/\byear\s*=\s*\{?\s*"?(\d{4})/i);
  return `${surname}|${ym ? ym[1] : "9999"}`;
}

export function sortBibtexEntries(text: string): string {
  const blocks = splitBibtexBlocks(text);
  const slots: number[] = [];
  const entries: Array<{ raw: string; key: string }> = [];
  blocks.forEach((b, idx) => {
    if (b.kind !== "_pre" && !BIBTEX_PINNED.has(b.kind)) {
      slots.push(idx);
      entries.push({ raw: b.raw, key: bibtexEntryKey(b.raw) });
    }
  });
  if (entries.length === 0) return text;
  entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  slots.forEach((slotIdx, k) => {
    blocks[slotIdx].raw = entries[k].raw;
  });
  return blocks.map((b) => b.raw).join("");
}

export function sortRisRecords(text: string): string {
  const { records, trailing } = splitRisRecords(text);
  if (records.length === 0) return text;
  const sorted = [...records].sort((a, b) => {
    const ka = recordSortKey(a);
    const kb = recordSortKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  let out = sorted.join("\n");
  if (trailing.trim()) out += `\n${trailing}`;
  return out.endsWith("\n") ? out : `${out}\n`;
}
