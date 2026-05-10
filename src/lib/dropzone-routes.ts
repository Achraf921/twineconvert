/**
 * Build the homepage dropzone routing table at build time on the server.
 * Maps every accepted extension (e.g. ".heic") to the list of converter
 * pages that accept it, so a file dropped on the homepage can be routed
 * to the right tool.
 */

interface ToolMeta {
  id: string;
  label: string;
  accept: string[];
}

export function buildDropzoneRoutes(tools: ToolMeta[]): {
  routes: Record<string, Array<{ id: string; label: string }>>;
  acceptAll: string[];
} {
  const routes: Record<string, Array<{ id: string; label: string }>> = {};
  const allExts = new Set<string>();
  for (const t of tools) {
    for (const ext of t.accept) {
      const key = ext.toLowerCase();
      allExts.add(key);
      (routes[key] ??= []).push({ id: t.id, label: t.label });
    }
  }
  return { routes, acceptAll: [...allExts].sort() };
}

/**
 * Build the format-pair graph from every "X-to-Y" tool ID. Powers the
 * interactive chip widget on the homepage: each input format gets a
 * sorted list of output formats it can be converted to, and we record
 * the tool ID for each (input, output) pair so the chip widget can
 * route directly to /<tool-id> on selection.
 *
 * Skips single-action tools (compress-pdf, remove-background,
 * discord-chat-summary-csv) — those don't fit the bidirectional picker
 * model and are reachable via the Categories grid + tool search instead.
 */
export interface FormatPair {
  format: string;
  toolId: string;
}

export interface FormatGraph {
  /** Sorted list of every input format (upper-case, e.g. "HEIC"). */
  inputFormats: string[];
  /** For each input format, the sorted list of output formats. */
  outputsByInput: Record<string, FormatPair[]>;
  /** Lookup table: `${input}|${output}` -> toolId. Used to route on
   *  swap / output-pick. */
  toolByPair: Record<string, string>;
}

export function buildFormatGraph(toolIds: string[]): FormatGraph {
  const outputsByInput: Record<string, FormatPair[]> = {};
  const toolByPair: Record<string, string> = {};
  const inputs = new Set<string>();

  for (const id of toolIds) {
    const parts = id.split("-to-");
    if (parts.length !== 2) continue;
    const [rawIn, rawOut] = parts;
    // Skip ugly compound names like "kindle-clippings-to-csv" for the
    // bidirectional picker — those need their own pages (visible in
    // categories) but would confuse a "HEIC/JPG/PNG" picker UI.
    if (rawIn.includes("-") || rawOut.includes("-")) continue;
    const input = rawIn.toUpperCase();
    const output = rawOut.toUpperCase();
    inputs.add(input);
    (outputsByInput[input] ??= []).push({ format: output, toolId: id });
    toolByPair[`${input}|${output}`] = id;
  }

  for (const k of Object.keys(outputsByInput)) {
    outputsByInput[k].sort((a, b) => a.format.localeCompare(b.format));
  }

  return {
    inputFormats: [...inputs].sort(),
    outputsByInput,
    toolByPair,
  };
}
