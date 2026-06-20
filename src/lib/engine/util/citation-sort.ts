/**
 * Alphabetize a RIS library by first-author surname, then year. RIS records
 * are uniformly delimited (each ends with an "ER  -" line) and never nest, so
 * we can split, reorder whole records, and rejoin without reparsing the
 * fields. That makes the sort non-lossy: every record survives byte-for-byte,
 * only the order changes.
 *
 * (BibTeX is intentionally not handled here: a lossless raw sort of arbitrary
 * BibTeX must cope with nested braces, quote-delimited values and @string
 * ordering, which risks corrupting a valid file without a full tokenizer.)
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
