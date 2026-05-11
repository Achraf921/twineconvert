/**
 * HL7 v2.x parser/serializer. HL7 v2 is the messaging standard every
 * U.S. hospital system speaks (Epic, Cerner, Meditech, Allscripts) for
 * lab results, admissions, orders, billing — millions of messages per
 * day per major hospital. Format dates to 1989 and is still dominant
 * (FHIR is modern but v2 powers the operational backbone).
 *
 * Wire format (pipe + caret + tilde + ampersand delimited):
 *
 *   MSH|^~\&|SENDER|FACILITY|RECEIVER|FACILITY|20240101120000||ADT^A01|MSG001|P|2.5
 *   PID|1||12345^^^MRN||DOE^JOHN^A||19800101|M|||123 MAIN ST^^BOSTON^MA^02101
 *   PV1|1|I|2W^208^A
 *
 * Each line is a "segment" with a 3-char type code (MSH, PID, PV1, OBX, ...)
 * followed by `|`-separated fields. Inside a field, `^` separates
 * components (`DOE^JOHN^A` = last/first/middle). `~` separates repetitions
 * (multiple addresses). `&` separates sub-components.
 *
 * The MSH segment is special: its first field is the field separator
 * itself, so MSH-2 is `^~\&` (the encoding characters), and parsing of
 * subsequent fields uses those characters. Most messages use the
 * conventional defaults; we tolerate deviations.
 */

export interface Hl7Segment {
  /** 3-char segment type, e.g. "MSH", "PID", "PV1", "OBX". */
  type: string;
  /** Fields by 1-based index — `fields[0]` is the segment type itself,
   *  `fields[1]` is the first field. Arrays for repetitions; nested arrays
   *  for components and sub-components. */
  fields: string[];
}

export interface Hl7Delimiters {
  field: string;       // |
  component: string;   // ^
  repetition: string;  // ~
  escape: string;      // \
  subcomponent: string; // &
}

const DEFAULT_DELIMS: Hl7Delimiters = {
  field: "|",
  component: "^",
  repetition: "~",
  escape: "\\",
  subcomponent: "&",
};

export function parseHl7(text: string): Hl7Segment[] {
  // HL7 messages use \r (CR) as segment terminator per spec; many tools
  // emit \n or \r\n. Normalize all to \n for consistent splitting.
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    throw new Error("HL7 message is empty");
  }

  // First line MUST be MSH; sniff the delimiters from MSH-1 (field separator
  // is byte 4 of "MSH|") and MSH-2 (encoding characters).
  const first = lines[0];
  if (!first.startsWith("MSH")) {
    throw new Error(
      `HL7 messages must start with an MSH segment; got "${first.slice(0, 10)}..."`,
    );
  }
  const delims: Hl7Delimiters = {
    field: first.charAt(3),
    component: first.charAt(4),
    repetition: first.charAt(5),
    escape: first.charAt(6),
    subcomponent: first.charAt(7),
  };

  return lines.map((line) => {
    const fields = line.split(delims.field);
    // SPECIAL CASE: MSH-1 (the field separator itself) doesn't appear as a
    // distinct token between segment ID and MSH-2 — there's only ONE
    // separator character there. So a naive split shifts MSH fields by 1.
    // The HL7 spec defines MSH-1 = the field separator character; we
    // re-insert it so MSH.N is consistent with how every other segment is
    // numbered (and so the round-trip with buildHl7 closes correctly).
    if (fields[0] === "MSH") {
      fields.splice(1, 0, delims.field);
    }
    return { type: fields[0], fields };
  });
}

/** Convert HL7 segments to a JSON-friendly nested object. Preserves
 *  segment type, field index, repetitions, and components. */
