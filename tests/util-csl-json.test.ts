/**
 * Deep unit tests for csl-json.ts. CSL-JSON is the modern bibliography
 * interop format (Zotero/Pandoc/Mendeley); a parser/builder bug here
 * cascades into 4 user-facing converters (bibtex<->csl-json, yaml<->bibtex).
 * Test against fixed structures so any drift in field mapping fails loudly.
 */

import { describe, it, expect } from "vitest";
import type { Citation } from "../src/lib/engine/util/citation";
import { buildCslJson, parseCslJson } from "../src/lib/engine/util/csl-json";

const sample: Citation[] = [
  {
    id: "smith2024",
    type: "article",
    title: "A Sample Paper",
    authors: ["Smith, John", "Doe, Jane"],
    year: "2024",
    journal: "Nature",
    volume: "123",
    pages: "45-67",
    doi: "10.1038/sample.2024.001",
  },
  {
    id: "brown2023",
    type: "book",
    title: "Book on a Topic",
    authors: ["Brown, Alice"],
    year: "2023",
    publisher: "MIT Press",
    address: "Cambridge, MA",
    isbn: "978-0-262-04567-8",
  },
];

describe("csl-json: build emits spec-compliant JSON", () => {
  it("produces a top-level JSON array", () => {
    const out = buildCslJson(sample);
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it("maps Citation.type → CSL type per OpenCitations vocabulary", () => {
    const out = JSON.parse(buildCslJson(sample));
    expect(out[0].type).toBe("article-journal");
    expect(out[1].type).toBe("book");
  });

  it("structures authors as {family, given} objects (not raw strings)", () => {
    const out = JSON.parse(buildCslJson(sample));
    expect(out[0].author).toEqual([
      { family: "Smith", given: "John" },
      { family: "Doe", given: "Jane" },
    ]);
  });

  it("encodes year as `issued.date-parts` per CSL spec", () => {
    const out = JSON.parse(buildCslJson(sample));
    expect(out[0].issued).toEqual({ "date-parts": [[2024]] });
  });

  it("uses CSL canonical field names (container-title, DOI, ISBN, etc.)", () => {
    const out = JSON.parse(buildCslJson(sample));
    expect(out[0]["container-title"]).toBe("Nature");
    expect(out[0].DOI).toBe("10.1038/sample.2024.001");
    expect(out[1]["publisher-place"]).toBe("Cambridge, MA");
    expect(out[1].ISBN).toBe("978-0-262-04567-8");
  });

  it("uses `page` (singular) per CSL spec, not `pages`", () => {
    const out = JSON.parse(buildCslJson(sample));
    expect(out[0].page).toBe("45-67");
    expect(out[0].pages).toBeUndefined();
  });
});

describe("csl-json: parse handles spec-compliant input", () => {
  it("parses CSL canonical types back to Citation types", () => {
    const text = JSON.stringify([
      { id: "x", type: "article-journal", title: "T" },
      { id: "y", type: "book", title: "B" },
      { id: "z", type: "chapter", title: "C" },
    ]);
    const parsed = parseCslJson(text);
    expect(parsed[0].type).toBe("article");
    expect(parsed[1].type).toBe("book");
    expect(parsed[2].type).toBe("inbook");
  });

  it("flattens {family, given} author objects to 'Last, First' strings", () => {
    const text = JSON.stringify([
      {
        id: "x",
        type: "article-journal",
        title: "T",
        author: [
          { family: "Smith", given: "John" },
          { family: "Doe", given: "Jane M." },
        ],
      },
    ]);
    expect(parseCslJson(text)[0].authors).toEqual(["Smith, John", "Doe, Jane M."]);
  });

  it("decodes issued date-parts back to year/month/day strings", () => {
    const text = JSON.stringify([
      {
        id: "x",
        type: "article-journal",
        title: "T",
        issued: { "date-parts": [[2024, 6, 15]] },
      },
    ]);
    const c = parseCslJson(text)[0];
    expect(c.year).toBe("2024");
    expect(c.month).toBe("6");
    expect(c.day).toBe("15");
  });

  it("preserves unrecognized CSL fields under `extra` for round-trip fidelity", () => {
    const text = JSON.stringify([
      {
        id: "x",
        type: "article-journal",
        title: "T",
        "container-title-short": "Nat.",
        "original-date": { "date-parts": [[1959]] },
      },
    ]);
    const c = parseCslJson(text)[0];
    expect(c.extra?.["container-title-short"]).toBe("Nat.");
  });

  it("throws with a clear message on malformed JSON", () => {
    expect(() => parseCslJson("not json")).toThrow(/valid JSON/);
  });

  it("throws when top-level is not an array (CSL spec violation)", () => {
    expect(() => parseCslJson(`{"id": "x", "type": "article-journal"}`)).toThrow(/array/);
  });
});

describe("csl-json: round-trip preserves core citation fields", () => {
  it("Citation[] → JSON → Citation[] preserves id, title, authors, year, doi", () => {
    const back = parseCslJson(buildCslJson(sample));
    expect(back).toHaveLength(sample.length);
    for (let i = 0; i < sample.length; i++) {
      expect(back[i].id).toBe(sample[i].id);
      expect(back[i].title).toBe(sample[i].title);
      expect(back[i].authors).toEqual(sample[i].authors);
      expect(back[i].year).toBe(sample[i].year);
      if (sample[i].doi) expect(back[i].doi).toBe(sample[i].doi);
      if (sample[i].isbn) expect(back[i].isbn).toBe(sample[i].isbn);
      if (sample[i].publisher) expect(back[i].publisher).toBe(sample[i].publisher);
    }
  });

  it("preserves multi-author order across round-trip", () => {
    const c: Citation = {
      id: "x",
      type: "article",
      title: "T",
      authors: ["Alpha, A", "Bravo, B", "Charlie, C", "Delta, D"],
      year: "2024",
    };
    const back = parseCslJson(buildCslJson([c]));
    expect(back[0].authors).toEqual(c.authors);
  });

  it("handles unicode in author names + title (accents, CJK)", () => {
    const c: Citation = {
      id: "x",
      type: "article",
      title: "Étude sur les méthodes 中文",
      authors: ["López, José María", "田中, 太郎"],
      year: "2024",
    };
    const back = parseCslJson(buildCslJson([c]));
    expect(back[0].title).toBe(c.title);
    expect(back[0].authors).toEqual(c.authors);
  });
});
