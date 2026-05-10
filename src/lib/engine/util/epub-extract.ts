/**
 * Headless EPUB extraction via JSZip.
 *
 * EPUB files are ZIPs containing:
 *   - META-INF/container.xml, points to the OPF (package) file
 *   - <opf>, manifest + spine (reading order)
 *   - one or more (X)HTML chapter files
 *
 * We avoid epubjs because it's built for in-browser rendering: spawns
 * iframes, fights with CORS, depends heavily on global DOM APIs. For our
 * "give me the text/html and get out" use case, raw zip parsing is a
 * fraction of the code and has zero side effects.
 */

import type JSZipType from "jszip";

export interface ExtractedEpub {
  /** Title from OPF metadata, or filename fallback. */
  title: string;
  /** Concatenated chapter HTMLs, in spine order. */
  chaptersHtml: string[];
  /** Concatenated plain text from all chapters, in spine order. */
  text: string;
}

const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;

function parseXml(xml: string): Document {
  if (!parser) throw new Error("DOMParser unavailable in this environment");
  return parser.parseFromString(xml, "application/xml");
}

/** Resolve a path inside the EPUB (zip), normalizing `../` segments. */
function resolveInZip(base: string, relative: string): string {
  const baseParts = base.split("/").slice(0, -1);
  const relParts = relative.split("/");
  for (const part of relParts) {
    if (part === "..") baseParts.pop();
    else if (part !== ".") baseParts.push(part);
  }
  return baseParts.join("/");
}

export async function extractEpub(input: File | Blob): Promise<ExtractedEpub> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(await input.arrayBuffer());

  // 1. Locate the OPF via container.xml
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("Not a valid EPUB (missing container.xml)");
  const containerDoc = parseXml(containerXml);
  const rootfile = containerDoc.querySelector("rootfile");
  const opfPath = rootfile?.getAttribute("full-path");
  if (!opfPath) throw new Error("EPUB container.xml has no rootfile");

  // 2. Parse OPF, pull metadata, manifest, spine
  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) throw new Error(`OPF file not found at ${opfPath}`);
  const opfDoc = parseXml(opfXml);

  const title =
    opfDoc.getElementsByTagName("dc:title")[0]?.textContent?.trim() ||
    (input instanceof File ? input.name.replace(/\.epub$/i, "") : "epub");

  // Manifest: id -> href
  const manifest: Record<string, string> = {};
  for (const item of Array.from(opfDoc.querySelectorAll("manifest > item"))) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest[id] = href;
  }

  // 3. Walk spine in order, load each chapter HTML
  const chaptersHtml: string[] = [];
  const textParts: string[] = [];

  for (const itemref of Array.from(opfDoc.querySelectorAll("spine > itemref"))) {
    const idref = itemref.getAttribute("idref");
    if (!idref) continue;
    const href = manifest[idref];
    if (!href) continue;

    const fullPath = resolveInZip(opfPath, href);
    const html = await zip.file(fullPath)?.async("string");
    if (!html) continue;

    chaptersHtml.push(html);

    // Strip tags for plain-text version. Body-only first to skip <head>.
    const doc = parseXml(html);
    const body = doc.getElementsByTagName("body")[0];
    const text = (body?.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text) textParts.push(text);
  }

  return {
    title,
    chaptersHtml,
    text: textParts.join("\n\n"),
  };
}
