/**
 * Conversion engine, public types.
 *
 * The engine is a tiny orchestration layer over a registry of "converters".
 * Each converter handles ONE format pair (e.g. heic→jpg) and lazy-loads its
 * own WASM/JS dependencies the first time it runs. Tool pages don't import
 * converters directly, they go through the runner with a string id, which
 * keeps each route's bundle small.
 */

export interface Converter {
  /** Stable identifier used in URLs + the registry. e.g. "heic-to-jpg". */
  readonly id: string;

  /** MIME types the converter accepts as input (one or more variants). */
  readonly fromMime: readonly string[];

  /** MIME type produced. */
  readonly toMime: string;

  /** File-extension allowlist for the <input accept="..."> attribute. */
  readonly accept: readonly string[];

  /** Optional max file size hint (bytes). The runner enforces it pre-call. */
  readonly maxFileSizeBytes?: number;

  /** Human-readable label for UI. */
  readonly label: string;

  /** Run the conversion. Must be safe to call multiple times concurrently. */
  convert(input: File, opts?: ConvertOptions): Promise<ConvertResult>;
}

export interface ConvertOptions {
  /**
   * 0..1 quality for lossy outputs (jpeg, webp, mp3, etc.).
   * Converters that don't support it ignore the value.
   */
  quality?: number;

  /** Progress callback in 0..1 range; not all converters report progress. */
  onProgress?: (fraction: number) => void;

  /** Cancellation token. Converters should check periodically. */
  signal?: AbortSignal;
}

export interface ConvertResult {
  /** The encoded output, ready for download or further processing. */
  blob: Blob;

  /** Suggested filename. The runner may override based on caller preference. */
  filename: string;

  /** Optional metadata extracted during conversion (best-effort). */
  metadata?: ConvertMetadata;
}

export interface ConvertMetadata {
  width?: number;
  height?: number;
  durationSeconds?: number;
  bitrate?: number;
  pageCount?: number;
}

/**
 * Errors the engine throws / converters should throw.
 * Subclasses give the UI specific feedback paths.
 */
export class ConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Input file's MIME / extension doesn't match the converter's accept list. */
export class UnsupportedInputError extends ConvertError {}

/** Input file exceeds the converter's stated max size. */
export class FileTooLargeError extends ConvertError {
  constructor(
    message: string,
    public readonly sizeBytes: number,
    public readonly maxBytes: number,
  ) {
    super(message);
  }
}

/** Conversion was cancelled via AbortSignal. */
export class ConvertCancelledError extends ConvertError {}

/**
 * Underlying lib (WASM, browser API) failed in a way that's neither
 * cancellation nor input-validation. Usually a corrupt file or a
 * platform-quirk issue. Surface a generic "couldn't convert" to the user.
 */
export class ConvertFailedError extends ConvertError {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

/**
 * Lifecycle hook fired by the runner after every successful conversion.
 * Gives us one place to wire analytics / Pro-tier metering / quota counting
 * without touching individual converters.
 */
export type ConvertSuccessHook = (event: {
  converterId: string;
  inputBytes: number;
  outputBytes: number;
  durationMs: number;
}) => void;
