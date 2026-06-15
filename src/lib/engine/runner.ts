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
import { REGISTRY_META } from "./registry-meta";

/**
 * When a user uploads a file whose extension does not match what the
 * current converter accepts, scan the meta catalog for another tool
 * that DOES accept that extension and prefer the "reverse direction"
 * if the current tool is `X-to-Y` and we find `Y-to-...`. Returns a
 * short suggestion suitable for appending to the error message, or
 * null when nothing reasonable matches.
 */
function suggestToolForExt(currentTool: string, ext: string): string | null {
  const lower = ext.toLowerCase();
  const matches: string[] = [];
  for (const [id, meta] of Object.entries(REGISTRY_META)) {
    if (id === currentTool) continue;
    if (meta.accept.some((a) => a.toLowerCase() === lower)) matches.push(id);
  }
  if (matches.length === 0) return null;
  const [, to] = currentTool.split("-to-");
  // Best match: the user wanted output Y, just dropped wrong input. So
  // for current "X-to-Y" + dropped ".Z" prefer "Z-to-Y" (same output).
  if (to) {
    const sameOutput = matches.find((id) => id.endsWith(`-to-${to}`));
    if (sameOutput) return `the ${sameOutput} tool`;
  }
  // Otherwise the reverse-direction tool (current X-to-Y + dropped .Y
  // → suggest Y-to-X) is the next-best inference.
  const [from] = currentTool.split("-to-");
  if (from && to) {
    const reverse = `${to}-to-${from}`;
    if (matches.includes(reverse)) return `the ${reverse} tool`;
  }
  // No contextually good fit. For ambiguous extensions like .zip (which
  // ~10 tools accept), naming any one of them is misleading more often
  // than helpful (PostHog showed .zip on csv-to-ris suggesting
  // apple-health-to-csv, which was wrong for the user's intent). Only
  // surface a suggestion when there are 1-2 candidates, otherwise stay
  // silent and let the base "expects X but got Y" message stand alone.
  if (matches.length <= 2) return `the ${matches[0]} tool`;
  return null;
}

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
  // The literal "*" / "*/*" entries act as wildcards for converters like
  // file-to-md5 that intentionally accept any input (hashes don't care
  // about file format).
  const lowerName = input.name.toLowerCase();
  const matchesExt = converter.accept.some(
    (ext) => ext === "*" || lowerName.endsWith(ext.toLowerCase()),
  );
  // application/octet-stream is the generic fallback browsers report
  // for any extension the OS has no MIME for (.jef, .pes, .nbib etc.).
  // It carries zero signal, so it must NOT be treated as a positive
  // mime match that overrides an explicit extension mismatch — that
  // bypass was masking the wrong-direction-misuse case in production.
  const lowerMime = input.type?.toLowerCase() ?? "";
  const isGenericMime = !lowerMime || lowerMime === "application/octet-stream";
  const matchesMime = isGenericMime
    ? false
    : converter.fromMime.includes("*/*") ||
      converter.fromMime.includes(lowerMime);

  if (!matchesExt && !matchesMime) {
    // Wrong-direction misuse is the dominant cause of these errors per
    // PostHog (e.g. a user drops .ris on bibtex-to-csv when they meant
    // ris-to-csv, or .jef on pes-to-jef when they meant jef-to-pes).
    // Look up which OTHER tool actually accepts this extension and tell
    // the user about it instead of just rejecting them.
    const ext = lowerName.includes(".")
      ? `.${lowerName.split(".").pop()}`
      : "";
    const suggestion = ext ? suggestToolForExt(converterId, ext) : null;
    const base = `${converter.label} expects ${converter.accept.join(" / ")} but got "${input.name}"`;
    throw new UnsupportedInputError(
      suggestion ? `${base}. Try ${suggestion} instead.` : base,
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
    // Detect the cloud-sync placeholder failure: OneDrive Files-On-Demand,
    // Dropbox Smart Sync and iCloud Drive let the file picker hand the
    // browser a stub File whose actual bytes are not yet downloaded.
    // The OS read fails with the literal Win32 ERROR_FILE_NOT_FOUND text
    // (HRESULT 0x80070002) or a DOMException "NotFoundError". The user
    // sees "could not convert: A requested file or directory..." with no
    // idea how to fix it. Surface an actionable message instead.
    const rawMsg = err instanceof Error ? err.message : String(err);
    // Converters wrap inner errors with ConvertFailedError, which sets
    // its own .name and hides the original DOMException name. Unwrap
    // .cause once to find the real one (e.g. a NotFoundError thrown by
    // input.text() before the converter ever got going).
    const cause = (err as { cause?: unknown })?.cause;
    const isCloudPlaceholder =
      (err instanceof Error && err.name === "NotFoundError") ||
      (cause instanceof Error && cause.name === "NotFoundError") ||
      /requested file or directory could not be found/i.test(rawMsg) ||
      /system cannot find the (file|path) specified/i.test(rawMsg);
    if (isCloudPlaceholder) {
      throw new ConvertFailedError(
        `Could not read "${input.name}". This usually means the file is stored in OneDrive, Dropbox, or iCloud and has not been downloaded locally yet. Right-click the file in your file explorer, choose "Always keep on this device" (or equivalent), wait for it to sync, then try again.`,
        err,
      );
    }
    // Browser NotReadableError: the file reference went stale after the
    // user picked it. The OS read fails with a DOMException "NotReadableError"
    // (Chrome's message: "...could not be read, typically due to permission
    // problems that have occurred after a reference to a file was acquired").
    // This happens when the file was moved/renamed/deleted, another app is
    // writing to it, or (common on mobile) the picker's reference expired.
    // The raw message is opaque, so surface an actionable one.
    const causeMsg = cause instanceof Error ? cause.message : "";
    const unreadableRe = /could not be read, typically due to permission|the requested file could not be read/i;
    const isUnreadable =
      (err instanceof Error && err.name === "NotReadableError") ||
      (cause instanceof Error && cause.name === "NotReadableError") ||
      unreadableRe.test(rawMsg) ||
      unreadableRe.test(causeMsg);
    if (isUnreadable) {
      throw new ConvertFailedError(
        `Could not read "${input.name}". The file may have moved, been renamed or deleted, or changed since you selected it (this also happens when another app is writing to it, or on mobile when the file reference expires). Re-select the file and try again.`,
        err,
      );
    }
    throw new ConvertFailedError(
      `${converter.label} failed: ${rawMsg}`,
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
