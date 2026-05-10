/**
 * Shared `web-ifc` loader. The library needs a WASM binary path;
 * we serve from /ifc/ same-origin (the wasm is copied from
 * node_modules into public/ifc/ at build time).
 *
 * Was previously CDN-hosted but moved same-origin so production
 * traffic doesn't bounce through unpkg's CDN and so Vitest browser
 * tests can serve the file via the raw-asset-server plugin.
 */

import type { IfcAPI } from "web-ifc";

const WASM_PATH = "/ifc/";

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
