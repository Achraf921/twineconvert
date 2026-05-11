import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * HCL (HashiCorp Configuration Language) → JSON. HCL is what Terraform,
 * Packer, Vault, Consul, and Nomad use for config — being able to convert
 * to JSON unlocks linting, schema validation, and programmatic editing.
 *
 * One-way for now: JSON → HCL would require pretty-printing with HCL's
 * quirky block syntax, deferred until we see real reverse-direction demand.
 */
const hclToJson: Converter = {
  id: "hcl-to-json",
  label: "HCL → JSON",
  fromMime: ["text/x-hcl", "application/hcl", "text/plain"],
  accept: [".hcl", ".tf", ".tfvars"],
  toMime: "application/json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const HclModule = await import("hcl2-parser");
      // hcl2-parser exports a default object with .parseToString()/.parseToObject()
      const HCL = (HclModule.default ?? HclModule) as {
        parseToObject: (text: string) => unknown;
      };
      const parsed = HCL.parseToObject(await input.text());
      out = JSON.stringify(parsed, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HCL to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default hclToJson;
