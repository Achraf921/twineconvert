/**
 * Extract the embedded preview PDF from any iWork file (.pages, .numbers,
 * .key/.keynote).
 *
 * Apple's iWork apps save documents as zips that include a `preview.pdf`
 * (and often `preview-micro.pdf` thumbnail) for QuickLook + Spotlight
 * indexing. The file is the result of "Print → Save as PDF" of the
 * document's current state — so for the common "I have a .pages file
 * but no Mac, I just need to read it" use case, this preview IS the PDF
 * the user wants. No iWork XML reverse-engineering required.
 *
 * Caveats:
 *   - Files exported "without preview" from iWork settings won't have
 *     a preview.pdf. Rare, but possible.
 *   - The preview reflects the document at last save time; if it's
 *     missing pages or has stale content, the user needs to open the
 *     file in iWork and re-save (which we can't do for them).
 */

import type JSZipType from "jszip";

export async function extractIworkPreview(input: File | Blob): Promise<Blob> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(await input.arrayBuffer());
  const candidates = ["preview.pdf", "QuickLook/Preview.pdf", "preview-web.html"];
  for (const path of candidates) {
    const entry = zip.file(path);
    if (entry && path.endsWith(".pdf")) {
      const bytes = await entry.async("uint8array");
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      return new Blob([buf], { type: "application/pdf" });
    }
  }
  // Fallback: scan for any *.pdf at the root level.
  const anyPdf = zip.file(/^[^/]+\.pdf$/i)[0];
  if (anyPdf) {
    const bytes = await anyPdf.async("uint8array");
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Blob([buf], { type: "application/pdf" });
  }
  throw new Error(
    "No preview PDF found inside the iWork file. The document may have been saved without preview enabled — open it in iWork and re-save with the 'Include preview in document' option checked.",
  );
}
