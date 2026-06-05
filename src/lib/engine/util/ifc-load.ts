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

      // Init() does the actual WASM fetch and instantiation. PostHog
      // surfaced one transient "Aborted(both async and sync fetching
      // of the wasm failed)" - the user's first fetch raced into a
      // network hiccup, no retry, conversion died. Retry once after
      // 500ms; if both attempts fail, throw a user-actionable error
      // instead of the raw Emscripten message.
      try {
        await api.Init();
      } catch (firstErr) {
        // Reset the singleton so the retry creates a fresh API instance
        // (Emscripten leaves the previous one in a half-aborted state).
        apiPromise = null;
        await new Promise((r) => setTimeout(r, 500));
        try {
          const retryApi = new webIfc.IfcAPI();
          retryApi.SetWasmPath(WASM_PATH);
          await retryApi.Init();
          return retryApi;
        } catch (secondErr) {
          throw new Error(
            "Could not download the IFC engine. Check your network connection or browser settings (some enterprise CSPs block WebAssembly); refresh and try again. " +
              `Underlying error: ${secondErr instanceof Error ? secondErr.message : String(secondErr)}`,
          );
        }
      }
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
