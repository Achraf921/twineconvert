/**
 * Batch conversion: run one converter over many files, then package the
 * successes into a single zip. Kept out of the UI component so it can be
 * unit-tested against real converters (the React layer only owns state).
 *
 * Conversions run strictly sequentially. WASM converters (FFmpeg, libheif,
 * pdfjs, web-ifc) each allocate large heaps; converting in parallel would
 * multiply peak memory and OOM the tab on big batches. Sequential keeps
 * peak memory at one-file-at-a-time.
 */

import type JSZipType from "jszip";
import { run } from "./runner";

export type BatchResult = {
  file: File;
  status: "success" | "error";
  output?: { blob: Blob; filename: string };
  error?: string;
  /**
   * Error constructor name (UnsupportedInputError, ConvertFailedError, …).
   * Mirrors the single-file path so PostHog convert_error events group by
   * the same class — the batch fix-loop depends on this granularity.
   */
  errorClass?: string;
};

export interface BatchHandlers {
  onStart?(index: number): void;
  onProgress?(index: number, progress: number): void;
  onSettled?(index: number, result: BatchResult): void;
}

export async function convertBatch(
  toolId: string,
  files: File[],
  handlers: BatchHandlers = {},
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    handlers.onStart?.(i);
    try {
      const output = await run(toolId, file, {
        onProgress: (p) => handlers.onProgress?.(i, p),
      });
      const result: BatchResult = { file, status: "success", output };
      results.push(result);
      handlers.onSettled?.(i, result);
    } catch (e) {
      const result: BatchResult = {
        file,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        errorClass: e instanceof Error ? e.constructor.name : "Unknown",
      };
      results.push(result);
      handlers.onSettled?.(i, result);
    }
  }
  return results;
}

/**
 * Zip every successful output. Two inputs can yield the same output
 * filename (a.png and b.png both → out.csv); on collision we prefix the
 * input's base name so no entry is silently overwritten.
 */
export async function packageBatchZip(results: BatchResult[]): Promise<Blob> {
  const ok = results.filter(
    (r): r is BatchResult & { output: { blob: Blob; filename: string } } =>
      r.status === "success" && !!r.output,
  );
  if (ok.length === 0) {
    throw new Error("No successful conversions to package.");
  }
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = new JSZip();
  const used = new Map<string, number>();
  for (const item of ok) {
    const { filename, blob } = item.output;
    const seen = used.get(filename) ?? 0;
    let name = filename;
    if (seen > 0) {
      const base = item.file.name.replace(/\.[^.]+$/, "");
      name = `${base}-${seen}-${filename}`;
    }
    used.set(filename, seen + 1);
    zip.file(name, blob);
  }
  return zip.generateAsync({ type: "blob" });
}
