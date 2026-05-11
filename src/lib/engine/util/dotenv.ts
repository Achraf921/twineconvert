/**
 * Minimal `.env` parser/serializer. Follows the Docker / dotenv conventions:
 *   - KEY=value lines
 *   - Lines starting with `#` are comments (skipped on parse, lost on round-trip)
 *   - Optional surrounding double or single quotes are stripped on parse and
 *     re-added on serialize when the value contains spaces or `#`
 *   - `export` prefix is tolerated on parse, dropped on serialize
 *   - Multi-line values via `\n` escape sequences are NOT supported (they'd
 *     require a real lexer; in practice .env files are flat key=value).
 */

export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const stripped = line.replace(/^export\s+/, "");
    const eq = stripped.indexOf("=");
    if (eq === -1) continue;
    const key = stripped.slice(0, eq).trim();
    let val = stripped.slice(eq + 1).trim();
    // Strip surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

export function buildEnv(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const str = value == null ? "" : String(value);
    // Quote when the value has spaces, # (would start a comment), = (ambiguous), or quotes
    const needsQuotes = /[\s#=]/.test(str) || str.includes('"') || str.includes("'");
    const escaped = str.includes('"') ? str.replace(/"/g, '\\"') : str;
    lines.push(needsQuotes ? `${key}="${escaped}"` : `${key}=${str}`);
  }
  return lines.join("\n") + "\n";
}
