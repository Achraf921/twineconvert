/**
 * Browser tests for SVG, PDF, and DOCX converters that we can exercise
 * with programmatically-generated inputs. No committed fixtures needed.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { expectMagic, MAGIC } from "./helpers";

const TINY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#E0297B"/>
  <circle cx="16" cy="16" r="8" fill="white"/>
</svg>`;

function svgFile(): File {
  return new File([TINY_SVG], "test.svg", { type: "image/svg+xml" });
}

async function makeTinyPdf(): Promise<File> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  page.drawText("Hello twineconvert", { x: 20, y: 100, size: 14 });
  const bytes = await doc.save();
  // pdf-lib returns Uint8Array<ArrayBufferLike>; copy into a fresh
  // ArrayBuffer-backed view so the BlobPart type checks.
  return new File([new Uint8Array(bytes)], "test.pdf", { type: "application/pdf" });
}

async function makeTinyDocx(): Promise<File> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Hello twineconvert", bold: true })],
          }),
          new Paragraph({
            children: [new TextRun("This is a test document for browser-mode tests.")],
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  return new File([blob], "test.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

describe("SVG converters (browser)", () => {
  it("svg-to-png", async () => {
    const result = await run("svg-to-png", svgFile());
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  });

  it("svg-to-jpg", async () => {
    const result = await run("svg-to-jpg", svgFile());
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.JPEG);
  });
});

describe("PDF converters (browser)", () => {
  it("pdf-to-text extracts the embedded text", async () => {
    const pdf = await makeTinyPdf();
    const result = await run("pdf-to-text", pdf);
    const text = await result.blob.text();
    expect(text).toContain("twineconvert");
  });

  it("pdf-to-png renders a real PNG", async () => {
    const pdf = await makeTinyPdf();
    const result = await run("pdf-to-png", pdf);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  });

  it("pdf-to-jpg renders a real JPEG", async () => {
    const pdf = await makeTinyPdf();
    const result = await run("pdf-to-jpg", pdf);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.JPEG);
  });

  it("pdf-to-docx produces a DOCX (zip) file", async () => {
    const pdf = await makeTinyPdf();
    const result = await run("pdf-to-docx", pdf);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.ZIP);
  });

  it("compress-pdf returns a valid PDF", async () => {
    const pdf = await makeTinyPdf();
    const result = await run("compress-pdf", pdf);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  });
});

describe("DOCX converters (browser)", () => {
  it("docx-to-pdf produces a real PDF", async () => {
    const docx = await makeTinyDocx();
    const result = await run("docx-to-pdf", docx);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  });
});

async function makeTinyEpub(): Promise<File> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  // mimetype must be the FIRST file in the zip and STORED (not deflated)
  zip.file("mimetype", "application/epub+zip");
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">tiny-epub-1</dc:identifier>
    <dc:title>Tiny twineconvert EPUB</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`,
  );
  zip.file(
    "OEBPS/ch1.xhtml",
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 1</title></head>
<body><h1>Chapter 1</h1><p>Hello twineconvert from a tiny EPUB.</p></body>
</html>`,
  );
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
  });
  return new File([blob], "tiny.epub", { type: "application/epub+zip" });
}

describe("EPUB converters (browser)", () => {
  it("epub-to-pdf produces a real PDF", async () => {
    const epub = await makeTinyEpub();
    const result = await run("epub-to-pdf", epub);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  }, 60000);
});
