import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * HTML → DOCX. We extract text from a simple HTML structure and emit
 * a minimal DOCX with each block-level element (h1-h6, p, li) as a
 * Paragraph in the resulting document.
 *
 * Inline formatting (bold, italic) is preserved per-text-run; tables,
 * images, and complex CSS are flattened to plain paragraphs in v1.
 * For richer fidelity, mammoth's reverse direction (htmlToDocx) would
 * be a v2 upgrade, there's no maintained pure-JS implementation that
 * preserves layout the way mammoth does in the docx→html direction.
 */
const htmlToDocx: Converter = {
  id: "html-to-docx",
  label: "HTML → DOCX",
  fromMime: ["text/html"],
  accept: [".html", ".htm"],
  toMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const docxLib = await import("docx");
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docxLib;
      const text = await input.text();
      if (typeof DOMParser === "undefined") throw new Error("DOMParser unavailable");
      const doc = new DOMParser().parseFromString(text, "text/html");

      const paragraphs: InstanceType<typeof Paragraph>[] = [];
      const blockTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "DIV"]);

      const walk = (node: Node) => {
        if (node.nodeType !== 1) return;
        const el = node as HTMLElement;
        if (blockTags.has(el.tagName)) {
          // Build text runs honoring strong/em as separate runs with bold/italic.
          const runs: InstanceType<typeof TextRun>[] = [];
          el.childNodes.forEach((child) => {
            if (child.nodeType === 3) {
              const txt = (child.textContent ?? "").trim();
              if (txt) runs.push(new TextRun(txt));
            } else if (child.nodeType === 1) {
              const c = child as HTMLElement;
              const txt = (c.textContent ?? "").trim();
              if (!txt) return;
              const isBold = c.tagName === "STRONG" || c.tagName === "B";
              const isItalic = c.tagName === "EM" || c.tagName === "I";
              runs.push(new TextRun({ text: txt, bold: isBold, italics: isItalic }));
            }
          });
          if (runs.length === 0) return;
          const headingLevel = ({
            H1: HeadingLevel.HEADING_1,
            H2: HeadingLevel.HEADING_2,
            H3: HeadingLevel.HEADING_3,
            H4: HeadingLevel.HEADING_4,
            H5: HeadingLevel.HEADING_5,
            H6: HeadingLevel.HEADING_6,
          } as const)[el.tagName as "H1"];
          paragraphs.push(new Paragraph({ children: runs, heading: headingLevel }));
          return;
        }
        node.childNodes.forEach(walk);
      };
      walk(doc.body);

      if (paragraphs.length === 0) {
        paragraphs.push(new Paragraph({ children: [new TextRun(doc.body.textContent ?? "")] }));
      }
      const docxDoc = new Document({ sections: [{ children: paragraphs }] });
      blob = await Packer.toBlob(docxDoc);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML to DOCX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "docx") };
  },
};

export default htmlToDocx;
