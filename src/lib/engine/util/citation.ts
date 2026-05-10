/**
 * Unified citation shape used as the bridge between BibTeX, RIS, NBIB,
 * and EndNote XML. Each parser converts INTO this; each writer converts
 * FROM this. That gives us NxM format pairs from N+M parsers/writers.
 *
 * Field choices follow the BibTeX/CSL union — these are the fields that
 * actually round-trip cleanly across all four formats. Source-specific
 * fields (RIS-only "AB" abstract, EndNote-only "rec-number", BibTeX
 * cross-references) are preserved in `extra` so users who care can
 * recover them; everything else maps to a structured field.
 */

export interface Citation {
  /** Citation key — required for BibTeX, optional for the others. */
  id: string;
  /** Mapped to BibTeX entry type / RIS TY field. Default "article". */
  type: CitationType;
  title?: string;
  /** Authors as raw "Last, First" strings (BibTeX/RIS convention). */
  authors?: string[];
  /** Editors (when distinct from authors). */
  editors?: string[];
  year?: string;
  month?: string;
  day?: string;
  journal?: string;
  booktitle?: string; // for chapters / proceedings
  publisher?: string;
  address?: string; // place of publication
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  issn?: string;
  abstract?: string;
  keywords?: string[];
  /** Free-form extras that didn't map to a structured field — preserved for round-trip. */
  extra?: Record<string, string>;
}

export type CitationType =
  | "article"
  | "book"
  | "inbook"
  | "incollection"
  | "inproceedings"
  | "thesis"
  | "report"
  | "manual"
  | "misc"
  | "online"
  | "patent"
  | "audiovisual";

/** Build a stable citation key from authors + year + title when one isn't given. */
export function generateCitationKey(c: Partial<Citation>): string {
  const lastName = c.authors?.[0]?.split(",")[0]?.trim().replace(/\s+/g, "") ?? "anon";
  const year = c.year ?? "n.d.";
  const titleWord = c.title?.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() ?? "";
  return `${lastName.toLowerCase()}${year}${titleWord ? `_${titleWord}` : ""}`;
}
