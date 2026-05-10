import {
  ConvertCancelledError,
  ConvertFailedError,
  ConvertOptions,
  ConvertResult,
  ConvertSuccessHook,
  FileTooLargeError,
  UnsupportedInputError,
} from "./types";
import { ConverterId, loadConverter } from "./registry";

/**
 * The runner is the only public entry point external code uses to convert
 * a file. It handles:
 *   - lazy-loading the requested converter (and its WASM lib)
 *   - input validation (extension match, size cap)
 *   - normalizing errors into our typed hierarchy
 *   - measuring duration and firing the success hook
 *
 * Converter authors only implement `convert()`; everything else lives here.
 */

const successHooks = new Set<ConvertSuccessHook>();

/** Subscribe to successful-conversion events (analytics, metering, etc.). */
export function onConvertSuccess(hook: ConvertSuccessHook): () => void {
  successHooks.add(hook);
  return () => successHooks.delete(hook);
}

export interface RunOptions extends ConvertOptions {
  /** Override the suggested output filename. */
  filenameOverride?: string;
}

export async function run(
  converterId: ConverterId,
  input: File,
  opts: RunOptions = {},
): Promise<ConvertResult> {
  const converter = await loadConverter(converterId);

  // Validate input matches what the converter accepts. Check extension first
  // (cheap), then MIME type (browsers don't always populate type accurately
  // for HEIC etc., so extension is the primary signal).
  const lowerName = input.name.toLowerCase();
  const matchesExt = converter.accept.some((ext) =>
    lowerName.endsWith(ext.toLowerCase()),
  );
  const matchesMime =
    !input.type || converter.fromMime.includes(input.type.toLowerCase());

  if (!matchesExt && !matchesMime) {
    throw new UnsupportedInputError(
      `${converter.label} expects ${converter.accept.join(" / ")} but got "${input.name}"`,
    );
  }

  // Size cap (if the converter declared one).
  if (
    converter.maxFileSizeBytes !== undefined &&
    input.size > converter.maxFileSizeBytes
  ) {
    throw new FileTooLargeError(
      `File is ${(input.size / 1024 / 1024).toFixed(1)}MB; ${converter.label} caps at ${(converter.maxFileSizeBytes / 1024 / 1024).toFixed(0)}MB`,
      input.size,
      converter.maxFileSizeBytes,
    );
  }

  // Pre-flight cancellation check
  if (opts.signal?.aborted) {
    throw new ConvertCancelledError("Cancelled before start");
  }

  const startedAt = performance.now();
  let result: ConvertResult;
  try {
    result = await converter.convert(input, opts);
  } catch (err) {
    if (err instanceof ConvertCancelledError) throw err;
    if (err instanceof UnsupportedInputError) throw err;
    if (err instanceof FileTooLargeError) throw err;
    if (opts.signal?.aborted) {
      throw new ConvertCancelledError("Cancelled mid-run");
    }
    throw new ConvertFailedError(
      `${converter.label} failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  if (opts.filenameOverride) {
    result = { ...result, filename: opts.filenameOverride };
  }

  const durationMs = Math.round(performance.now() - startedAt);
  for (const hook of successHooks) {
    try {
      hook({
        converterId,
        inputBytes: input.size,
        outputBytes: result.blob.size,
        durationMs,
      });
    } catch {
      // Hooks must not break user-facing conversions
    }
  }

  return result;
}
