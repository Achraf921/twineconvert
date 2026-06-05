import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderTextPdf, type PdfTextSection } from "../util/jspdf-text";
import { parseWhatsapp } from "../util/whatsapp-parse";

/**
 * WhatsApp Chat → SEARCHABLE PDF. The court-evidence / archival use
 * case is the money one, people need a stable, paginated, human-
 * readable PDF that preserves who-said-what-when. Real text in the
 * PDF (not bitmap) is critical so investigators can grep and quote.
 */
const whatsappChatToPdf: Converter = {
  id: "whatsapp-chat-to-pdf",
  label: "WhatsApp Chat → PDF",
  fromMime: ["text/plain", "application/zip"],
  accept: [".txt", ".zip"],
  toMime: "application/pdf",
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const parsed = await parseWhatsapp(input);
      // One section that holds the entire transcript as a single body.
      // Each line: "[timestamp] sender: text" so it round-trips visually.
      const lines = parsed.messages.map((m) => {
        if (m.isSystem) return `(system) ${m.text}`;
        return `[${m.timestamp}] ${m.sender ?? ""}: ${m.text}`;
      });
      const sections: PdfTextSection[] = [
        {
          meta: [`${parsed.messages.length} messages`],
          body: lines.join("\n\n"),
        },
      ];
      blob = await renderTextPdf(sections, { title: "WhatsApp Chat Transcript" });
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render WhatsApp chat as PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name.replace(/\.zip$/i, ".txt"), "pdf") };
  },
};

export default whatsappChatToPdf;
