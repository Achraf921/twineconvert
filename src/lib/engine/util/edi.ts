/**
 * EDI X12 + EDIFACT parsers — text grammars used by every B2B logistics,
 * healthcare, retail, and supply-chain integration on the planet.
 *
 * Both formats are flat hierarchies of "segments" delimited by special
 * characters. Each segment starts with a 2-3 letter tag, fields are
 * delimited by element separators, and segments end with a segment
 * terminator. The actual delimiters are declared in the file header,
 * not fixed.
 *
 * X12 example (an interchange ISA):
 *   ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1200*U*00401*000000001*0*P*:~
 *   GS*PO*SENDER*RECEIVER*20240101*1200*1*X*004010~
 *   ST*850*0001~
 *   BEG*00*SA*PO12345**20240101~
 *   ...
 *   IEA*1*000000001~
 *
 * EDIFACT example:
 *   UNB+UNOC:3+SENDER+RECEIVER+240101:1200+1'
 *   UNH+1+ORDERS:D:96A:UN'
 *   BGM+220+PO12345+9'
 *   ...
 *
 * For our v1 we expose ALL segments as flat rows with the tag and a
 * field-by-field breakdown. That's the most useful thing for non-dev
 * logistics analysts who actually want to read the data — full
 * transaction-set-aware parsing (decoding ST*850 as a Purchase Order
 * with semantic field names) requires per-spec lookups that vary by
 * X12 version and would balloon scope.
 */

export interface EdiSegment {
  tag: string;
  fields: string[];
}

export function parseX12(text: string): EdiSegment[] {
  // ISA header is fixed-width — first 106 bytes contain the delimiters.
  // ISA[3] is the element separator, ISA[105] is the segment terminator.
  if (text.length < 106 || !text.startsWith("ISA")) {
    throw new Error("Not an X12 file (missing ISA header)");
  }
  const elementSep = text[3];
  const segTerm = text[105];
  return splitEdi(text, elementSep, segTerm);
}

export function parseEdifact(text: string): EdiSegment[] {
  // EDIFACT optionally starts with UNA which declares custom delimiters:
  //   UNA:+.? '   →  : (component), + (element), . (decimal), ? (release), space (reserved), ' (segment)
  // If UNA is absent, defaults are used.
  let elementSep = "+";
  let segTerm = "'";
  let body = text;
  if (text.startsWith("UNA")) {
    elementSep = text[4];
    segTerm = text[8];
    body = text.slice(9);
  }
  return splitEdi(body, elementSep, segTerm);
}

function splitEdi(text: string, elementSep: string, segTerm: string): EdiSegment[] {
  const segments: EdiSegment[] = [];
  // Strip whitespace inserted between segments by some senders for readability.
  const segmentStrings = text.split(segTerm).map((s) => s.replace(/^[\s\r\n]+/, ""));
  for (const seg of segmentStrings) {
    if (!seg) continue;
    const parts = seg.split(elementSep);
    const tag = parts[0]?.trim();
    if (!tag) continue;
    segments.push({ tag, fields: parts.slice(1) });
  }
  return segments;
}

export function segmentsToCsvRows(segments: EdiSegment[]): Record<string, string>[] {
  // Compute the max field count so we can emit consistent column widths.
  let maxFields = 0;
  for (const s of segments) if (s.fields.length > maxFields) maxFields = s.fields.length;

  return segments.map((s) => {
    const row: Record<string, string> = { Segment: s.tag };
    for (let i = 0; i < maxFields; i++) {
      row[`F${String(i + 1).padStart(2, "0")}`] = s.fields[i] ?? "";
    }
    return row;
  });
}
