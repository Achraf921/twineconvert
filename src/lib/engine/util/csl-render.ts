/**
 * Render a Citation list into a formatted reference list in a real
 * citation style (APA, MLA, Chicago, ...) using citeproc-js, the same
 * CSL engine Zotero and Mendeley use. Output is correct by construction:
 * we feed the official Citation Style Language (CSL) style + locale to
 * citeproc rather than hand-rolling style rules.
 *
 * Everything runs offline in the browser: the CSL style XML and the
 * en-US locale are bundled as string modules and dynamically imported,
 * so a style is only downloaded with the chunk that needs it.
 *
 * We reuse the already-tested Citation -> CSL-JSON mapping in csl-json.ts
 * and only re-key each entry to a unique id citeproc can index.
 */

import type { Citation } from "./citation";
import { buildCslJson } from "./csl-json";

/** Map of style id -> lazy loader for its CSL style XML. Add a new style
 *  by dropping its CSL file into csl-data/ and adding an entry here. */
const STYLE_LOADERS: Record<string, () => Promise<string>> = {
  apa: async () => (await import("./csl-data/apa")).CSL_STYLE_APA,
  mla: async () => (await import("./csl-data/mla")).CSL_STYLE_MLA,
  chicago: async () => (await import("./csl-data/chicago-author-date")).CSL_STYLE_CHICAGO,
};

/** Human-readable name per style id (used in copy / error messages). */
export const STYLE_LABELS: Record<string, string> = {
  apa: "APA (7th edition)",
  mla: "MLA (9th edition)",
  chicago: "Chicago (author-date)",
};

export function isCitationStyle(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(STYLE_LOADERS, id);
}

export async function renderCitationStyle(
  citations: Citation[],
  styleId: string,
  format: "text" | "html" = "text",
): Promise<string> {
  if (citations.length === 0) {
    throw new Error("No references found to format.");
  }
  const loader = STYLE_LOADERS[styleId];
  if (!loader) throw new Error(`Unsupported citation style: ${styleId}`);

  const [mod, styleXml, localeMod] = await Promise.all([
    import("citeproc"),
    loader(),
    import("./csl-data/locale-en-us"),
  ]);
  const CSL = mod.default;
  const localeXml = localeMod.CSL_LOCALE_EN_US;

  // Reuse the tested Citation -> CSL-JSON mapping, then re-key each entry
  // to a unique, citeproc-indexable id.
  const cslArray = JSON.parse(buildCslJson(citations)) as Array<Record<string, unknown>>;
  const items: Record<string, unknown> = {};
  const ids: string[] = [];
  cslArray.forEach((entry, i) => {
    const id = `ITEM-${i}`;
    entry.id = id;
    // Normalize LaTeX ("45--67") and unicode en/em-dash page-range
    // separators to a single hyphen so the CSL style's own
    // page-range-format renders them consistently (BibTeX uses "--",
    // RIS uses a plain hyphen).
    if (typeof entry.page === "string") {
      entry.page = entry.page.replace(/\s*(?:-{2,3}|[\u2013\u2014])\s*/g, "-");
    }
    items[id] = entry;
    ids.push(id);
  });

  const sys = {
    retrieveLocale: () => localeXml,
    retrieveItem: (id: string) => items[id],
  };
  const engine = new CSL.Engine(sys, styleXml, "en-US");
  engine.setOutputFormat(format);
  engine.updateItems(ids);
  const bib = engine.makeBibliography();
  if (!bib) {
    throw new Error("The citation style engine could not format these references.");
  }
  const entries = bib[1].map((s) => s.trim()).filter(Boolean);
  if (entries.length === 0) {
    throw new Error("No references could be formatted.");
  }
  return entries.join("\n\n") + "\n";
}
