/**
 * Subtitle parser + writer for the SRT and WebVTT cross-conversion.
 *
 * SRT (SubRip Subtitle) format:
 *   1
 *   00:00:01,000 --> 00:00:04,000
 *   First caption text
 *
 *   2
 *   00:00:05,000 --> 00:00:08,000
 *   Second caption
 *
 * WebVTT format (W3C):
 *   WEBVTT
 *
 *   00:00:01.000 --> 00:00:04.000
 *   First caption text
 *
 *   00:00:05.000 --> 00:00:08.000
 *   Second caption
 *
 * Differences are essentially syntactic: SRT uses `,` as decimal in
 * timestamps, VTT uses `.`; VTT has a header line; VTT can carry cue
 * settings (position, alignment) after the timestamp on the same line.
 * Caption text is identical between the two.
 */

export interface Cue {
  /** Cue index (SRT explicit, VTT implicit by order). */
  index: number;
  /** Start time in milliseconds from the start of the media. */
  startMs: number;
  /** End time in milliseconds. */
  endMs: number;
  /** Caption text. May contain `\n` for multi-line cues. */
  text: string;
}

const TIMESTAMP_SRT = /^(\d{1,2}):(\d{2}):(\d{2}),(\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2}),(\d{1,3})/;
const TIMESTAMP_VTT = /^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})/;
// SBV (YouTube SubViewer): `H:MM:SS.mmm,H:MM:SS.mmm` — comma between start
// and end (no `-->`), single-digit hour allowed, `.` decimal like VTT.
const TIMESTAMP_SBV = /^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3}),(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})/;

function partsToMs(h: string, m: string, s: string, ms: string): number {
  return (
    parseInt(h, 10) * 3600_000 +
    parseInt(m, 10) * 60_000 +
    parseInt(s, 10) * 1_000 +
    parseInt(ms.padEnd(3, "0").slice(0, 3), 10)
  );
}

/**
 * Parse SRT or WebVTT into a normalized array of cues. Auto-detects
 * format from the first non-blank line: "WEBVTT" header = VTT, anything
 * else (typically an integer cue index) = SRT. Lenient on trailing
 * whitespace, BOM, CRLF.
 */
export function parseSubtitle(text: string): Cue[] {
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = text.split(/\r?\n/);
  const cues: Cue[] = [];
  let i = 0;
  let cueIndex = 0;
  let sawHeader = false;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    if (!sawHeader && /^WEBVTT/i.test(line)) {
      sawHeader = true;
      i++;
      continue;
    }

    let timestampLine = line;
    let match =
      timestampLine.match(TIMESTAMP_SRT) ||
      timestampLine.match(TIMESTAMP_VTT) ||
      timestampLine.match(TIMESTAMP_SBV);

    // SRT often puts the index on its own line above the timestamp.
    if (!match && /^\d+$/.test(line) && i + 1 < lines.length) {
      timestampLine = lines[i + 1].trim();
      match =
        timestampLine.match(TIMESTAMP_SRT) ||
        timestampLine.match(TIMESTAMP_VTT) ||
        timestampLine.match(TIMESTAMP_SBV);
      if (match) i++;
    }

    if (!match) {
      i++;
      continue;
    }

    const startMs = partsToMs(match[1], match[2], match[3], match[4]);
    const endMs = partsToMs(match[5], match[6], match[7], match[8]);

    i++;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }

    cues.push({
      index: ++cueIndex,
      startMs,
      endMs,
      text: textLines.join("\n").trim(),
    });
  }

  return cues;
}

function msToSrtTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const millis = ms % 1_000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function msToVttTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const millis = ms % 1_000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function buildSrt(cues: Cue[]): string {
  const blocks: string[] = [];
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    blocks.push(
      `${i + 1}\n${msToSrtTimestamp(c.startMs)} --> ${msToSrtTimestamp(c.endMs)}\n${c.text}\n`,
    );
  }
  return blocks.join("\n");
}

export function buildVtt(cues: Cue[]): string {
  const blocks: string[] = ["WEBVTT\n"];
  for (const c of cues) {
    blocks.push(
      `${msToVttTimestamp(c.startMs)} --> ${msToVttTimestamp(c.endMs)}\n${c.text}\n`,
    );
  }
  return blocks.join("\n");
}

/** SBV uses single-digit hours like `0:00:01.000` (YouTube convention). */
function msToSbvTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const millis = ms % 1_000;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function buildSbv(cues: Cue[]): string {
  const blocks: string[] = [];
  for (const c of cues) {
    blocks.push(
      `${msToSbvTimestamp(c.startMs)},${msToSbvTimestamp(c.endMs)}\n${c.text}\n`,
    );
  }
  return blocks.join("\n");
}

// ============================================================================
// ASS (Advanced SubStation Alpha) - the format used by Aegisub and most
// fansubbed anime. Spec-wise it's a section-based INI: [Script Info],
// [V4+ Styles], [Events]. We support a lossless-ish round-trip for the
// caption text + timing; complex styling (positioning, fonts, colors)
// is dropped on the way IN to our Cue model and a sane default style is
// emitted on the way OUT.
// ============================================================================

