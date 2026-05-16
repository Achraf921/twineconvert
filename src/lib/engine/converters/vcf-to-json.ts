import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseVcard } from "../util/vcard";

const vcfToJson: Converter = {
  id: "vcf-to-json",
  label: "VCF → JSON",
  fromMime: ["text/vcard", "text/x-vcard", "text/plain"],
  accept: [".vcf", ".vcard"],
  toMime: "application/json",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const contacts = parseVcard(await input.text());
      if (contacts.length === 0) throw new Error("No contacts found in vCard file");
      json = JSON.stringify(contacts, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert vCard to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default vcfToJson;
