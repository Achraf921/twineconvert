/**
 * Ambient types for jpeg-lossless-decoder-js.
 *
 * The package's package.json points `types` at `release/lossless.d.ts`, but
 * that file is not actually shipped, so TypeScript falls back to `any`. We only
 * use the Decoder class, so declare the minimal surface we call.
 */
declare module "jpeg-lossless-decoder-js" {
  /** Decodes a JPEG-lossless (ITU-T81) stream into raw pixel bytes. */
  export class Decoder {
    constructor(buffer?: ArrayBuffer | null, numBytes?: number);
    /**
     * Decompress `length` bytes of a JPEG-lossless stream starting at `offset`.
     * Returns the raw pixel buffer (bytes match numBytes-per-component *
     * numComp * width * height).
     */
    decompress(buffer: ArrayBuffer, offset: number, length: number): ArrayBuffer;
    /** Frame header, populated after decode. */
    frame: { dimX: number; dimY: number; numComp: number };
    /** Number of image components (1 = grayscale, 3 = RGB). */
    numComp: number;
    /** Bytes per component (1 = 8-bit, 2 = up-to-16-bit). */
    numBytes: number;
  }

  export const Utils: {
    crc32(data: ArrayBuffer | Uint8Array): number;
  };
}
