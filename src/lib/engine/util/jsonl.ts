/**
 * JSON Lines (JSONL / NDJSON) helpers.
 *
 * JSONL = one JSON value per line, no enclosing array brackets. It's the
 * dominant format for streaming data pipelines (BigQuery, ClickHouse,
 * fluentd, LangChain training data, OpenAI fine-tuning) because each line
 * can be parsed independently — you don't have to buffer the whole file
 * to start processing.
 *
 * Tolerant of:
 *   - trailing newline (with or without one)
 *   - blank lines (skipped)
 *   - mixed CRLF/LF line endings
 * Strict about:
 *   - each non-blank line must be a complete, parseable JSON value
 */

export function parseJsonl(text: string): unknown[] {
  const lines = text.split(/\r?\n/);
  const out: unknown[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
    } catch (e) {
      throw new Error(
        `JSONL line ${i + 1} failed to parse: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return out;
}

/** Build a JSONL document. Each value is serialized on its own line with no
 *  pretty-printing (the line break IS the structure). Always trailing-LF. */
export function buildJsonl(values: unknown[]): string {
  return values.map((v) => JSON.stringify(v)).join("\n") + "\n";
}
