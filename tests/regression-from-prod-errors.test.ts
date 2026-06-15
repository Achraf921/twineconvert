/**
 * Regression tests sourced directly from real PostHog convert_error
 * events (2026-05-24 sweep, now possible thanks to the rich-context
 * logging shipped in d91cd00). Each test reproduces an actual user
 * input shape that was failing in production and asserts the fix
 * delivers the right behaviour.
 *
 * Every test in this file has been proven CI-blocking via the
 * revert-and-rerun discipline: each fails on the pre-fix code and
 * passes on post-fix.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { parseCube } from "../src/lib/engine/util/lut";
import { fileFromText } from "./fixtures/text-fixtures";

describe("regression: wrong-direction redirects (runner-level)", () => {
  it("dropping a .ris file on bibtex-to-csv suggests ris-to-csv (the reverse)", async () => {
    // Exact PostHog event: tool=bibtex-to-csv, ext=.ris, message about
    // expects .bib / .bibtex but got "...ris". User wanted ris-to-csv.
    const input = fileFromText(
      "ScienceDirect_citations.ris",
      "TY  - JOUR\nTI  - Sample\nER  -\n",
      "application/x-research-info-systems",
    );
    await expect(run("bibtex-to-csv", input)).rejects.toThrow(
      /try the ris-to-csv tool instead/i,
    );
  });

  it("dropping a .jef file on pes-to-jef suggests jef-to-pes (the reverse)", async () => {
    // Exact PostHog event: tool=pes-to-jef, ext=.jef, message about
    // bad PES signature. User wanted jef-to-pes.
    const input = fileFromText("design.jef", "not really pes", "application/octet-stream");
    await expect(run("pes-to-jef", input)).rejects.toThrow(
      /try the jef-to-pes tool instead/i,
    );
  });

  it("suggestion does not fire when no other tool accepts the extension", async () => {
    const input = fileFromText("mystery.xyz", "junk", "application/octet-stream");
    // Should still throw, but with no "try X instead" suffix.
    await expect(run("bibtex-to-csv", input)).rejects.toThrow(
      /expects .* but got "mystery\.xyz"$/,
    );
  });
});

describe("regression: cube-to-3dl actionable diagnosis for malformed CUBE", () => {
  it("a CUBE file with fewer entries than declared throws an actionable message", () => {
    // Exact PostHog shape: declares LUT_3D_SIZE 33 but the body has
    // far fewer than 35937 triples. We want the user to know it is
    // truncated / vendor-malformed, not just "size mismatch".
    const truncated =
      "TITLE \"truncated\"\nLUT_3D_SIZE 33\n" +
      // only ~50 triples, far short of 35,937
      Array.from({ length: 50 }, () => "0.5 0.5 0.5").join("\n") +
      "\n";
    expect(() => parseCube(truncated)).toThrow(
      /CUBE LUT incomplete.*expects 35937 RGB triples.*file is likely truncated/i,
    );
  });

  it("a 1D CUBE LUT throws a clear 'this is a 1D LUT' message instead of size-mismatch", () => {
    const oneD =
      "TITLE \"1d\"\nLUT_1D_SIZE 4\n" +
      "0.0 0.0 0.0\n0.33 0.33 0.33\n0.66 0.66 0.66\n1.0 1.0 1.0\n";
    expect(() => parseCube(oneD)).toThrow(/this CUBE file is a 1D LUT/i);
  });

  it("a CUBE missing the LUT_3D_SIZE header throws a clean header-missing message", () => {
    const noHeader = "TITLE \"weird\"\n0.5 0.5 0.5\n0.5 0.5 0.5\n";
    expect(() => parseCube(noHeader)).toThrow(/missing the LUT_3D_SIZE header/i);
  });

  it("a valid 2x2x2 CUBE still parses cleanly (no false positives from the new guards)", () => {
    const valid =
      "LUT_3D_SIZE 2\n" +
      Array.from({ length: 8 }, (_, i) => `${i / 7} ${i / 7} ${i / 7}`).join("\n") +
      "\n";
    const lut = parseCube(valid);
    expect(lut.size).toBe(2);
    expect(lut.data.length).toBe(2 * 2 * 2 * 3);
  });
});

describe("regression: cloud-sync placeholder file reads (OneDrive/Dropbox/iCloud)", () => {
  /** Mock File that throws the Win32 ERROR_FILE_NOT_FOUND message
   *  the way a cloud-sync stub does when the bytes are not local. */
  class CloudStubFile extends File {
    constructor(name: string, mime: string) {
      super([new Uint8Array(0)], name, { type: mime });
    }
    override async text(): Promise<string> {
      throw new Error(
        "A requested file or directory could not be found at the time an operation was processed.",
      );
    }
    override async arrayBuffer(): Promise<ArrayBuffer> {
      throw new Error(
        "A requested file or directory could not be found at the time an operation was processed.",
      );
    }
  }

  it("runner translates the Win32-style file-not-found into actionable guidance", async () => {
    const stub = new CloudStubFile("citations.csv", "text/csv");
    await expect(run("csv-to-ris", stub)).rejects.toThrow(
      /OneDrive, Dropbox, or iCloud.*download.*locally/i,
    );
  });

  it("runner translates a DOMException-style NotFoundError the same way", async () => {
    class NotFoundFile extends File {
      constructor() {
        super([new Uint8Array(0)], "refs.bib", { type: "application/x-bibtex" });
      }
      override async text(): Promise<string> {
        const err = new Error("File not found.");
        err.name = "NotFoundError";
        throw err;
      }
    }
    await expect(run("bibtex-to-csv", new NotFoundFile())).rejects.toThrow(
      /OneDrive, Dropbox, or iCloud/i,
    );
  });

  // Real PostHog error (dxf-to-svg, 2026-06-15): the browser throws a
  // NotReadableError when the picked file's reference went stale (moved,
  // locked by another app, or expired on mobile). It can hit any converter,
  // so the runner translates it centrally into actionable guidance.
  const UNREADABLE_MSG =
    "The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.";

  it("runner translates a DOMException NotReadableError into actionable guidance", async () => {
    class UnreadableFile extends File {
      constructor() {
        super([new Uint8Array(0)], "refs.csv", { type: "text/csv" });
      }
      override async text(): Promise<string> {
        const err = new Error(UNREADABLE_MSG);
        err.name = "NotReadableError";
        throw err;
      }
      override async arrayBuffer(): Promise<ArrayBuffer> {
        const err = new Error(UNREADABLE_MSG);
        err.name = "NotReadableError";
        throw err;
      }
    }
    await expect(run("csv-to-ris", new UnreadableFile())).rejects.toThrow(
      /may have moved, been renamed or deleted, or changed since you selected it/i,
    );
  });

  it("translates NotReadableError by message text even when the name is stripped", async () => {
    class UnreadableFile extends File {
      constructor() {
        super([new Uint8Array(0)], "data.csv", { type: "text/csv" });
      }
      override async text(): Promise<string> {
        throw new Error(UNREADABLE_MSG); // generic Error, no .name
      }
    }
    await expect(run("csv-to-json", new UnreadableFile())).rejects.toThrow(
      /Re-select the file and try again/i,
    );
  });
});

