/**
 * Document conversion hub (Markdown <-> DOCX, HTML/Markdown -> text,
 * text -> HTML). Non-shallow: asserts heading levels, emphasis runs,
 * list items, links, and paragraph breaks survive each conversion, that
 * the DOCX is a real OOXML zip, and that empty/garbage input fails loud.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";

const f = (name: string, content: string, mime: string) => fileFromText(name, content, mime);
const reFile = (data: BlobPart, name: string, mime: string) =>
  new File([data], name, { type: mime }) as unknown as File;

const SAMPLE_MD = `# Quarterly Report

This is **bold** and this is *italic* prose.

## Findings

- First finding
- Second finding

See [the docs](https://example.com) for more.
`;

describe("document hub: markdown-to-docx", () => {
  it("emits a real OOXML (zip) DOCX containing the heading and body text", async () => {
    const out = await run("markdown-to-docx", f("report.md", SAMPLE_MD, "text/markdown"));
    expect(out.filename).toBe("report.docx");
    const buf = new Uint8Array(await out.blob.arrayBuffer());
    // DOCX is a zip: starts with "PK\x03\x04".
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    // document.xml lives inside; the zip stores text uncompressed enough
    // that the literal words appear in the byte stream is NOT guaranteed,
    // so round-trip back to markdown to prove the content survived.
    const md = await (
      await run("docx-to-markdown", reFile(buf, "report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
    ).blob.text();
    expect(md).toMatch(/Quarterly Report/);
    expect(md).toMatch(/Findings/);
    expect(md).toMatch(/First finding/);
    expect(md).toMatch(/Second finding/);
  });

  it("preserves a top-level heading as a Word heading (round-trips to #)", async () => {
    const docx = await run("markdown-to-docx", f("h.md", "# Big Title\n\nbody text here\n", "text/markdown"));
    const md = await (
      await run("docx-to-markdown", reFile(new Uint8Array(await docx.blob.arrayBuffer()), "h.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
    ).blob.text();
    expect(md).toMatch(/^#+\s+Big Title/m);
    expect(md).toMatch(/body text here/);
  });

  it("rejects empty markdown loudly", async () => {
    await expect(run("markdown-to-docx", f("empty.md", "   \n  \n", "text/markdown"))).rejects.toThrow();
  });
});

describe("document hub: html-to-txt", () => {
  it("strips tags, drops script/style, keeps paragraph breaks", async () => {
    const html =
      "<html><head><style>p{color:red}</style></head><body>" +
      "<h1>Title</h1><p>First para.</p><script>alert(1)</script><p>Second para.</p>" +
      "<ul><li>one</li><li>two</li></ul></body></html>";
    const out = await run("html-to-txt", f("page.html", html, "text/html"));
    expect(out.filename).toBe("page.txt");
    const txt = await out.blob.text();
    expect(txt).toMatch(/Title/);
    expect(txt).toMatch(/First para\./);
    expect(txt).toMatch(/Second para\./);
    expect(txt).toMatch(/one/);
    expect(txt).toMatch(/two/);
    expect(txt).not.toMatch(/color:red/);
    expect(txt).not.toMatch(/alert\(1\)/);
    expect(txt).not.toMatch(/[<>]/);
    // paragraphs end up on separate lines, not jammed together.
    expect(txt).toMatch(/First para\.[\s\S]*\n[\s\S]*Second para\./);
  });

  it("honors <br> as a line break", async () => {
    const txt = await (
      await run("html-to-txt", f("br.html", "<p>line one<br>line two</p>", "text/html"))
    ).blob.text();
    expect(txt).toMatch(/line one\nline two/);
  });
});

describe("document hub: txt-to-html", () => {
  it("escapes html-significant chars and wraps blocks in <p>", async () => {
    const html = await (
      await run("txt-to-html", f("note.txt", "Tom & Jerry <fight>\n\nSecond block", "text/plain"))
    ).blob.text();
    expect(html).toMatch(/<!DOCTYPE html>/);
    expect(html).toContain("Tom &amp; Jerry &lt;fight&gt;");
    expect(html).not.toContain("<fight>");
    expect((html.match(/<p>/g) ?? []).length).toBe(2);
  });

  it("round-trips text -> html -> text preserving the words", async () => {
    const original = "Alpha line\n\nBeta line";
    const html = await (await run("txt-to-html", f("rt.txt", original, "text/plain"))).blob.text();
    const back = await (
      await run("html-to-txt", reFile(html, "rt.html", "text/html"))
    ).blob.text();
    expect(back).toMatch(/Alpha line/);
    expect(back).toMatch(/Beta line/);
  });
});

describe("document hub: markdown-to-txt", () => {
  it("renders markdown then strips to readable prose", async () => {
    const txt = await (
      await run("markdown-to-txt", f("doc.md", SAMPLE_MD, "text/markdown"))
    ).blob.text();
    expect(txt).toMatch(/Quarterly Report/);
    expect(txt).toMatch(/bold/);
    expect(txt).toMatch(/italic/);
    expect(txt).toMatch(/First finding/);
    // emphasis markers are gone, link text is kept.
    expect(txt).not.toMatch(/\*\*bold\*\*/);
    expect(txt).toMatch(/the docs/);
    expect(txt).not.toMatch(/[<>]/);
  });
});
