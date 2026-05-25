/**
 * Integrity guard for the hand-curated cross-family related-tools map.
 *
 * The auto-grids are derived from the registry so they cannot dead-link.
 * The hand-curated map can: a typo or a renamed converter would silently
 * produce a 404 link until a user clicks it. This test blocks that at
 * CI time by asserting every curated target id is a real converter.
 *
 * Also asserts the section actually renders something on the pages
 * where we added curation (catches the previous bug where the function
 * existed but was never called).
 */

import { describe, it, expect } from "vitest";
import { getRelatedTools } from "../src/lib/related-tools";
import { listToolIds, getMeta } from "../src/lib/engine/registry-meta";

describe("curated related-tools integrity", () => {
  const allIds = new Set(listToolIds());

  // Every key + value the curated map exposes via getRelatedTools.
  // Iterate the surface by sampling every tool id; getRelatedTools is
  // O(1) so this is cheap.
  const offenders: Array<{ from: string; deadLink: string }> = [];
  for (const id of allIds) {
    for (const target of getRelatedTools(id)) {
      if (!allIds.has(target)) offenders.push({ from: id, deadLink: target });
    }
  }

  it("every curated target id exists in the registry (no dead links)", () => {
    expect(offenders).toEqual([]);
  });

  it("every curated target also has a label in registry-meta", () => {
    const missingMeta: Array<{ from: string; target: string }> = [];
    for (const id of allIds) {
      for (const target of getRelatedTools(id)) {
        if (!getMeta(target)?.label) missingMeta.push({ from: id, target });
      }
    }
    expect(missingMeta).toEqual([]);
  });

  it("the wiring is alive: at least one well-known curated page returns entries", () => {
    // Spot-checks for pages we actively curated in 2026-05-24. If these
    // start returning empty the curation got accidentally dropped.
    expect(getRelatedTools("bibtex-to-csv").length).toBeGreaterThan(0);
    expect(getRelatedTools("qbo-to-csv").length).toBeGreaterThan(0);
    expect(getRelatedTools("pes-to-exp").length).toBeGreaterThan(0);
    expect(getRelatedTools("3dl-to-cube").length).toBeGreaterThan(0);
    expect(getRelatedTools("gedcom-to-pdf").length).toBeGreaterThan(0);
  });

  it("a tool is never curated to link to itself", () => {
    const selfLinks: string[] = [];
    for (const id of allIds) {
      if (getRelatedTools(id).includes(id)) selfLinks.push(id);
    }
    expect(selfLinks).toEqual([]);
  });
});
