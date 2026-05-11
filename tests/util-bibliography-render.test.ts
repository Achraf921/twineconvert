/**
 * Deep unit tests for bibliography-render.ts. Validates the APA-ish
 * Markdown + HTML renderer produces structurally correct output: every
 * citation appears, key fields are emitted in the right order, HTML
 * is properly escaped, and edge cases (missing author, missing year,
 * special chars) don't break the renderer.
 */

import { describe, it, expect } from "vitest";
import type { Citation } from "../src/lib/engine/util/citation";
import {
  buildHtmlBibliography,
  buildMarkdownBibliography,
} from "../src/lib/engine/util/bibliography-render";

const citations: Citation[] = [
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
  },
];

describe("bibliography-render: Markdown output", () => {
  const md = buildMarkdownBibliography(citations);

  it("emits a numbered list (1., 2., ...)", () => {
    expect(md).toMatch(/^# References\n\n1\./m);
    expect(md).toMatch(/^2\./m);
    expect(md.split("\n").filter((l) => /^\d+\./.test(l))).toHaveLength(2);
  });

  it("uses '&' for the last author pair (APA convention)", () => {
    expect(md).toContain("Smith, J., & Doe, J.");
  });

  it("formats year in parentheses with period (APA convention)", () => {
    expect(md).toContain("(2024).");
    expect(md).toContain("(2023).");
  });

  it("italicizes the container (journal) for articles, the title for books", () => {
    // Article: title plain, journal italicized
    expect(md).toContain("A Sample Paper.");
    expect(md).toContain("*Nature*");
    // Book: title italicized
    expect(md).toContain("*Book on a Topic*.");
  });

  it("includes the DOI as a doi.org URL", () => {
    expect(md).toContain("https://doi.org/10.1038/sample.2024.001");
  });

  it("includes the publisher for non-article types", () => {
    expect(md).toContain("MIT Press.");
  });
});

describe("bibliography-render: HTML output", () => {
  const html = buildHtmlBibliography(citations);

  it("is a complete HTML document with <!DOCTYPE>", () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("contains an <ol> with one <li> per citation", () => {
    expect(html).toContain("<ol>");
    expect(html).toContain("</ol>");
    const liMatches = html.match(/<li>/g) ?? [];
    expect(liMatches).toHaveLength(citations.length);
  });

  it("wraps the journal name in <em>", () => {
    expect(html).toContain("<em>Nature</em>");
  });

  it("emits the DOI as a clickable <a href> link", () => {
    expect(html).toContain('<a href="https://doi.org/10.1038/sample.2024.001"');
  });

  it("escapes HTML metacharacters in cell values (XSS prevention)", () => {
    const malicious: Citation[] = [
      {
        id: "x",
        type: "article",
        title: "<script>alert(1)</script> & more",
        authors: ["O'Hare, P."],
        year: "2024",
        journal: "Test",
      },
    ];
    const out = buildHtmlBibliography(malicious);
    expect(out).not.toContain("<script>alert(1)</script>");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("&amp;");
  });
});

describe("bibliography-render: edge cases", () => {
  it("handles citations with no authors gracefully", () => {
    const c: Citation[] = [
      { id: "x", type: "article", title: "Anonymous Paper", year: "2024", journal: "Test" },
    ];
    const md = buildMarkdownBibliography(c);
    expect(md).toContain("Anonymous Paper");
    expect(md).toContain("(2024)");
  });

  it("uses (n.d.) when year is missing (APA convention)", () => {
    const c: Citation[] = [
      { id: "x", type: "article", title: "Undated", authors: ["Smith, John"] },
    ];
    expect(buildMarkdownBibliography(c)).toContain("(n.d.).");
  });

  it("throws when given an empty citation list (caller should validate first)", () => {
    expect(() => buildMarkdownBibliography([])).toThrow(/no entries/);
    expect(() => buildHtmlBibliography([])).toThrow(/no entries/);
  });

  it("handles 3+ author lists with commas + final '&'", () => {
    const c: Citation[] = [
      {
        id: "x",
        type: "article",
        title: "Multi-author",
        authors: ["Alpha, A", "Bravo, B", "Charlie, C"],
        year: "2024",
      },
    ];
    const md = buildMarkdownBibliography(c);
    // Expected APA-ish: "Alpha, A., Bravo, B., & Charlie, C."
    expect(md).toMatch(/Alpha, A\.,?\s*Bravo, B\.,?\s*&\s*Charlie, C\./);
  });

  it("renders unicode in title + author names without mangling", () => {
    const c: Citation[] = [
      {
        id: "x",
        type: "article",
        title: "Étude sur les méthodes",
        authors: ["López, José María"],
        year: "2024",
        journal: "Revista",
      },
    ];
    const md = buildMarkdownBibliography(c);
    expect(md).toContain("Étude sur les méthodes");
    expect(md).toContain("López");
  });
});
