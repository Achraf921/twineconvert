import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { buildCslJson } from "../util/csl-json";

/**
 * BibTeX → YAML (CSL-YAML for Pandoc bibliography). Pandoc Markdown
 * documents can embed bibliography metadata directly in their YAML
 * frontmatter using the CSL-YAML format, which is just CSL-JSON
 * re-serialized as YAML. Goes through the unified Citation model.
 */
const bibtexToYaml: Converter = {
  id: "bibtex-to-yaml",
  label: "BibTeX → YAML (CSL)",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let yamlOut: string;
    try {
      const yaml = await import("js-yaml");
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("BibTeX has no entries");
      // Round-trip through CSL-JSON to get the canonical structured shape,
      // then re-emit as YAML. Pandoc wraps the list under a `references:`
      // key when embedded in document frontmatter; we emit the bare list
      // since that's what works with `--bibliography file.yaml`.
      const cslArr = JSON.parse(buildCslJson(citations));
      yamlOut = yaml.dump({ references: cslArr }, {
        indent: 2,
        lineWidth: -1,
        schema: yaml.JSON_SCHEMA,
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to YAML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([yamlOut], { type: "application/x-yaml;charset=utf-8" }),
      filename: swapExtension(input.name, "yaml"),
    };
  },
};

export default bibtexToYaml;
