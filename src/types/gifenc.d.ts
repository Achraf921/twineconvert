declare module "gifenc" {
  interface GIFEncoderInstance {
    writeFrame(
      indexed: Uint8Array | Uint8ClampedArray,
      width: number,
      height: number,
      options?: { palette?: number[][]; delay?: number; transparent?: boolean; transparentIndex?: number },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  export function GIFEncoder(): GIFEncoderInstance;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: string; oneBitAlpha?: number | boolean; clearAlpha?: boolean; clearAlphaThreshold?: number; clearAlphaColor?: number },
  ): number[][];
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string,
  ): Uint8Array;
}
