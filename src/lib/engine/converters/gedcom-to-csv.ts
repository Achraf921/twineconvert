import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGedcom } from "../util/gedcom-parse";

/**
 * GEDCOM → CSV. Flat individuals export, one row per person with all
 * the fields a typical "spreadsheet of my family tree" use case needs.
 * Family relationships are captured by FamilyAsSpouse + FamilyAsChild
 * id columns so users can join back if they care.
 */
const gedcomToCsv: Converter = {
  id: "gedcom-to-csv",
  label: "GEDCOM → CSV",
  fromMime: ["text/plain", "application/x-gedcom"],
  accept: [".ged", ".gedcom"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const { individuals } = parseGedcom(text);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
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
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse GEDCOM",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default gedcomToCsv;
