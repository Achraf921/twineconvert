/**
 * Java `.properties` file parser/serializer. Used by Java/Kotlin/Spring/
 * Gradle config (application.properties, gradle.properties, log4j.properties).
 *
 * Differences from .env:
 *   - `.` and dashes allowed in keys (`server.port`, `log4j.appender.foo`)
 *   - `:` accepted as separator alongside `=`
 *   - Backslash escapes for newlines, tabs, unicode (`é`)
 *   - Comments start with `#` OR `!`
 *   - Trailing `\` continues a line
 *
 * We support the common cases: `=` / `:` separators, `#`/`!` comments,
 * basic backslash escapes. Multiline `\` continuation NOT supported (rare
 * in modern config; users with multiline values can pre-process).
 */

export function parseProperties(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s+/, "");
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    // Find the first unescaped `=` or `:`
    let sep = -1;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === "\\") {
        i++;
        continue;
      }
      if (line[i] === "=" || line[i] === ":") {
        sep = i;
        break;
      }
    }
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let val = line.slice(sep + 1).trimStart();
    // Decode `\n`, `\t`, `\\`, `\=`, `\:`, `\u00XX`
    val = val.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    val = val.replace(/\\([nrt\\=:])/g, (_, ch) => {
      if (ch === "n") return "\n";
      if (ch === "r") return "\r";
      if (ch === "t") return "\t";
      return ch;
    });
    if (key) out[key] = val;
  }
  return out;
}

export function buildProperties(obj: Record<string, unknown>): string {
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/=/g, "\\=")
      .replace(/:/g, "\\:");
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const str = v == null ? "" : String(v);
    lines.push(`${k}=${escape(str)}`);
  }
  return lines.join("\n") + "\n";
}
