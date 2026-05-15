/**
 * Shared CSV-string → XLSX bytes. Lifted verbatim from the proven
 * csv-to-xlsx converter so every "X → XLSX" route (bibtex, ris, nbib,
 * gedcom) emits byte-identical spreadsheets through one tested path
 * instead of each re-implementing the SheetJS interop quirks.
 */

export async function csvStringToXlsx(csv: string): Promise<ArrayBuffer> {
  const XLSXModule = await import("xlsx");
  // CJS-interop quirk: depending on Node version the namespace either
  // exposes methods directly or wraps them in `default`. Handle both.
  const XLSX = XLSXModule.default ?? XLSXModule;
  const Papa = (await import("papaparse")).default;
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length === 0) {
    throw new Error("No rows to write");
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(parsed.data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const bytes: Uint8Array =
    out instanceof Uint8Array
      ? out
      : out instanceof ArrayBuffer
        ? new Uint8Array(out)
        : new Uint8Array(out as ArrayBufferLike);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
