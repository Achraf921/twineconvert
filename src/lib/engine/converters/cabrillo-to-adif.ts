import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAdif, type AdifQso } from "../util/adif";

/**
 * Cabrillo → ADIF. Reverses the contest-log format back into the
 * universal logger format. Cabrillo QSO lines have a fixed-position
 * structure but freq + date + time + callsigns + exchanges sit at
 * predictable column ranges defined by the Cabrillo 3.0 spec.
 */
const cabrilloToAdif: Converter = {
  id: "cabrillo-to-adif",
  label: "Cabrillo → ADIF",
  fromMime: ["text/plain"],
  accept: [".log", ".cbr", ".cabrillo"],
  toMime: "application/x-adif",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let adif: string;
    try {
      const text = await input.text();
      const qsos: AdifQso[] = [];
      for (const line of text.split(/\r?\n/)) {
        if (!line.startsWith("QSO:")) continue;
        // Cabrillo QSO line, whitespace-delimited fields after "QSO:"
        const parts = line.slice(4).trim().split(/\s+/);
        // Spec defines 10 fields (freq mo date time mycall mysent myexch
        // hiscall hissent hisexch), but some loggers omit the trailing
        // received exchange when it's empty. Allow 8+ so we don't drop
        // valid lines just because the exchange is missing.
        if (parts.length < 8) continue;
        const [freqKHz, mode, date, time, myCall, sentRst, sentExch, theirCall, rcvdRst, ...rest] = parts;
        const fields: Record<string, string> = {
          FREQ: (parseInt(freqKHz, 10) / 1000).toFixed(6),
          BAND: kHzToBand(parseInt(freqKHz, 10)),
          MODE: cabrilloModeToAdif(mode),
          QSO_DATE: date.replace(/-/g, ""),
          TIME_ON: time + "00",
          STATION_CALLSIGN: myCall,
          RST_SENT: sentRst,
          STX: sentExch,
          CALL: theirCall,
          RST_RCVD: rcvdRst,
        };
        if (rest.length > 0) fields.SRX = rest[0];
        qsos.push({ fields });
      }
      adif = buildAdif({ header: {}, qsos });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Cabrillo to ADIF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([adif], { type: "application/x-adif" }),
      filename: swapExtension(input.name, "adi"),
    };
  },
};

function kHzToBand(khz: number): string {
  if (khz >= 1800 && khz < 2000) return "160m";
  if (khz >= 3500 && khz < 4000) return "80m";
  if (khz >= 5300 && khz < 5500) return "60m";
  if (khz >= 7000 && khz < 7300) return "40m";
  if (khz >= 10100 && khz < 10150) return "30m";
  if (khz >= 14000 && khz < 14350) return "20m";
  if (khz >= 18068 && khz < 18168) return "17m";
  if (khz >= 21000 && khz < 21450) return "15m";
  if (khz >= 24890 && khz < 24990) return "12m";
  if (khz >= 28000 && khz < 29700) return "10m";
  if (khz >= 50000 && khz < 54000) return "6m";
  if (khz >= 144000 && khz < 148000) return "2m";
  return "";
}

function cabrilloModeToAdif(mode: string): string {
  // Cabrillo uses category modes (PH/CW/DG); ADIF wants specific modes.
  if (mode === "PH") return "SSB";
  if (mode === "CW") return "CW";
  if (mode === "DG") return "FT8";
  return mode;
}

export default cabrilloToAdif;
