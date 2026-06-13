/**
 * Parse a user-uploaded JSON file. Strips a leading UTF-8 BOM before
 * parsing: Windows editors and PowerShell `Out-File` / `Set-Content`
 * emit a BOM, and JSON.parse rejects it with the cryptic "Unexpected
 * token '﻿'", so a perfectly valid JSON export silently fails. The
 * native SyntaxError is re-thrown unchanged for genuinely malformed
 * input, so each converter's existing try/catch keeps its own message.
 */
export function parseJsonInput<T = unknown>(text: string): T {
  return JSON.parse(text.replace(/^﻿/, "")) as T;
}
