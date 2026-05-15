/**
 * Batch conversion tests.
 *
 * Exercises the real sequential run loop and real zip packaging against a
 * real converter (bibtex-to-csv) and real JSZip. Asserts:
 *   - conversions run strictly sequentially (onStart fires in order)
 *   - a mid-batch failure does not abort the remaining files
 *   - the zip actually contains every success, content intact
 *   - same-output-name collisions are de-duplicated, not overwritten
 *   - packaging an all-failed batch throws (nothing to download)
 *
 * This is the "writes a broken zip but doesn't throw" guard, the worst
 * failure mode for batch download.
 */

import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { convertBatch, packageBatchZip } from "../src/lib/engine/batch";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

function bib(name: string) {
  return fileFromText(name, FIXTURES.bibtex, "application/x-bibtex");
}

describe("convertBatch", () => {
  it("converts every file and reports success per item", async () => {
    const files = [bib("a.bib"), bib("b.bib"), bib("c.bib")];
    const results = await convertBatch("bibtex-to-csv", files);

    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.status).toBe("success");
      expect(r.output).toBeDefined();
      const text = await r.output!.blob.text();
      // bibtex fixture has entry key "smith2024" — proves real conversion,
      // not an empty placeholder file.
      expect(text.toLowerCase()).toContain("smith");
    }
  });

  it("runs files strictly sequentially (onStart in order)", async () => {
    const files = [bib("a.bib"), bib("b.bib"), bib("c.bib")];
    const startOrder: number[] = [];
    const settleOrder: number[] = [];
    await convertBatch("bibtex-to-csv", files, {
      onStart: (i) => startOrder.push(i),
      onSettled: (i) => settleOrder.push(i),
    });
    expect(startOrder).toEqual([0, 1, 2]);
    expect(settleOrder).toEqual([0, 1, 2]);
  });

  it("a failed file does not abort the rest of the batch", async () => {
    // Neither the extension nor the MIME is accepted by bibtex-to-csv, so
    // run() throws UnsupportedInputError — a realistic stray file in a drop.
    const files = [
      bib("good1.bib"),
      fileFromText("stray.xyz", "not bibtex", "application/octet-stream"),
      bib("good2.bib"),
    ];
    const results = await convertBatch("bibtex-to-csv", files);

    expect(results.map((r) => r.status)).toEqual(["success", "error", "success"]);
    expect(results[1].error).toBeTruthy();
    // Real error class must survive so PostHog convert_error groups the same
    // way the single-file path does (the fix-loop depends on this).
    expect(results[1].errorClass).toBe("UnsupportedInputError");
    expect(results[0].output).toBeDefined();
    expect(results[2].output).toBeDefined();
  });
});

describe("packageBatchZip", () => {
  it("packages every success and content survives the round-trip", async () => {
    const files = [bib("refs1.bib"), bib("refs2.bib")];
    const results = await convertBatch("bibtex-to-csv", files);
    const zipBlob = await packageBatchZip(results);

    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const names = Object.keys(zip.files);
    expect(names).toHaveLength(2);
    for (const name of names) {
      const content = await zip.files[name].async("string");
      expect(content.toLowerCase()).toContain("smith");
    }
  });

  it("de-duplicates colliding output filenames instead of overwriting", async () => {
    // Both inputs share the same name → converter yields the same output
    // filename for both. Without dedup the zip would silently hold one file.
    const files = [bib("refs.bib"), bib("refs.bib")];
    const results = await convertBatch("bibtex-to-csv", files);
    const zipBlob = await packageBatchZip(results);

    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    expect(Object.keys(zip.files)).toHaveLength(2);
  });

  it("throws when there are no successful conversions", async () => {
    const files = [fileFromText("stray.xyz", "nope", "application/octet-stream")];
    const results = await convertBatch("bibtex-to-csv", files);
    expect(results[0].status).toBe("error");
    await expect(packageBatchZip(results)).rejects.toThrow(/no successful/i);
  });
});
