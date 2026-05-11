import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAdif } from "../util/adif";

/**
 * ADIF → Cabrillo. Cabrillo is the contest-log submission format used
 * by ARRL, CQ WW, RDXC, etc. Each QSO is a single fixed-format text
 * line starting with `QSO:`.
 *
 * Cabrillo requires header lines the operator is supposed to fill in
 * (CALLSIGN, CONTEST, CATEGORY-*). We emit placeholders that the user
 * MUST edit before submission, there's no way to derive these from
 * the QSO records alone.
 */
const adifToCabrillo: Converter = {
  id: "adif-to-cabrillo",
  label: "ADIF → Cabrillo",
  fromMime: ["text/plain", "application/x-adif"],
  accept: [".adi", ".adif"],
  toMime: "text/plain",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let cabrillo: string;
    try {
      const text = await input.text();
      const { qsos } = parseAdif(text);
      cabrillo = buildCabrillo(qsos);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ADIF to Cabrillo",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([cabrillo], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "log"),
    };
  },
};

function bandToFreq(band: string): string {
  // Cabrillo uses kHz as the frequency identifier.
  const m = band?.toLowerCase().match(/^(\d+)\s*m$/);
  if (!m) return "0";
  const meters = parseInt(m[1], 10);
  // Reverse rough mapping: 80m → 3500, 40m → 7000, 20m → 14000, etc.
  // For accuracy we use the ADIF FREQ when available; this fallback handles
  // the BAND-only case.
  const map: Record<number, string> = {
    160: "1800", 80: "3500", 60: "5330", 40: "7000", 30: "10100",
    20: "14000", 17: "18068", 15: "21000", 12: "24890", 10: "28000",
    6: "50000", 2: "144000",
  };
  return map[meters] ?? "0";
}

function buildCabrillo(qsos: import("../util/adif").AdifQso[]): string {
  const lines: string[] = [
    "START-OF-LOG: 3.0",
    "CALLSIGN: REPLACE-ME",
    "CONTEST: REPLACE-ME",
    "CATEGORY-OPERATOR: SINGLE-OP",
    "CATEGORY-ASSISTED: NON-ASSISTED",
    "CATEGORY-BAND: ALL",
    "CATEGORY-MODE: MIXED",
    "CATEGORY-POWER: HIGH",
    "CLAIMED-SCORE: 0",
    "CREATED-BY: client-conversion",
  ];
  for (const qso of qsos) {
    const f = qso.fields;
    const freqKHz = f.FREQ ? Math.round(parseFloat(f.FREQ) * 1000).toString() : bandToFreq(f.BAND ?? "");
    const mode = (f.MODE === "USB" || f.MODE === "LSB") ? "PH" : f.MODE === "FT8" || f.MODE === "FT4" || f.MODE === "RTTY" ? "DG" : f.MODE === "CW" ? "CW" : "PH";
    const date = (f.QSO_DATE ?? "").replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
    const time = (f.TIME_ON ?? "").slice(0, 4);
    const myCall = (f.STATION_CALLSIGN ?? f.OPERATOR ?? "REPLACE-ME").padEnd(13);
    const sentRst = (f.RST_SENT ?? "59").padEnd(3);
    // Cabrillo spec requires every QSO line to have non-empty exchange
    // fields. ADIF logs that don't carry an exchange (general logging
    // vs contest logging) get "0" as a placeholder so the line stays
    // a valid 10-token QSO row, which is what cabrillo-to-adif's
    // whitespace-split parser needs to round-trip cleanly.
    const sentExch = (f.STX || f.MY_STATE || "0").padEnd(6);
    const theirCall = (f.CALL ?? "").padEnd(13);
    const rcvdRst = (f.RST_RCVD ?? "59").padEnd(3);
    const rcvdExch = (f.SRX || f.STATE || "0").padEnd(6);
    lines.push(
      `QSO: ${freqKHz.padStart(5)} ${mode} ${date} ${time} ${myCall} ${sentRst} ${sentExch} ${theirCall} ${rcvdRst} ${rcvdExch}`,
    );
  }
  lines.push("END-OF-LOG:");
  return lines.join("\n") + "\n";
}

export default adifToCabrillo;
