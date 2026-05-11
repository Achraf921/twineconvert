/**
 * Type declarations for libheif-js. The package itself doesn't ship .d.ts
 * files; this minimal surface covers what `src/lib/engine/util/heic-decode.ts`
 * actually uses. Add to this file if we touch more of the library API later
 * (encoding, metadata extraction, multi-frame iteration, etc.).
 */
declare module "libheif-js/wasm-bundle" {
  interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      imageData: ImageData,
      callback: (display: ImageData | null) => void,
    ): void;
  }
  interface HeifDecoder {
    decode(input: ArrayBufferView | ArrayBuffer): HeifImage[];
  }
  interface LibheifModule {
    HeifDecoder: new () => HeifDecoder;
  }
  const libheif: LibheifModule;
  export = libheif;
}
