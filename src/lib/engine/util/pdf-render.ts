/**
 * Render a PDF page to a Canvas using pdf.js.
 *
 * Used by every "PDF → image" converter. The PDF.js worker URL needs to be
 * provided so it can spawn its own worker thread for parsing, without it,
 * pdf.js processes everything on the main thread (slow + janky).
 *
 * Worker hosting: we point at the unpkg CDN with the exact pdfjs version
 * we depend on. This avoids bundler-specific import suffixes (Vite's
 * `?url`, Webpack's `new URL(import.meta.url)`) and keeps Turbopack happy.
 * The worker file is ~1MB; browsers cache it forever (versioned URL).
 */

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export interface PdfRenderOptions {
  /** 1-based page number. Defaults to 1 (first page only). */
  pageNumber?: number;
  /** Render scale multiplier, higher = sharper but bigger. Default 2 (~144dpi). */
  scale?: number;
}

export interface PdfRenderResult {
  canvas: HTMLCanvasElement;
  pageCount: number;
}

export async function renderPdfPage(
  input: File | Blob,
  opts: PdfRenderOptions = {},
): Promise<PdfRenderResult> {
  const pdfjs = await loadPdfjs();

  const arrayBuffer = await input.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageNum = Math.max(1, Math.min(opts.pageNumber ?? 1, pdf.numPages));
  const page = await pdf.getPage(pageNum);

  const scale = opts.scale ?? 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  await page.cleanup();
  await pdf.destroy();

  return { canvas, pageCount: pdf.numPages };
}

/** Convert a Canvas to a Blob in the requested format. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Encode ${mime} failed`))),
      mime,
      quality,
    );
  });
}
