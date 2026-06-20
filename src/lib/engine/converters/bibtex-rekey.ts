import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { generateCitationKey } from "../util/citation";

/**
 * Regenerate BibTeX citation keys to a consistent AuthorYear form. Merging
 * .bib files from different sources leaves a mess of inconsistent or
 * duplicate keys; this rewrites each entry's key to lastnameYEAR_word and
 * disambiguates collisions. It edits only the key token in the original
 * text, so every field (including ones our model does not track, like
 * custom annotations) is preserved exactly.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const bibtexRekey: Converter = {
  id: "bibtex-rekey",
  label: "BibTeX Rekey",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseBibtex(text);
      if (citations.length === 0) throw new Error("No references found in the BibTeX file");
      const used = new Set<string>();
      out = text;
      for (const c of citations) {
        const base = generateCitationKey(c) || "ref";
        let key = base;
        let n = 1;
        while (used.has(key)) {
          n += 1;
          key = `${base}_${n}`;
        }
        used.add(key);
        if (key === c.id) continue;
        // Replace only this entry's key token: "@type{ oldkey ,".
        const re = new RegExp(`(@[A-Za-z]+\\s*\\{\\s*)${escapeRegExp(c.id)}(\\s*,)`);
        out = out.replace(re, `$1${key}$2`);
      }
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not rekey the BibTeX file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-bibtex;charset=utf-8" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default bibtexRekey;
