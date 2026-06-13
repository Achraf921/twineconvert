import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGedcom } from "../util/gedcom-build";
import { stripCsvPreamble } from "../util/csv-parse-flex";
import type { GedcomIndividual } from "../util/gedcom-parse";

/**
 * CSV → GEDCOM. Reads a "flat" individuals CSV (the same shape this
 * engine's gedcom-to-csv emits, plus reasonable synonyms) and produces
 * a minimal GEDCOM 5.5.1 file.
 *
 * Family relationships are NOT inferred from CSVs that lack family-id
 * columns, for users who need full family round-trips, JSON is the
 * better intermediate format. Most "import my Excel of ancestors"
 * workflows just need INDI records, which is what this produces.
 */
const csvToGedcom: Converter = {
  id: "csv-to-gedcom",
  label: "CSV → GEDCOM",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "application/x-gedcom",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let gedcom: string;
    try {
      const Papa = (await import("papaparse")).default;
      const { text, delimiter } = stripCsvPreamble(await input.text());
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        ...(delimiter ? { delimiter } : {}),
      });

      const pick = (row: Record<string, string>, ...keys: string[]) => {
        for (const k of keys) {
          for (const actual of Object.keys(row)) {
            if (actual.toLowerCase().replace(/\s+/g, "") === k.toLowerCase().replace(/\s+/g, "")) {
              return row[actual];
            }
          }
        }
        return undefined;
      };

      const individuals: GedcomIndividual[] = parsed.data.map((row, idx) => ({
        id: pick(row, "id") ?? `I${idx + 1}`,
        name: pick(row, "name", "fullname"),
        givenName: pick(row, "givenName", "firstname", "given"),
        surname: pick(row, "surname", "lastname", "family"),
        sex: pick(row, "sex", "gender"),
        birthDate: pick(row, "birthDate", "birth", "dob"),
        birthPlace: pick(row, "birthPlace", "birthplace", "birthlocation"),
        deathDate: pick(row, "deathDate", "death", "dod"),
        deathPlace: pick(row, "deathPlace", "deathplace", "deathlocation"),
        familyAsSpouse: [],
        familyAsChild: undefined,
      }));

      gedcom = buildGedcom({ individuals, families: [] });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build GEDCOM from CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([gedcom], { type: "application/x-gedcom" }),
      filename: swapExtension(input.name, "ged"),
    };
  },
};

export default csvToGedcom;
