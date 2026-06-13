/**
 * Subtitle transcript extraction + matrix-gap conversions. Non-shallow:
 * asserts the actual caption text survives, timestamps/markup are gone
 * from transcripts, multi-line cues collapse to one line, and the
 * gap-fill pairs emit the right target format with the text intact.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

const F = FIXTURES;
const f = (name: string, content: string, mime: string) => fileFromText(name, content, mime);
const NO_TS = /\d{1,2}:\d{2}:\d{2}[.,]\d{3}/; // any subtitle timestamp

describe("subtitle transcript extraction (-to-txt)", () => {
  it("srt-to-txt keeps caption text, drops timestamps, collapses multi-line cues", async () => {
    const txt = await (await run("srt-to-txt", f("c.srt", F.srt, "application/x-subrip"))).blob.text();
    expect(txt).toContain("First caption text");
    expect(txt).toContain("Second caption spanning two lines"); // 2-line cue collapsed
    expect(txt).not.toMatch(NO_TS);
    expect(txt).not.toContain("-->");
  });

  it("vtt-to-txt drops the WEBVTT header + timestamps", async () => {
    const txt = await (await run("vtt-to-txt", f("c.vtt", F.vtt, "text/vtt"))).blob.text();
    expect(txt).toContain("First caption text");
    expect(txt).not.toContain("WEBVTT");
    expect(txt).not.toMatch(NO_TS);
  });

  it("sbv-to-txt keeps text, drops timestamps", async () => {
    const txt = await (await run("sbv-to-txt", f("c.sbv", F.sbv, "text/sbv"))).blob.text();
    expect(txt).toContain("First caption text");
    expect(txt).not.toMatch(NO_TS);
  });

  it("ass-to-txt produces transcript with no Dialogue/format lines or timestamps", async () => {
    const txt = await (await run("ass-to-txt", f("c.ass", F.ass, "text/x-ssa"))).blob.text();
    expect(txt.length).toBeGreaterThan(0);
    expect(txt).not.toContain("Dialogue:");
    expect(txt).not.toContain("[Events]");
    expect(txt).not.toMatch(NO_TS);
  });

  it("lrc-to-txt extracts the lyric lines without the [mm:ss] tags", async () => {
    const lrc = "[ti:Demo]\n[00:01.00]First line\n[00:05.00]Second line\n";
    const txt = await (await run("lrc-to-txt", f("s.lrc", lrc, "text/plain"))).blob.text();
    expect(txt).toContain("First line");
    expect(txt).toContain("Second line");
    expect(txt).not.toContain("[00:01");
  });

  it("collapses repeated auto-caption lines (rolling captions)", async () => {
    const rolling =
      "1\n00:00:01,000 --> 00:00:02,000\nhello\n\n" +
      "2\n00:00:02,000 --> 00:00:03,000\nhello\n\n" +
      "3\n00:00:03,000 --> 00:00:04,000\nworld\n";
    const txt = await (await run("srt-to-txt", f("r.srt", rolling, "application/x-subrip"))).blob.text();
    expect((txt.match(/hello/g) ?? []).length).toBe(1);
    expect(txt).toContain("world");
  });
});

describe("subtitle matrix gap fills", () => {
  it("vtt-to-sbv emits SBV comma-timestamps with the text", async () => {
    const sbv = await (await run("vtt-to-sbv", f("c.vtt", F.vtt, "text/vtt"))).blob.text();
    expect(sbv).toMatch(/\d:\d{2}:\d{2}\.\d{3},\d:\d{2}:\d{2}\.\d{3}/);
    expect(sbv).toContain("First caption text");
    expect(sbv).not.toContain("-->");
  });

  it("ass-to-sbv emits SBV with the dialogue text", async () => {
    const sbv = await (await run("ass-to-sbv", f("c.ass", F.ass, "text/x-ssa"))).blob.text();
    expect(sbv).toMatch(/\d:\d{2}:\d{2}\.\d{3},/);
    expect(sbv.length).toBeGreaterThan(10);
  });

  it("sbv-to-vtt emits a WEBVTT file with arrow timestamps + text", async () => {
    const vtt = await (await run("sbv-to-vtt", f("c.sbv", F.sbv, "text/sbv"))).blob.text();
    expect(vtt.startsWith("WEBVTT")).toBe(true);
    expect(vtt).toContain("-->");
    expect(vtt).toContain("First caption text");
  });

  it("sbv-to-ass emits an ASS file with Dialogue events + text", async () => {
    const ass = await (await run("sbv-to-ass", f("c.sbv", F.sbv, "text/sbv"))).blob.text();
    expect(ass).toContain("[Events]");
    expect(ass).toContain("Dialogue:");
    expect(ass).toContain("First caption text");
  });

  it("round-trip VTT -> SBV -> VTT keeps the caption text", async () => {
    const r1 = await run("vtt-to-sbv", f("c.vtt", F.vtt, "text/vtt"));
    const r2 = await run("sbv-to-vtt", new File([await r1.blob.text()], "rt.sbv", { type: "text/sbv" }) as unknown as File);
    const vtt = await r2.blob.text();
    expect(vtt).toContain("First caption text");
    expect(vtt).toContain("Second caption");
  });

  it("srt-to-txt throws on input with no cues", async () => {
    await expect(
      run("srt-to-txt", f("e.srt", "not a subtitle file\n", "application/x-subrip")),
    ).rejects.toThrow(/No subtitle cues/);
  });
});
