import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGedcom } from "../util/gedcom-parse";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * GEDCOM → XLSX. Same flat one-row-per-individual shape as gedcom-to-csv,
 * just emitted as a real spreadsheet so genealogists can open it straight
 * in Excel without an import step.
 */
const gedcomToXlsx: Converter = {
  id: "gedcom-to-xlsx",
  label: "GEDCOM → XLSX",
  fromMime: ["text/plain", "application/x-gedcom"],
  accept: [".ged", ".gedcom"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const text = await input.text();
      const { individuals } = parseGedcom(text);
      if (individuals.length === 0) throw new Error("No individuals found in GEDCOM file");
      const Papa = (await import("papaparse")).default;
      const csv = Papa.unparse(
        individuals.map((i) => ({
          id: i.id,
          name: i.name ?? "",
          givenName: i.givenName ?? "",
          surname: i.surname ?? "",
          sex: i.sex ?? "",
          birthDate: i.birthDate ?? "",
          birthPlace: i.birthPlace ?? "",
          deathDate: i.deathDate ?? "",
          deathPlace: i.deathPlace ?? "",
          familyAsChild: i.familyAsChild ?? "",
          familyAsSpouse: i.familyAsSpouse.join(";"),
        })),
      );
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GEDCOM to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default gedcomToXlsx;
