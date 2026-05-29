/**
 * Verovio toolkit loader. Verovio is the WASM-based music-engraving
 * toolkit used by IMSLP and the broader music-encoding community. It
 * accepts MEI (its native format) and MusicXML, and renders to SVG
 * (the format we expose) plus PDF/MIDI internally.
 *
 * IMPORTANT: we explicitly import `verovio/wasm` + `verovio/esm`, NOT
 * the default `verovio` entry. The default points at a Node-targeted
 * CJS bundle that references `node:crypto` / `node:fs`, which Next.js
 * webpack refuses to bundle for the browser. The /wasm + /esm subpath
 * is the browser-safe ESM build (works in Node too).
 *
 * The WASM runtime takes a few hundred ms to initialise and the
 * toolkit object is reusable across conversions, so we cache the
 * initialized instance behind a single Promise.
 */

interface VerovioToolkit {
  loadData(input: string): boolean;
  renderToSVG(page: number, options?: Record<string, unknown>): string;
  getPageCount(): number;
  setOptions(options: Record<string, unknown>): void;
}

let toolkitPromise: Promise<VerovioToolkit> | null = null;

export async function getVerovio(): Promise<VerovioToolkit> {
  if (!toolkitPromise) {
    toolkitPromise = (async () => {
      // Browser-safe ESM entry points (see header note for why).
      const wasmModule = (await import("verovio/wasm")) as unknown as {
        default: () => Promise<unknown>;
      };
      const esmModule = (await import("verovio/esm")) as unknown as {
        VerovioToolkit: new (mod: unknown) => VerovioToolkit;
      };
      const wasm = await wasmModule.default();
      return new esmModule.VerovioToolkit(wasm);
    })();
  }
  return toolkitPromise;
}

/**
 * Render a MusicXML string to one combined SVG (single document).
 * Verovio paginates by default; we render every page then concatenate
 * so the caller gets a single self-contained SVG suitable for embed.
 */
export async function renderMusicXmlToSvg(xml: string): Promise<string> {
  const tk = await getVerovio();
  tk.setOptions({ inputFormat: "musicxml", scale: 40, breaks: "auto" });
  if (!tk.loadData(xml)) {
    throw new Error(
      "Verovio failed to load the MusicXML. The file may be malformed or contain features Verovio does not support; try opening it in a notation editor and re-exporting.",
    );
  }
  const pageCount = tk.getPageCount();
  if (pageCount === 0) {
    throw new Error("MusicXML parsed but produced no pages. The score may be empty.");
  }
  if (pageCount === 1) return tk.renderToSVG(1, {});
  const pages: string[] = [];
  for (let i = 1; i <= pageCount; i++) pages.push(tk.renderToSVG(i, {}));
  return pages.join("\n");
}
