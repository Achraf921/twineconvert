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
