/**
 * Serialize a 2-D array of cell strings to RFC-4180 CSV. A field is
 * quoted only when it contains a comma, double-quote, CR, or LF, and
 * inner double-quotes are doubled. Rows are joined with CRLF, which
 * Excel and Google Sheets both parse correctly.
 */
export function rowsToCsv(rows: string[][]): string {
  const escapeField = (value: string): string => {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  return rows.map((row) => row.map((cell) => escapeField(cell ?? "")).join(",")).join("\r\n");
}
