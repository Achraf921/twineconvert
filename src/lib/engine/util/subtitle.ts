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
      timestampLine.match(TIMESTAMP_VTT);

    // SRT often puts the index on its own line above the timestamp.
    if (!match && /^\d+$/.test(line) && i + 1 < lines.length) {
      timestampLine = lines[i + 1].trim();
      match =
        timestampLine.match(TIMESTAMP_SRT) ||
        timestampLine.match(TIMESTAMP_VTT);
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