describe("regression: suppress noisy suggestion for ambiguous extensions", () => {
  it(".zip on csv-to-ris does NOT suggest an apple-health/instagram/etc. tool", async () => {
    // Real PostHog event: .zip suggested apple-health-to-csv which was
    // unhelpful to a user who wanted RIS. With many tools accepting
    // .zip and none matching the wanted output, no suggestion is
    // better than the wrong one.
    const fakeZip = new File([new Uint8Array(4)], "files.zip", {
      type: "application/zip",
    });
    let caught: unknown;
    try {
      await run("csv-to-ris", fakeZip);
    } catch (e) {
      caught = e;
    }
    const msg = (caught as Error)?.message ?? "";
    expect(msg).toMatch(/expects \.csv but got/i);
    expect(msg).not.toMatch(/Try the .* tool instead/i);
  });

  it("a single unambiguous suggestion (.ris on bibtex-to-csv) still fires", async () => {
    // Sanity guard: do not let the noise filter swallow the genuine
    // wrong-direction cases the runner redirect was built for.
    const input = fileFromText("refs.ris", "TY  - JOUR\nER  -\n", "application/x-research-info-systems");
    await expect(run("bibtex-to-csv", input)).rejects.toThrow(
      /Try the ris-to-csv tool instead/i,
    );
  });
});

