/**
 * Decode a HEIC/HEIF file into a re-encoded Blob of the requested format.
 *
 * Uses libheif-js (the actively maintained Emscripten build of libheif).
 * Previously this util used heic2any@0.0.4 which wraps a 2019-era libheif
 * WASM and rejects HEIC files produced by iPhones from 2022+ with newer
 * codec profiles. iPhone Live Photos, edited photos exported by the
 * Photos app, and HEVC main-10 (10-bit color) HEIC files all triggered
 * `Could not parse HEIF file {code: 2, subcode: 0}` despite rendering
 * correctly in macOS Preview. Switched to libheif-js 1.19+ which
 * supports every iPhone-produced HEIC profile we've seen.
 *
 * Pipeline:
 *   1. libheif-js parses the HEIC into a frame array (multi-image
 *      containers like Live Photos / bursts return multiple frames;
 *      we take frame 0 = the primary).
 *   2. The frame's pixel data is rendered into an ImageData buffer
 *      via libheif-js's display() callback.
 *   3. The buffer is put into a Canvas, then canvas.toBlob() re-encodes
 *      to the target MIME (JPEG/PNG/WebP) via the browser's native
 *      encoder.
 *
 * Browser-only: depends on Canvas + ImageData + canvas.toBlob. Imports
 * are dynamic so SSR + the converter registry don't pull libheif WASM
 * into the initial bundle.
 */

// libheif-js doesn't ship TypeScript types. Declare the minimal surface
// we use here so the rest of the codebase stays type-safe.
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

export async function decodeHeic(
  input: File | Blob,
  toMime: "image/jpeg" | "image/png" | "image/webp",
  quality?: number,
): Promise<Blob> {
  // wasm-bundle variant ships the .wasm inlined into the .js so we don't
  // have to wire a separate WASM fetch through Next.js's bundler.
  const libheif = (await import("libheif-js/wasm-bundle")) as
    | LibheifModule
    | { default: LibheifModule };
  const heif = "HeifDecoder" in libheif ? libheif : libheif.default;

  const bytes = new Uint8Array(await input.arrayBuffer());
  const decoder = new heif.HeifDecoder();
  const images = decoder.decode(bytes);
  if (!images || images.length === 0) {
    throw new Error("HEIC file contains no decodable images");
  }

  // Pick the primary frame. Multi-image HEIC containers (Live Photos,
  // burst captures, depth-map pairs) put the user-visible image at
  // index 0; the others are auxiliary data (alpha masks, depth maps,
  // burst alternates) that we drop for the simple HEIC→raster case.
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();

  // Render the HEIC frame to RGBA pixels via libheif's display callback,
  // then copy into a canvas for re-encoding.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable in this browser");

  const imageData = ctx.createImageData(width, height);
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (display) => {
      if (!display) {
        reject(new Error("HEIF pixel-decode failed during display() callback"));
        return;
      }
      resolve();
    });
  });
  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Canvas.toBlob returned null for ${toMime}`));
          return;
        }
        resolve(blob);
      },
      toMime,
      quality,
    );
  });
}
