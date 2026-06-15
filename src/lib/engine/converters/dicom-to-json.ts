import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDicom } from "../util/dicom";

/**
 * dicom-to-json. Extracts the metadata header of a DICOM file (patient,
 * study, image dimensions, modality, etc.) as JSON. The pixel data is
 * NOT included — for radiologists/researchers this is exactly what you
 * want when scanning a directory of DICOMs to build a manifest or
 * triage what to view in the imaging workstation.
 */
const dicomToJson: Converter = {
  id: "dicom-to-json",
  label: "DICOM → JSON",
  fromMime: ["application/dicom", "application/octet-stream"],
  // Real DICOM files are often extensionless / numerically named (IM1,
  // I0000001); accept any file and validate by the DICM magic bytes.
  accept: [".dcm", ".dicom", "*"],
  toMime: "application/json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const file = parseDicom(await input.arrayBuffer());
      out = JSON.stringify(file.metadata, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse DICOM",
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

export default dicomToJson;