describe("regression: csv-to-ris reads real-world citation CSV headers", () => {
  // PostHog (2026-06): csv-to-ris was the #1 tool yet several users hit
  // "No citations found in CSV" or got silent empty RIS. Root cause: the
  // reader matched ONLY exact-lowercase headers (title, authors, year),
  // so PubMed CSV exports (Title, Authors, Publication Year, Journal/Book,
  // DOI), Zotero, and Excel exports produced empty records with no error.

  it("PubMed CSV (capitalised + Journal/Book + Publication Year) yields real RIS data", async () => {
    const csv =
      'PMID,Title,Authors,Journal/Book,Publication Year,DOI\n' +
      '12345,"Vestibular function in aging","Smith J; Doe A","Journal of Neurology","2006","10.1000/xyz"';
    const result = await run("csv-to-ris", fileFromText("pubmed_2006_2007.csv", csv, "text/csv"));
    const ris = await result.blob.text();
    // Real fields must appear, not an empty TY/ER skeleton.
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging/);
    expect(ris).toMatch(/(AU|A1)\s+-\s+Smith J/);
    expect(ris).toMatch(/(PY|Y1)\s+-\s+2006/);
    expect(ris).toMatch(/DO\s+-\s+10\.1000\/xyz/);
  });

  it("Excel/Zotero capitalised headers (Title, Author, Year) yield real RIS data", async () => {
    const csv = 'Title,Author,Year,DOI,Journal\n"A Study of Things","Jane Roe","2020","10.1/abc","Nature"';
    const result = await run("csv-to-ris", fileFromText("zotero.csv", csv, "text/csv"));
    const ris = await result.blob.text();
    expect(ris).toMatch(/TI\s+-\s+A Study of Things/);
    expect(ris).toMatch(/(AU|A1)\s+-\s+Jane Roe/);
    expect(ris).toMatch(/(PY|Y1)\s+-\s+2020/);
  });

  it("a date-only column backfills the year (Date 2019-04-01 -> 2019)", async () => {
    const csv = 'Title,Author,Date,Publication Title\n"Late binding","Roe J","2019-04-01","ACM Queue"';
    const result = await run("csv-to-ris", fileFromText("date.csv", csv, "text/csv"));
    const ris = await result.blob.text();
    expect(ris).toMatch(/(PY|Y1)\s+-\s+2019/);
    expect(ris).toMatch(/(JO|JF|T2)\s+-\s+ACM Queue/);
  });

  it("our own lowercase round-trip format still parses (no regression)", async () => {
    const csv = 'id,type,title,authors,year,doi,journal\nc1,article,"Known Good","Smith, John; Doe, Jane","2021","10.2/d","Cell"';
    const result = await run("csv-to-ris", fileFromText("ours.csv", csv, "text/csv"));
    const ris = await result.blob.text();
    expect(ris).toMatch(/TI\s+-\s+Known Good/);
    // "Last, First" author names must survive the semicolon split intact.
    expect(ris).toMatch(/(AU|A1)\s+-\s+Smith, John/);
    expect(ris).toMatch(/(AU|A1)\s+-\s+Doe, Jane/);
  });

  it("a non-citation CSV (name,email,phone) fails loudly instead of empty output", async () => {
    const csv = 'name,email,phone\n"Bob","b@x.com","555-1234"';
    await expect(
      run("csv-to-ris", fileFromText("contacts.csv", csv, "text/csv")),
    ).rejects.toThrow(/no recognizable citation columns/i);
  });
});
