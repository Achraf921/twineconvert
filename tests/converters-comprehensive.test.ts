/**
 * Comprehensive per-converter test, Node tier.
 *
 * Iterates EVERY converter in the registry. For each:
 *   - If we have a Node-runnable fixture → run conversion + validate output
 *   - If the converter needs a real browser → skip (covered by browser test suite)
 *   - If we have NO fixture at all → fail loudly so we don't silently
 *     drift toward "we have 200 converters but only test 40"
 *
 * The validators decode each output and assert structural soundness
 * (PDF has %%EOF trailer, CSV has rows, BibTeX has @entry blocks, etc.) ,
 * not just magic-byte matching. That catches the "writes valid header,
 * garbage payload" failure mode that broken converters tend toward.
 */

import { describe, it, expect } from "vitest";
import { listConverterIds } from "../src/lib/engine/registry";
import { run } from "../src/lib/engine/runner";
import { FIXTURE_PROVIDERS, isNodeTestable, hasFixture } from "./fixtures/fixture-providers";
import { pickValidator } from "./validators";

const ALL_IDS = listConverterIds();

// Split the registry by what we can test where.
const NODE_TESTABLE = ALL_IDS.filter(isNodeTestable);
const BROWSER_ONLY = ALL_IDS.filter((id) => FIXTURE_PROVIDERS[id]?.env === "browser");
const TOTALLY_UNFIXTURED = ALL_IDS.filter((id) => !hasFixture(id));

describe("converters-comprehensive (node tier)", () => {
  it(`registry coverage report, ${ALL_IDS.length} total, ${NODE_TESTABLE.length} node-testable, ${BROWSER_ONLY.length} browser-only, ${TOTALLY_UNFIXTURED.length} unfixtured`, () => {
    if (TOTALLY_UNFIXTURED.length > 0) {
      throw new Error(
        `${TOTALLY_UNFIXTURED.length} converters have no fixture provider registered:\n  ${TOTALLY_UNFIXTURED.join("\n  ")}\n\nAdd entries to tests/fixtures/fixture-providers.ts so CI exercises them.`,
      );
    }
  });

  // The actual per-converter loop. We use it.each so each converter
  // shows up as its own line in the test output, a failure tells you
  // exactly which conversion is broken without rerunning anything.
  describe.each(NODE_TESTABLE)("%s", (id) => {
    const spec = FIXTURE_PROVIDERS[id];
    if (!spec) return; // shouldn't happen, we filtered above

    it("runs without throwing on a valid fixture", async () => {
      let input: File;
      try {
        input = await spec.provider();
      } catch (err) {
        // Provider explicitly threw, fixture missing. Mark as pending
        // (will fail loudly when we add the fixture and the test starts running).
        const msg = err instanceof Error ? err.message : String(err);
        // Skip with a clear message so it shows in the test summary.
        // We use expect().toBe(true) trickery to surface a "todo" line
        // without using vitest's `it.todo` which runs nothing.
        expect.fail(`fixture pending: ${msg}`);
        return;
      }

      const result = await run(id, input);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.size).toBeGreaterThan(0);
      expect(typeof result.filename).toBe("string");
      expect(result.filename.length).toBeGreaterThan(0);
    });

    it("output passes structural validation", async () => {
      let input: File;
      try {
        input = await spec.provider();
      } catch {
        expect.fail("fixture pending");
        return;
      }

      const result = await run(id, input);
      // Look up validator by output MIME (or filename ext fallback)
      const validator = pickValidator(result.blob.type, result.filename);
      if (!validator) {
        // No validator registered for this output type. Better to fail
        // loudly than silently skip, this is exactly the "we shipped a
        // converter without testing it" gap we're closing.
        throw new Error(
          `No validator for output type '${result.blob.type}' (filename: ${result.filename}). Add one to tests/validators/index.ts.`,
        );
      }
      await validator({ blob: result.blob, filename: result.filename, inputBlob: input });
    });
  });

  it.each(BROWSER_ONLY)("%s, covered by browser test suite (skipped here)", (id) => {
    // Asserting the spec exists so a future "remove a converter without
    // updating fixtures" regression fails loudly.
    expect(FIXTURE_PROVIDERS[id]?.env).toBe("browser");
  });
});
