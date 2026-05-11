/**
 * Deep unit tests for subtitle.ts. Subtitles fail in ugly ways — a wrong
 * timestamp by 10ms can desync captions across an entire video. We
 * verify exact ms preservation and cross-format equivalence.
 */

import { describe, it, expect } from "vitest";
import { parseSubtitle, buildSrt, buildVtt, buildSbv } from "../src/lib/engine/util/subtitle";

const srtFixture = `1
00:00:01,000 --> 00:00:04,000
First caption

2
00:00:05,500 --> 00:00:08,250
Second caption
spanning two lines
`;

const vttFixture = `WEBVTT

00:00:01.000 --> 00:00:04.000
First caption

00:00:05.500 --> 00:00:08.250
Second caption
spanning two lines
`;

const sbvFixture = `0:00:01.000,0:00:04.000
First caption

0:00:05.500,0:00:08.250
Second caption
spanning two lines
`;

describe("subtitle: parser preserves exact cue timing", () => {
  it("SRT timestamps parse to the exact millisecond", () => {
    const cues = parseSubtitle(srtFixture);
    expect(cues).toHaveLength(2);
    expect(cues[0].startMs).toBe(1000);
    expect(cues[0].endMs).toBe(4000);
    expect(cues[1].startMs).toBe(5500);
    expect(cues[1].endMs).toBe(8250);
  });

  it("VTT timestamps parse identically to SRT (period vs comma decimal)", () => {
    const cues = parseSubtitle(vttFixture);
    expect(cues).toHaveLength(2);
    expect(cues[0].startMs).toBe(1000);
    expect(cues[1].endMs).toBe(8250);
  });

  it("SBV timestamps parse with single-digit hour", () => {
    const cues = parseSubtitle(sbvFixture);
    expect(cues).toHaveLength(2);
    expect(cues[0].startMs).toBe(1000);
    expect(cues[1].endMs).toBe(8250);
  });

  it("multi-line caption text is preserved exactly with embedded LF", () => {
    const cues = parseSubtitle(srtFixture);
    expect(cues[1].text).toBe("Second caption\nspanning two lines");
  });

  it("strips UTF-8 BOM if present", () => {
    const withBom = "﻿" + srtFixture;
    expect(parseSubtitle(withBom)).toHaveLength(2);
  });
});

describe("subtitle: cross-format equivalence", () => {
  it("SRT/VTT/SBV fixtures all parse to the same cue list", () => {
    const fromSrt = parseSubtitle(srtFixture);
    const fromVtt = parseSubtitle(vttFixture);
    const fromSbv = parseSubtitle(sbvFixture);

    expect(fromSrt).toHaveLength(fromVtt.length);
    expect(fromSrt).toHaveLength(fromSbv.length);

    for (let i = 0; i < fromSrt.length; i++) {
      expect(fromSrt[i].startMs).toBe(fromVtt[i].startMs);
      expect(fromSrt[i].endMs).toBe(fromVtt[i].endMs);
      expect(fromSrt[i].text).toBe(fromVtt[i].text);

      expect(fromSrt[i].startMs).toBe(fromSbv[i].startMs);
      expect(fromSrt[i].endMs).toBe(fromSbv[i].endMs);
      expect(fromSrt[i].text).toBe(fromSbv[i].text);
    }
  });
});

describe("subtitle: builders emit format-correct output", () => {
  const cues = parseSubtitle(srtFixture);

  it("buildSrt uses comma decimal separator", () => {
    const out = buildSrt(cues);
    expect(out).toMatch(/00:00:01,000\s*-->\s*00:00:04,000/);
    expect(out).not.toMatch(/00:00:01\.000/);
  });

  it("buildVtt has WEBVTT header and period decimal", () => {
    const out = buildVtt(cues);
    expect(out.startsWith("WEBVTT")).toBe(true);
    expect(out).toMatch(/00:00:01\.000\s*-->\s*00:00:04\.000/);
  });

  it("buildSbv uses single-digit hour and comma between start/end", () => {
    const out = buildSbv(cues);
    expect(out).toMatch(/0:00:01\.000,0:00:04\.000/);
    expect(out).not.toContain("-->");
  });

  it("output → re-parse round-trip preserves millisecond timing across all 3 formats", () => {
    for (const builder of [buildSrt, buildVtt, buildSbv]) {
      const text = builder(cues);
      const back = parseSubtitle(text);
      expect(back).toHaveLength(cues.length);
      for (let i = 0; i < cues.length; i++) {
        expect(back[i].startMs).toBe(cues[i].startMs);
        expect(back[i].endMs).toBe(cues[i].endMs);
        expect(back[i].text).toBe(cues[i].text);
      }
    }
  });
});

describe("subtitle: edge cases", () => {
  it("handles hour boundaries (>1 hour timestamps)", () => {
    const long = `1
01:30:45,123 --> 02:15:00,000
Long-form cue
`;
    const cues = parseSubtitle(long);
    expect(cues[0].startMs).toBe(1 * 3600_000 + 30 * 60_000 + 45 * 1000 + 123);
    expect(cues[0].endMs).toBe(2 * 3600_000 + 15 * 60_000);
  });

  it("normalizes 1-, 2-, and 3-digit millisecond fields", () => {
    // Some SRT writers emit 1- or 2-digit ms — should be treated as left-padded
    const oneDigit = `1
00:00:01,1 --> 00:00:02,1
T
`;
    expect(parseSubtitle(oneDigit)[0].startMs).toBe(1100);
  });

  it("returns empty array for header-only fixtures", () => {
    expect(parseSubtitle("WEBVTT\n\n")).toEqual([]);
    expect(parseSubtitle("")).toEqual([]);
  });
});
