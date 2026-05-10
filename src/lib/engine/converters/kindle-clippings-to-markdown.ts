import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseKindleClippings, type KindleClipping } from "../util/kindle-clippings-parse";

/**
 * Generic Markdown export — groups clippings by book with a # heading
 * per book, then ## per highlight type, then a blockquote of the text.
 * This format imports cleanly into any Markdown app (Obsidian, Notion
 * via Markdown import, Bear, Logseq, plain text editors).
 */
const kindleClippingsToMarkdown: Converter = {
  id: "kindle-clippings-to-markdown",
  label: "Kindle Clippings → Markdown",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/markdown",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let md: string;
    try {
      const text = await input.text();
      const clippings = parseKindleClippings(text);
      md = buildMarkdown(clippings);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Kindle clippings",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([md], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

function buildMarkdown(clippings: KindleClipping[]): string {
  const byBook = new Map<string, KindleClipping[]>();
  for (const c of clippings) {
    const key = c.author ? `${c.book} — ${c.author}` : c.book;
    const list = byBook.get(key) ?? [];
    list.push(c);
    byBook.set(key, list);
  }

  const sections: string[] = [];
  for (const [bookKey, items] of byBook) {
    sections.push(`# ${bookKey}\n`);
    for (const c of items) {
      const meta: string[] = [];
      if (c.location) meta.push(`Location ${c.location}`);
      if (c.page) meta.push(`Page ${c.page}`);
      if (c.addedAt) meta.push(c.addedAt);
      const metaLine = meta.length ? `*${meta.join(" · ")}*\n\n` : "";
      const heading = c.type === "note" ? "### Note" : c.type === "bookmark" ? "### Bookmark" : "### Highlight";
      const body = c.text ? `> ${c.text.replace(/\n/g, "\n> ")}\n` : "_(no body)_\n";
      sections.push(`${heading}\n\n${metaLine}${body}`);
    }
    sections.push("");
  }
  return sections.join("\n");
}

export default kindleClippingsToMarkdown;
