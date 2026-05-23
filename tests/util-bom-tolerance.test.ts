/**
 * BOM-tolerance regression tests.
 *
 * Reasoned from the PostHog zero-error sweep (2026-05-23): NBIB and
 * EndNote XML and LUT files exported from Windows commonly carry a
 * UTF-8 BOM (U+FEFF). Without stripping, the very first line fails
 * its tag/element regex and parsing returns empty, the converter then
 * throws "No references found" / "EndNote XML parse failed" / "3DL
 * missing coordinate header line" on a perfectly valid file.
 *
 * Each test runs a real fixture with a prepended BOM and asserts the
 * parser still returns the expected data. These were proven to fail
 * on pre-fix code via revert-and-rerun.
 */

import { describe, it, expect } from "vitest";
import { parseRis } from "../src/lib/engine/util/ris";
import { parseEndnoteXml } from "../src/lib/engine/util/endnote-xml";
import { parseCube, parse3dl } from "../src/lib/engine/util/lut";
import { FIXTURES } from "./fixtures/text-fixtures";

const BOM = "﻿";

describe("BOM tolerance: parseRis (NBIB and RIS)", () => {
  it("RIS with leading UTF-8 BOM still parses every citation", () => {
    const withBom = BOM + FIXTURES.ris;
    const cites = parseRis(withBom);
    expect(cites.length).toBeGreaterThan(0);
    expect(cites[0].title).toBeTruthy();
  });

  it("NBIB with leading UTF-8 BOM still parses every record", () => {
    const withBom = BOM + FIXTURES.nbib;
    const cites = parseRis(withBom);
    expect(cites.length).toBeGreaterThan(0);
    expect(cites[0].title).toContain("PubMed");
  });
});

describe("BOM tolerance: parseEndnoteXml", () => {
  it("EndNote XML with leading UTF-8 BOM still parses", () => {
    const withBom = BOM + FIXTURES.endnoteXml;
    const cites = parseEndnoteXml(withBom);
    expect(cites.length).toBeGreaterThan(0);
  });
});

describe("BOM tolerance: parseCube / parse3dl", () => {
  it("CUBE LUT with leading UTF-8 BOM still parses", () => {
    const withBom = BOM + FIXTURES.cubeLut;
    const lut = parseCube(withBom);
    expect(lut.size).toBeGreaterThan(0);
    expect(lut.data.length).toBe(lut.size * lut.size * lut.size * 3);
  });

  it("3DL LUT with leading UTF-8 BOM still parses", () => {
    // 3DL with a small coord ladder + the right number of triples.
    const ladder = "0 64 128 192";
    const size = 4;
    const triples: string[] = [];
    for (let i = 0; i < size * size * size; i++) {
      triples.push("0 0 0");
    }
    const text = BOM + [ladder, ...triples].join("\n") + "\n";
    const lut = parse3dl(text);
    expect(lut.size).toBe(size);
    expect(lut.data.length).toBe(size * size * size * 3);
  });
});
