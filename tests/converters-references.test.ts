/**
 * Reference-list parser (plain-text bibliography -> RIS / BibTeX /
 * CSL-JSON). Built from a real PostHog signal: users pasted a paper's
 * numbered "References" section onto csv-to-ris and failed. Tests assert
 * the import-critical fields (title, year, DOI, authors) actually land in
 * each output format, using the real IEEE shape from the logs plus APA.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { parseReferenceList } from "../src/lib/engine/util/reference-list";
import { fileFromText } from "./fixtures/text-fixtures";

const f = (name: string, content: string) => fileFromText(name, content, "text/plain");

// The exact failing format from PostHog (IEEE numbered, quoted titles).
const IEEE = `[1] L. Tan and T. Zrnic, "Valid Inference with Synthetic Data via Conformal Prediction," Journal of Machine Learning Research, vol. 25, pp. 1-30, 2024.
[2] A. Smith, B. Jones, and C. Lee, "Deep Learning for Computer Vision," in Proc. CVPR, 2021, doi:10.1109/cvpr.2021.00123.
[3] K. Brown, "A Single Author Study," Nature, vol. 5, no. 2, pp. 100-110, 2019.`;

const APA = `Smith, J., Brown, K., & Lee, C. (2020). The structure of scientific revolutions. Chicago Journal, 12(3), 45-67.

Doe, J. (2019). Another important paper. Nature, 5(2), 100-110. https://doi.org/10.1000/xyz123`;

describe("reference-list parser: structural extraction", () => {
  it("parses the real IEEE numbered list with authors, titles, years, DOI", () => {
    const refs = parseReferenceList(IEEE);
    expect(refs).toHaveLength(3);

    expect(refs[0].title).toBe("Valid Inference with Synthetic Data via Conformal Prediction");
    expect(refs[0].year).toBe("2024");
    expect(refs[0].authors).toEqual(["L. Tan", "T. Zrnic"]);

    expect(refs[1].title).toBe("Deep Learning for Computer Vision");
    expect(refs[1].year).toBe("2021");
    expect(refs[1].authors).toEqual(["A. Smith", "B. Jones", "C. Lee"]);
    expect(refs[1].doi).toBe("10.1109/cvpr.2021.00123");
    expect(refs[1].type).toBe("inproceedings");

    expect(refs[2].title).toBe("A Single Author Study");
    expect(refs[2].authors).toEqual(["K. Brown"]);
  });

  it("parses APA entries (Surname, Initials, & ...) with title + year + DOI", () => {
    const refs = parseReferenceList(APA);
    expect(refs).toHaveLength(2);
    expect(refs[0].title).toBe("The structure of scientific revolutions");
    expect(refs[0].year).toBe("2020");
    expect(refs[0].authors).toEqual(["Smith, J.", "Brown, K.", "Lee, C."]);
    expect(refs[1].title).toBe("Another important paper");
    expect(refs[1].doi).toBe("10.1000/xyz123");
  });

  it("skips lines that are not citations (no title / no author+year)", () => {
    const refs = parseReferenceList("References\n\nSee also the appendix.\n");
    expect(refs).toHaveLength(0);
  });
});

describe("references-to-ris", () => {
  it("emits RIS records carrying title, author, year, DOI", async () => {
    const ris = await (await run("references-to-ris", f("refs.txt", IEEE))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Valid Inference with Synthetic Data via Conformal Prediction/);
    expect(ris).toMatch(/AU\s+-\s+L\. Tan/);
    expect(ris).toMatch(/AU\s+-\s+T\. Zrnic/);
    expect(ris).toMatch(/PY\s+-\s+2024/);
    expect(ris).toContain("10.1109/cvpr.2021.00123");
    // one record per reference: three TY tags.
    expect((ris.match(/TY\s+-\s+/g) ?? []).length).toBe(3);
  });

  it("throws a helpful error when no references are recognized", async () => {
    await expect(
      run("references-to-ris", f("notrefs.txt", "just some random prose with no structure")),
    ).rejects.toThrow(/No references recognized/);
  });
});

describe("references-to-bibtex", () => {
  it("emits BibTeX entries with title + year", async () => {
    const bib = await (await run("references-to-bibtex", f("refs.txt", IEEE))).blob.text();
    expect(bib).toContain("Valid Inference with Synthetic Data via Conformal Prediction");
    expect(bib).toContain("2024");
    expect(bib).toMatch(/@\w+\{/);
    expect((bib.match(/@\w+\{/g) ?? []).length).toBe(3);
  });
});

describe("references-to-csl-json", () => {
  it("emits a CSL-JSON array with title + issued year", async () => {
    const arr = JSON.parse(await (await run("references-to-csl-json", f("refs.txt", IEEE))).blob.text());
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toHaveLength(3);
    expect(arr[0].title).toBe("Valid Inference with Synthetic Data via Conformal Prediction");
    const year = arr[0].issued?.["date-parts"]?.[0]?.[0];
    expect(String(year)).toBe("2024");
  });
});
