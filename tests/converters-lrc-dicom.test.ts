/**
 * LRC lyrics + DICOM extension batch tests (Node tier).
 *
 * Non-shallow: each conversion round-trips through our own parsers
 * and asserts the actual timestamps and lyric text survived. Catches
 * the silent-wrong-output failure mode.
 *
 * DICOM-to-jpg/pdf are browser-only (canvas + jsPDF + DICOM pixel
 * decode), covered by shape tests below; full end-to-end DICOM
 * browser tests live with the rest of the medical-imaging suite.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { getMeta } from "../src/lib/engine/registry-meta";
import { parseLrc } from "../src/lib/engine/util/lrc";
import { parseSubtitle } from "../src/lib/engine/util/subtitle";
import { fileFromText } from "./fixtures/text-fixtures";

const SAMPLE_LRC = `[ti:Demo Song]
[ar:Test Artist]
[00:01.00]First line of lyrics
[00:05.50]Second line
[00:10.00]Third line, with comma
[00:30.00][01:00.00]Refrain repeated twice
`;

describe("lrc-to-srt: timestamps and text round-trip", () => {
  it("emits one cue per LRC timestamp (including repeated refrains) with correct text", async () => {
    const result = await run(
      "lrc-to-srt",
      fileFromText("song.lrc", SAMPLE_LRC, "text/plain"),
    );
    expect(result.blob.type).toContain("subrip");
    const cues = parseSubtitle(await result.blob.text());
    // 5 unique timestamps total: 1.00, 5.50, 10.00, 30.00, 60.00
    // (the "Refrain repeated twice" line has two timestamps).
    expect(cues.length).toBe(5);
    expect(cues[0].startMs).toBe(1000);
    expect(cues[1].startMs).toBe(5500);
    expect(cues[2].text).toBe("Third line, with comma");
    expect(cues[3].startMs).toBe(30000);
    expect(cues[4].startMs).toBe(60000);
    expect(cues[3].text).toBe("Refrain repeated twice");
    expect(cues[4].text).toBe("Refrain repeated twice");
  });

  it("rejects an LRC file with no timestamps cleanly", async () => {
    await expect(
      run(
        "lrc-to-srt",
        fileFromText("nope.lrc", "no timestamps here\n", "text/plain"),
      ),
    ).rejects.toThrow(/no timestamped lines/i);
  });
});

describe("lrc-to-vtt: WebVTT output structure preserved", () => {
  it("emits valid WEBVTT with the cue count matching the input", async () => {
    const result = await run(
      "lrc-to-vtt",
      fileFromText("song.lrc", SAMPLE_LRC, "text/plain"),
    );
    const text = await result.blob.text();
    expect(text.startsWith("WEBVTT")).toBe(true);
    // Each cue produces a `-->` arrow.
    const arrows = (text.match(/-->/g) ?? []).length;
    expect(arrows).toBe(5);
    expect(text).toContain("Refrain repeated twice");
  });
});

describe("srt-to-lrc: SRT cues become LRC timestamps", () => {
  it("emits LRC with one [mm:ss.cs] per SRT cue and joined multi-line text", async () => {
    const srt =
      "1\n00:00:05,000 --> 00:00:08,000\nHello\nWorld\n\n" +
      "2\n00:00:10,000 --> 00:00:12,000\nNext line\n";
    const result = await run(
      "srt-to-lrc",
      fileFromText("subs.srt", srt, "application/x-subrip"),
    );
    expect(result.blob.type).toContain("lrc");
    const parsed = parseLrc(await result.blob.text());
    expect(parsed.cues.length).toBe(2);
    expect(parsed.cues[0].startMs).toBe(5000);
    expect(parsed.cues[0].text).toBe("Hello World"); // multi-line joined
    expect(parsed.cues[1].startMs).toBe(10000);
    expect(parsed.cues[1].text).toBe("Next line");
  });
});

describe("DICOM extensions: registry shape (browser-only end-to-end)", () => {
  for (const id of ["dicom-to-jpg", "dicom-to-pdf"] as const) {
    it(`${id} is registered with the right meta`, () => {
      const meta = getMeta(id);
      expect(meta).toBeDefined();
      expect(meta!.accept).toContain(".dcm");
      expect(meta!.accept).toContain(".dicom");
    });
    it(`${id} runner rejects a .csv wrong-extension input`, async () => {
      await expect(
        run(id, fileFromText("wrong.csv", "not dicom", "text/csv")),
      ).rejects.toThrow(/expects .* but got "wrong.csv"/);
    });
  }
  it("dicom-to-jpg targets image/jpeg", () => {
    expect(getMeta("dicom-to-jpg")!.toMime).toBe("image/jpeg");
  });
  it("dicom-to-pdf targets application/pdf", () => {
    expect(getMeta("dicom-to-pdf")!.toMime).toBe("application/pdf");
  });
});
