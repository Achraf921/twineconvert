import type JSZipType from "jszip";
import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderMusicXmlToSvg } from "../util/verovio";

/**
 * MXL → SVG. MXL is the compressed-MusicXML zip that exporters from
 * MuseScore, Sibelius, and Finale typically produce. We extract the
 * inner MusicXML (declared via META-INF/container.xml, falling back
 * to the first non-META-INF .xml) and pipe it through the Verovio
 * MusicXML-to-SVG renderer used by musicxml-to-svg.
 *
 * Same engraved-sheet-music output, just with the unzip step inlined.
 */
const mxlToSvg: Converter = {
  id: "mxl-to-svg",
  label: "MXL → SVG",
  fromMime: ["application/vnd.recordare.musicxml", "application/zip"],
  accept: [".mxl"],
  toMime: "image/svg+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let svg: string;
    try {
      const JSZip = (await import("jszip")).default as typeof JSZipType;
      const zip = await JSZip.loadAsync(await input.arrayBuffer());

      // Resolve the inner MusicXML path: prefer the rootfile declared in
      // META-INF/container.xml; fall back to the first non-META-INF .xml.
      const containerXml = await zip.file("META-INF/container.xml")?.async("string");
      let innerPath: string | null = null;
      if (containerXml && typeof DOMParser !== "undefined") {
        const doc = new DOMParser().parseFromString(containerXml, "application/xml");
        innerPath = doc.querySelector("rootfile")?.getAttribute("full-path") ?? null;
      }
      if (!innerPath) {
        const candidate = zip.file(/^(?!META-INF\/).*\.xml$/i)[0];
        if (!candidate) throw new Error("MXL: no inner MusicXML file found");
        innerPath = candidate.name;
      }
      const inner = zip.file(innerPath);
      if (!inner) throw new Error(`MXL: declared inner file "${innerPath}" not found`);
      const xml = await inner.async("string");
      opts?.onProgress?.(0.5);
      svg = await renderMusicXmlToSvg(xml);
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render MXL to SVG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "svg"),
    };
  },
};

export default mxlToSvg;
