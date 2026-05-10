import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import type JSZipType from "jszip";

/**
 * MXL is the compressed MusicXML format — a zip containing:
 *   META-INF/container.xml  (points at the inner file)
 *   <something>.xml         (the actual MusicXML)
 *
 * Most notation software accepts both, but plain-text MusicXML is the
 * universal interchange. We unzip and extract the inner XML.
 */
const mxlToMusicXml: Converter = {
  id: "mxl-to-musicxml",
  label: "MXL → MusicXML",
  fromMime: ["application/vnd.recordare.musicxml", "application/zip"],
  accept: [".mxl"],
  toMime: "application/vnd.recordare.musicxml+xml",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let xml: string;
    try {
      const JSZip = (await import("jszip")).default as typeof JSZipType;
      const zip = await JSZip.loadAsync(await input.arrayBuffer());

      // Look up META-INF/container.xml to find the rootfile path
      const containerXml = await zip.file("META-INF/container.xml")?.async("string");
      let innerPath: string | null = null;
      if (containerXml && typeof DOMParser !== "undefined") {
        const doc = new DOMParser().parseFromString(containerXml, "application/xml");
        innerPath = doc.querySelector("rootfile")?.getAttribute("full-path") ?? null;
      }
      // Fallback: take the first .xml that isn't in META-INF
      if (!innerPath) {
        const candidate = zip.file(/^(?!META-INF\/).*\.xml$/i)[0];
        if (!candidate) throw new Error("MXL: no inner MusicXML file found");
        innerPath = candidate.name;
      }
      const inner = zip.file(innerPath);
      if (!inner) throw new Error(`MXL: declared inner file "${innerPath}" not found`);
      xml = await inner.async("string");
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not extract MXL", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" }),
      filename: swapExtension(input.name, "musicxml"),
    };
  },
};

export default mxlToMusicXml;
