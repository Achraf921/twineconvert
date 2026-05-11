import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBibtex } from "../util/bibtex";
import { parseCslJson } from "../util/csl-json";

/**
 * YAML (CSL-YAML) → BibTeX. Inverse of bibtex-to-yaml. Accepts both the
 * Pandoc convention (`references: [...]` wrapper) and the bare list form.
 */
const yamlToBibtex: Converter = {
  id: "yaml-to-bibtex",
  label: "YAML (CSL) → BibTeX",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".yaml", ".yml"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const yaml = await import("js-yaml");
      const loaded = yaml.load(await input.text(), { schema: yaml.JSON_SCHEMA });
      // Accept either {references: [...]} (Pandoc convention) or [...] directly
      const list = Array.isArray(loaded)
        ? loaded
        : (loaded as { references?: unknown[] })?.references;
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error("YAML must contain a CSL list or a `references:` key with one");
      }
      const citations = parseCslJson(JSON.stringify(list));
      out = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert YAML to BibTeX",
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

export default yamlToBibtex;
