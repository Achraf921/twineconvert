import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import type JSZipType from "jszip";

/**
 * MusicXML → MXL. MXL is the compressed MusicXML format — a zip
 * containing the inner XML plus a META-INF/container.xml that points
 * at it. We just wrap the input XML.
 */
const musicXmlToMxl: Converter = {
  id: "musicxml-to-mxl",
  label: "MusicXML → MXL",
  fromMime: ["application/vnd.recordare.musicxml+xml", "application/xml", "text/xml"],
  accept: [".musicxml", ".xml"],
  toMime: "application/vnd.recordare.musicxml",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const JSZip = (await import("jszip")).default as typeof JSZipType;
      const zip = new JSZip();
      const innerName = input.name.replace(/\.(musicxml|xml)$/i, ".xml") || "score.xml";
      const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="${innerName}" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`;
      zip.file("META-INF/container.xml", containerXml);
      zip.file(innerName, await input.text());
      blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.recordare.musicxml",
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not compress MusicXML to MXL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mxl") };
  },
};

export default musicXmlToMxl;
