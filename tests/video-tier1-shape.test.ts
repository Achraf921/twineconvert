/**
 * Node-runnable shape tests for the Tier 1 video batch (2026-05-27).
 *
 * These do NOT execute FFmpeg.wasm (Node has no browser canvas / wasm
 * context for the audio + video stack). They catch the things wiring
 * mistakes break first:
 *   - converter registered under the expected id
 *   - id, label, accept, fromMime, toMime fields populated correctly
 *   - wrong-extension input is rejected via the runner's UnsupportedInput
 *     check BEFORE the converter would be invoked (so the test runs
 *     entirely in Node)
 *
 * End-to-end FFmpeg behaviour for the routes where we have a real
 * fixture lives in tests/browser/video-tier1.browser.test.ts.
 */

import { describe, it, expect } from "vitest";
import { getMeta } from "../src/lib/engine/registry-meta";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";

interface ShapeExpectation {
  id: string;
  label: string;
  accept: string[];
  toMime: string;
  rejects: { name: string; mime: string }; // a wrong-extension file the runner must reject
}

const EXPECTATIONS: ShapeExpectation[] = [
  {
    id: "m4v-to-mp4",
    label: "M4V → MP4",
    accept: [".m4v"],
    toMime: "video/mp4",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
  {
    id: "3gp-to-mp4",
    label: "3GP → MP4",
    accept: [".3gp", ".3gpp", ".3g2"],
    toMime: "video/mp4",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
  {
    id: "flv-to-mp4",
    label: "FLV → MP4",
    accept: [".flv"],
    toMime: "video/mp4",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
  {
    id: "wmv-to-mp4",
    label: "WMV → MP4",
    accept: [".wmv"],
    toMime: "video/mp4",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
  {
    id: "mts-to-mp4",
    label: "MTS → MP4",
    accept: [".mts", ".m2ts", ".ts"],
    toMime: "video/mp4",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
  {
    id: "mp4-to-webm",
    label: "MP4 → WebM",
    accept: [".mp4"],
    toMime: "video/webm",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
  {
    id: "mov-to-gif",
    label: "MOV → GIF",
    accept: [".mov"],
    toMime: "image/gif",
    rejects: { name: "wrong.csv", mime: "text/csv" },
  },
];

describe("video tier 1: registry shape", () => {
  for (const exp of EXPECTATIONS) {
    it(`${exp.id} is registered with the right meta`, () => {
      const meta = getMeta(exp.id);
      expect(meta, `getMeta returned null for ${exp.id}`).toBeDefined();
      expect(meta!.label).toBe(exp.label);
      expect(meta!.toMime).toBe(exp.toMime);
      for (const ext of exp.accept) {
        expect(meta!.accept).toContain(ext);
      }
      expect(meta!.fromMime.length).toBeGreaterThan(0);
    });
  }
});

describe("video tier 1: runner rejects wrong-extension input before FFmpeg runs", () => {
  for (const exp of EXPECTATIONS) {
    it(`${exp.id} rejects ${exp.rejects.name}`, async () => {
      const input = fileFromText(
        exp.rejects.name,
        "this is not a video file",
        exp.rejects.mime,
      );
      // The runner's extension check throws before the converter is
      // invoked, so this never hits FFmpeg and is fully Node-safe.
      await expect(run(exp.id as never, input)).rejects.toThrow(
        new RegExp(`expects .* but got "${exp.rejects.name}"`),
      );
    });
  }
});
