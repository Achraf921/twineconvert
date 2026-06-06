/**
 * Graphviz WASM loader. @hpcc-js/wasm-graphviz packages the upstream
 * Graphviz binaries (dot, neato, etc.) compiled to WebAssembly. The
 * runtime is large-ish (~3 MB gzipped) so we cache the loaded instance
 * across conversions in a single session.
 */

interface GraphvizInstance {
  dot: (source: string) => string;
}

let instancePromise: Promise<GraphvizInstance> | null = null;

export async function getGraphviz(): Promise<GraphvizInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      const mod = await import("@hpcc-js/wasm-graphviz");
      return (await mod.Graphviz.load()) as unknown as GraphvizInstance;
    })();
  }
  return instancePromise;
}

export async function renderDotToSvg(source: string): Promise<string> {
  const gv = await getGraphviz();
  let svg: string;
  try {
    svg = gv.dot(source);
  } catch (err) {
    throw new Error(
      `Graphviz failed to render the DOT source: ${err instanceof Error ? err.message : String(err)}. Check the source for syntax errors (missing semicolons, unmatched braces).`,
    );
  }
  if (!svg || svg.length < 50 || !/<svg/i.test(svg)) {
    throw new Error(
      "Graphviz returned empty or invalid output. The DOT source may be empty or have only commented-out content.",
    );
  }
  return svg;
}