/** ASS timestamp: `H:MM:SS.cc` (centiseconds, NOT milliseconds). */
function assTimeToMs(t: string): number {
  const m = t.trim().match(/^(\d+):(\d{1,2}):(\d{1,2})\.(\d{1,2})/);
  if (!m) return 0;
  return (
    parseInt(m[1], 10) * 3_600_000 +
    parseInt(m[2], 10) * 60_000 +
    parseInt(m[3], 10) * 1_000 +
    parseInt(m[4].padEnd(2, "0"), 10) * 10
  );
}

function msToAssTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const cs = Math.floor((ms % 1_000) / 10);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/**
 * Strip ASS inline override codes ({\b1}, {\i1}, {\fnArial}, etc.) and
 * convert ASS hard-break sequences (\N for hard, \n for soft, \h for
 * non-breaking space) to plain text suitable for our Cue model.
 */
function stripAssOverrides(text: string): string {
  return text
    .replace(/\{[^}]*\}/g, "") // override blocks
    .replace(/\\h/g, " ") // non-breaking space
    .replace(/\\[Nn]/g, "\n") // hard / soft line breaks
    .trim();
}

/**
 * Encode plain text back to an ASS-safe Text field. We only need to
 * convert literal newlines back to `\N` and avoid stray brace characters
 * that would be interpreted as override blocks.
 */
function encodeAssText(text: string): string {
  return text.replace(/\r?\n/g, "\\N").replace(/\{/g, "(").replace(/\}/g, ")");
}

/**
 * Parse an ASS file's [Events] section into our Cue array. Other
 * sections ([Script Info], [V4+ Styles]) are skipped — they don't carry
 * timing or caption text.
 *
 * Real ASS files often include `Comment:` lines alongside `Dialogue:`
 * (translator notes, karaoke markers). We drop those.
 */
export function parseAss(text: string): Cue[] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = text.split(/\r?\n/);
  const cues: Cue[] = [];
  let inEvents = false;
  let eventFormat: string[] | null = null;
  let cueIndex = 1;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("!:")) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      inEvents = /events/i.test(line);
      eventFormat = null;
      continue;
    }
    if (!inEvents) continue;
    if (/^Format:/i.test(line)) {
      eventFormat = line
        .slice(line.indexOf(":") + 1)
        .split(",")
        .map((s) => s.trim());
      continue;
    }
    if (!/^Dialogue:/i.test(line)) continue;
    if (!eventFormat) {
      // Default ASS v4+ Events format when the file omits one
      eventFormat = [
        "Layer", "Start", "End", "Style", "Name",
        "MarginL", "MarginR", "MarginV", "Effect", "Text",
      ];
    }
    // Split values by comma but keep everything after the last
    // (length-1) commas as a single Text field — ASS dialogue text
    // legitimately contains commas.
    const values: string[] = [];
    let rest = line.slice(line.indexOf(":") + 1).trim();
    for (let i = 0; i < eventFormat.length - 1; i++) {
      const idx = rest.indexOf(",");
      if (idx === -1) break;
      values.push(rest.slice(0, idx));
      rest = rest.slice(idx + 1);
    }
    values.push(rest);
    const fields: Record<string, string> = {};
    eventFormat.forEach((name, i) => (fields[name] = (values[i] ?? "").trim()));
    const start = fields.Start ? assTimeToMs(fields.Start) : 0;
    const end = fields.End ? assTimeToMs(fields.End) : 0;
    const captionText = stripAssOverrides(fields.Text ?? "");
    if (!captionText) continue;
    cues.push({ index: cueIndex++, startMs: start, endMs: end, text: captionText });
  }
  return cues;
}

/**
 * Build a complete, parseable ASS v4+ file from a Cue array. Includes:
 *   - [Script Info] with title + script type
 *   - [V4+ Styles] with a single Default style (Arial 20, white)
 *   - [Events] with Dialogue lines, one per cue
 *
 * Aegisub, VLC, MPV, mpv-style players, and the libass renderer all
 * accept this output as a valid ASS subtitle track.
 */
export function buildAss(cues: Cue[], title = "Converted via twineconvert"): string {
  const out: string[] = [];
  out.push("[Script Info]");
  out.push(`Title: ${title}`);
  out.push("ScriptType: v4.00+");
  out.push("WrapStyle: 0");
  out.push("ScaledBorderAndShadow: yes");
  out.push("YCbCr Matrix: TV.709");
  out.push("");
  out.push("[V4+ Styles]");
  out.push(
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, " +
      "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, " +
      "Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  );
  // Default style: Arial 20pt, white text, black outline, no italics/bold,
  // alignment 2 (bottom center).
  out.push(
    "Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000," +
      "0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1",
  );
  out.push("");
  out.push("[Events]");
  out.push(
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  );
  for (const c of cues) {
    out.push(
      `Dialogue: 0,${msToAssTime(c.startMs)},${msToAssTime(c.endMs)},Default,,0,0,0,,${encodeAssText(c.text)}`,
    );
  }
  return out.join("\n") + "\n";
}
