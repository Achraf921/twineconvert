import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseKindleClippings, type KindleClipping } from "../util/kindle-clippings-parse";

/**
 * Obsidian-flavored Markdown export. Differences from generic Markdown:
 *   - YAML frontmatter at the top (Obsidian indexes this for properties)
 *   - Per-book #book/<title> hashtags so the Obsidian graph view connects
 *   - Wikilink-friendly book titles ([[Book Title]] style)
 *   - One file's worth of content, ready to drop into a vault
 *
 * For users who want one file per book, the JSON output is the better
 * starting point — easier to script. This route covers the common case
 * of "import all my highlights as a single Obsidian note."
 */
const kindleClippingsToObsidianMd: Converter = {
  id: "kindle-clippings-to-obsidian-md",
  label: "Kindle Clippings → Obsidian (.md)",
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
      md = buildObsidianMarkdown(clippings);
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

function bookSlug(book: string): string {
  return book.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildObsidianMarkdown(clippings: KindleClipping[]): string {
  const byBook = new Map<string, KindleClipping[]>();
  for (const c of clippings) {
    const list = byBook.get(c.book) ?? [];
    list.push(c);
    byBook.set(c.book, list);
  }

  const allBookSlugs = Array.from(byBook.keys()).map(bookSlug);
  const frontmatter = [
    "---",
    `created: ${new Date().toISOString()}`,
    `source: Kindle My Clippings`,
    `total_highlights: ${clippings.filter((c) => c.type === "highlight").length}`,
    `total_notes: ${clippings.filter((c) => c.type === "note").length}`,
    `tags:`,
    `  - kindle`,
    `  - highlights`,
    ...allBookSlugs.map((s) => `  - book/${s}`),
    "---",
    "",
  ].join("\n");

  const sections: string[] = [];
  for (const [book, items] of byBook) {
    const author = items.find((i) => i.author)?.author;
    const title = author ? `[[${book}]] — ${author}` : `[[${book}]]`;
    sections.push(`# ${title}\n\n#book/${bookSlug(book)}\n`);
    for (const c of items) {
      const meta: string[] = [];
      if (c.location) meta.push(`Location ${c.location}`);
      if (c.page) meta.push(`Page ${c.page}`);
      if (c.addedAt) meta.push(c.addedAt);
      const metaLine = meta.length ? `*${meta.join(" · ")}*\n\n` : "";
      const tag = c.type === "note" ? "#note" : c.type === "bookmark" ? "#bookmark" : "#highlight";
      const body = c.text ? `> ${c.text.replace(/\n/g, "\n> ")}\n` : "";
      sections.push(`---\n\n${tag}\n\n${metaLine}${body}`);
    }
    sections.push("");
  }
  return frontmatter + sections.join("\n");
}

export default kindleClippingsToObsidianMd;
