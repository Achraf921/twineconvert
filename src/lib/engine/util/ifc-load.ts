/**
 * Shared `web-ifc` loader. The lib needs a WASM binary path; we point
 * at the unpkg CDN with the exact pinned version to keep it stable.
 *
 * Same pattern as our pdfjs and ffmpeg loaders — single cached promise
 * so multiple converters in the same session reuse one instance.
 */

import type { IfcAPI } from "web-ifc";

const WEB_IFC_VERSION = "0.0.69";
const WASM_PATH = `https://unpkg.com/web-ifc@${WEB_IFC_VERSION}/`;

let apiPromise: Promise<IfcAPI> | null = null;

export async function loadIfcApi(): Promise<IfcAPI> {
  if (!apiPromise) {
    apiPromise = (async () => {
      const webIfc = await import("web-ifc");
      const api = new webIfc.IfcAPI();
      api.SetWasmPath(WASM_PATH);
      await api.Init();
      return api;
    })();
  }
  return apiPromise;
}

export async function openIfcModel(input: File | Blob): Promise<{ api: IfcAPI; modelID: number }> {
  const api = await loadIfcApi();
  const bytes = new Uint8Array(await input.arrayBuffer());
  const modelID = api.OpenModel(bytes);
  return { api, modelID };
}