export function hl7ToTree(segments: Hl7Segment[]): Record<string, unknown> {
  const out: Record<string, unknown[]> = {};
  for (const seg of segments) {
    if (!out[seg.type]) out[seg.type] = [];
    // For each field beyond [0] (the segment type), expand components
    const fieldObj: Record<string, unknown> = {};
    for (let i = 1; i < seg.fields.length; i++) {
      const raw = seg.fields[i];
      if (!raw) continue;
      // Split repetitions on ~, then components on ^
      const reps = raw.split("~");
      const expanded = reps.map((rep) => {
        const comps = rep.split("^");
        return comps.length === 1 ? comps[0] : comps;
      });
      // If only one repetition, unwrap the single-element array
      fieldObj[`${seg.type}.${i}`] = expanded.length === 1 ? expanded[0] : expanded;
    }
    out[seg.type].push(fieldObj);
  }
  return out;
}

/** Build HL7 v2.5 wire format from parsed segments. Uses default
 *  delimiters (the ones every implementation defaults to). */
export function buildHl7(segments: Hl7Segment[]): string {
  const d = DEFAULT_DELIMS;
  const lines = segments.map((seg) => {
    // Reverse of the parser's MSH special case: emit "MSH" + the field
    // separator (which IS MSH-1) + the rest joined with the field
    // separator. Otherwise we'd emit "MSH||^~\&|..." (note the double
    // pipe), which re-parses with an off-by-one shift.
    if (seg.type === "MSH" && seg.fields.length > 1 && seg.fields[1] === d.field) {
      return "MSH" + d.field + seg.fields.slice(2).join(d.field);
    }
    return seg.fields.join(d.field);
  });
  // Conventional segment terminator is \r per spec; emitting \n as well
  // for cross-platform compatibility (most parsers tolerate both).
  return lines.join("\r\n") + "\r\n";
}

/** Build segments from a JSON tree (the inverse of hl7ToTree). */
export function treeToHl7(tree: Record<string, unknown>): Hl7Segment[] {
  const segments: Hl7Segment[] = [];
  for (const [type, segArr] of Object.entries(tree)) {
    if (!Array.isArray(segArr)) continue;
    for (const seg of segArr) {
      if (typeof seg !== "object" || seg === null) continue;
      const segObj = seg as Record<string, unknown>;
      // Find max field index from key suffixes
      let maxIdx = 0;
      for (const k of Object.keys(segObj)) {
        const m = k.match(/\.(\d+)$/);
        if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
      }
      const fields: string[] = new Array(maxIdx + 1).fill("");
      fields[0] = type;
      for (const [k, v] of Object.entries(segObj)) {
        const m = k.match(/\.(\d+)$/);
        if (!m) continue;
        const idx = parseInt(m[1], 10);
        fields[idx] = encodeValue(v);
      }
      segments.push({ type, fields });
    }
  }
  return segments;
}

function encodeValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    // Repetitions: join with ~; each rep may itself be a component array
    return v.map(encodeComponents).join("~");
  }
  return String(v);
}

function encodeComponents(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map((c) => (c == null ? "" : String(c))).join("^");
  return String(v);
}

/** Flatten segments into rows for CSV (one row per segment instance,
 *  one column per field index per segment type). Useful for analytics
 *  and quick triage of HL7 batches. */
export function hl7ToRows(segments: Hl7Segment[]): { headers: string[]; rows: string[][] } {
  // Compute the union of all column names across every segment instance
  const colSet = new Set<string>();
  for (const seg of segments) {
    for (let i = 1; i < seg.fields.length; i++) {
      if (seg.fields[i]) colSet.add(`${seg.type}.${i}`);
    }
  }
  const headers = ["segment", ...Array.from(colSet).sort()];
  const rows = segments.map((seg) => {
    const row = [seg.type];
    for (let h = 1; h < headers.length; h++) {
      const col = headers[h];
      const m = col.match(/^([A-Z0-9]+)\.(\d+)$/);
      if (!m || m[1] !== seg.type) {
        row.push("");
        continue;
      }
      row.push(seg.fields[parseInt(m[2], 10)] ?? "");
    }
    return row;
  });
  return { headers, rows };
}
