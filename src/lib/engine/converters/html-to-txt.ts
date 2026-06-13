import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * HTML → plain text. Drops script/style, turns block-level elements and
 * <br> into line breaks, and collapses runs of whitespace inside a line.
 * This keeps the readable prose of an HTML email or page while stripping
 * all tags and CSS.
 */
const BLOCK = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "ASIDE",
  "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TR", "BLOCKQUOTE", "PRE",
  "UL", "OL", "TABLE", "FORM", "FIGURE", "FIGCAPTION", "HR",
]);

const htmlToTxt: Converter = {
  id: "html-to-txt",
  label: "HTML → Text",
  fromMime: ["text/html", "application/xhtml+xml"],
  accept: [".html", ".htm", ".xhtml"],
  toMime: "text/plain",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      if (typeof DOMParser === "undefined") throw new Error("DOMParser unavailable");
      const doc = new DOMParser().parseFromString(await input.text(), "text/html");
      doc.querySelectorAll("script, style, noscript").forEach((n) => n.remove());

      const parts: string[] = [];
      const walk = (node: Node) => {
        if (node.nodeType === 3) {
          const t = (node.textContent ?? "").replace(/\s+/g, " ");
          if (t.trim()) parts.push(t);
          return;
        }
        if (node.nodeType !== 1) return;
        const el = node as HTMLElement;
        if (el.tagName === "BR") {
          parts.push("\n");
          return;
        }
        const block = BLOCK.has(el.tagName);
        if (block) parts.push("\n");
        el.childNodes.forEach(walk);
        if (block) parts.push("\n");
      };
      walk(doc.body);

      out = parts
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/ {2,}/g, " ")
        .trim();
      if (!out) out = (doc.body.textContent ?? "").trim();
      if (!out) throw new Error("No readable text found in the HTML");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML to text",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default htmlToTxt;
