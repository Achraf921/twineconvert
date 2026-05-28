/**
 * LRC lyrics format parse + build. LRC is the de facto karaoke /
 * lyric-display format: each line is `[mm:ss.xx]Lyric text`. Multiple
 * timestamps can precede one line for repeated choruses
 * (`[00:30.00][01:30.00]Refrain`); we expand those into individual cues
 * so the conversion to SRT/VTT is one-cue-per-occurrence.
 *
 * Bridges into the existing subtitle Cue model (startMs, endMs, text)
 * so the subtitle cluster's writers (buildSrt, buildVtt) work without
 * modification.
 */

import type { Cue } from "./subtitle";

const LRC_LINE = /^((?:\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\])+)(.*)$/;
const TIMESTAMP = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

interface LrcMeta {
  ar?: string; // artist
  ti?: string; // title
  al?: string; // album
}

export interface ParsedLrc {
  meta: LrcMeta;
  cues: Cue[];
}

function tsToMs(min: string, sec: string, frac: string | undefined): number {
  let ms = 0;
  if (frac) {
    // LRC fractional part is 2 or 3 digits (centi- or millisecond).
    if (frac.length === 2) ms = parseInt(frac, 10) * 10;
    else if (frac.length === 1) ms = parseInt(frac, 10) * 100;
    else ms = parseInt(frac, 10);
  }
  return parseInt(min, 10) * 60_000 + parseInt(sec, 10) * 1000 + ms;
}

export function parseLrc(text: string): ParsedLrc {
  const meta: LrcMeta = {};
  // Strip BOM, normalise newlines.
  const lines = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
  const raw: Array<{ startMs: number; text: string }> = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Metadata tags: [ar:Artist], [ti:Title], [al:Album]
    const metaMatch = line.match(/^\[(ar|ti|al):\s*(.*?)\]$/i);
    if (metaMatch) {
      meta[metaMatch[1].toLowerCase() as keyof LrcMeta] = metaMatch[2].trim();
      continue;
    }
    const m = line.match(LRC_LINE);
    if (!m) continue;
    const stamps = m[1];
    const lyric = m[2].trim();
    // Use matchAll so we collect every timestamp on the line.
    for (const tsMatch of stamps.matchAll(TIMESTAMP)) {
      raw.push({ startMs: tsToMs(tsMatch[1], tsMatch[2], tsMatch[3]), text: lyric });
    }
  }
  // Sort by time, then compute endMs as the next cue's startMs (or
  // last cue's startMs + 4s as a sensible default).
  raw.sort((a, b) => a.startMs - b.startMs);
  const cues: Cue[] = raw.map((c, i) => {
    const endMs =
      i + 1 < raw.length ? raw[i + 1].startMs : c.startMs + 4000;
    return { index: i + 1, startMs: c.startMs, endMs, text: c.text };
  });
  return { meta, cues };
}

export function buildLrc(cues: Cue[], meta: LrcMeta = {}): string {
  const lines: string[] = [];
  if (meta.ar) lines.push(`[ar:${meta.ar}]`);
  if (meta.ti) lines.push(`[ti:${meta.ti}]`);
  if (meta.al) lines.push(`[al:${meta.al}]`);
  for (const cue of cues) {
    lines.push(`${formatLrcTimestamp(cue.startMs)}${cue.text}`);
  }
  return lines.join("\n") + "\n";
}

function formatLrcTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const cs = Math.round((ms % 1000) / 10); // centiseconds
  const csStr = cs.toString().padStart(2, "0");
  const secStr = sec.toString().padStart(2, "0");
  const minStr = min.toString().padStart(2, "0");
  return `[${minStr}:${secStr}.${csStr}]`;
}
