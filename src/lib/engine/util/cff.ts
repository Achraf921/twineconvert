/**
 * Citation File Format (CFF) reader + writer. CFF is the YAML format GitHub
 * and Zenodo use for a repository's "Cite this software/dataset" widget
 * (the CITATION.cff file). Spec: https://citation-file-format.github.io/
 *
 * We map a single CFF document to/from one Citation. CFF authors are
 * {family-names, given-names} (or {name:} for organisations); we store them
 * as "Family, Given" strings, matching the rest of the citation family. The
 * release date (date-released or a 4-digit year) becomes the year, and the
 * software/dataset version is preserved via the Citation.extra slot so a
 * round-trip keeps it.
 */

import type { Citation } from "./citation";
import { generateCitationKey } from "./citation";

interface CffAuthor {
  "family-names"?: string;
  "given-names"?: string;
  name?: string; // organisations / entities
}

interface CffDoc {
  "cff-version"?: string;
  message?: string;
  title?: string;
  authors?: CffAuthor[];
  version?: string;
  "date-released"?: string;
  year?: string | number;
  doi?: string;
  url?: string;
  repository?: string;
  "repository-code"?: string;
  abstract?: string;
  keywords?: string[];
  license?: string;
  type?: string; // software | dataset
  [k: string]: unknown;
}

function authorToString(a: CffAuthor): string | null {
  if (a.name && a.name.trim()) return a.name.trim();
  const family = (a["family-names"] ?? "").trim();
  const given = (a["given-names"] ?? "").trim();
  if (!family && !given) return null;
  if (family && given) return `${family}, ${given}`;
  return family || given;
}

/** "Family, Given" / "Given Family" / "Org" -> CFF author object. */
function stringToAuthor(s: string): CffAuthor {
  const t = s.trim();
  if (!t) return { name: "" };
  if (t.includes(",")) {
    const [family, ...rest] = t.split(",");
    const given = rest.join(",").trim();
    return given ? { "family-names": family.trim(), "given-names": given } : { "family-names": family.trim() };
  }
  // No comma: a single token is treated as an organisation; otherwise split
  // the last whitespace-separated token as the family name.
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { name: t };
  return { "family-names": parts[parts.length - 1], "given-names": parts.slice(0, -1).join(" ") };
}

export async function parseCff(text: string): Promise<Citation[]> {
  const yaml = (await import("js-yaml")).default;
  let doc: CffDoc;
  try {
    doc = (yaml.load(text) ?? {}) as CffDoc;
  } catch (e) {
    throw new Error(`CITATION.cff is not valid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error("CITATION.cff must be a YAML mapping with at least a title.");
  }
  if (!doc.title && !doc.authors) {
    throw new Error("This does not look like a CITATION.cff file (no title or authors found).");
  }

  let year: string | undefined;
  if (doc["date-released"]) {
    const m = String(doc["date-released"]).match(/(\d{4})/);
    if (m) year = m[1];
  }
  if (!year && doc.year != null) {
    const m = String(doc.year).match(/(\d{4})/);
    if (m) year = m[1];
  }

  const authors = Array.isArray(doc.authors)
    ? doc.authors.map(authorToString).filter((a): a is string => !!a)
    : undefined;

  const extra: Record<string, string> = {};
  if (doc.version != null) extra.version = String(doc.version);
  if (doc.license) extra.license = String(doc.license);
  const repo = doc.repository ?? doc["repository-code"];

  const citation: Citation = {
    id: doc.title ? "" : "cff",
    type: doc.type === "dataset" ? "misc" : "misc",
    title: doc.title,
    authors: authors && authors.length ? authors : undefined,
    year,
    doi: doc.doi ? String(doc.doi) : undefined,
    url: doc.url ? String(doc.url) : repo ? String(repo) : undefined,
    abstract: doc.abstract ? String(doc.abstract) : undefined,
    keywords: Array.isArray(doc.keywords) ? doc.keywords.map(String) : undefined,
  };
  citation.id = doc.title ? generateCitationKey(citation) : "cff";
  if (Object.keys(extra).length) citation.extra = extra;
  return [citation];
}

/**
 * Validate a CITATION.cff document against the fields the spec requires
 * (cff-version, message, title, authors with at least one entry). Returns a
 * plain-text report listing what is present and what is missing, the same
 * check GitHub runs before it shows the "Cite this repository" widget. The
 * input is not modified.
 */
export async function validateCff(text: string): Promise<string> {
  const yaml = (await import("js-yaml")).default;
  let doc: CffDoc;
  try {
    doc = (yaml.load(text) ?? {}) as CffDoc;
  } catch (e) {
    return `Invalid: CITATION.cff is not valid YAML (${e instanceof Error ? e.message : String(e)}).\n`;
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return "Invalid: CITATION.cff must be a YAML mapping (key: value pairs).\n";
  }

  const missing: string[] = [];
  if (!doc["cff-version"]) missing.push("cff-version");
  if (!doc.message) missing.push("message");
  if (!doc.title) missing.push("title");
  const hasAuthor =
    Array.isArray(doc.authors) &&
    doc.authors.some((a) => a && (a.name || a["family-names"] || a["given-names"]));
  if (!hasAuthor) missing.push("authors (at least one)");

  const lines: string[] = [];
  if (missing.length === 0) {
    lines.push("Valid: this CITATION.cff has all required fields.");
  } else {
    lines.push(`Invalid: missing ${missing.length} required field${missing.length === 1 ? "" : "s"}.`);
  }
  lines.push("");
  lines.push(`cff-version: ${doc["cff-version"] ? `present (${doc["cff-version"]})` : "MISSING"}`);
  lines.push(`message: ${doc.message ? "present" : "MISSING"}`);
  lines.push(`title: ${doc.title ? `present (${doc.title})` : "MISSING"}`);
  lines.push(
    `authors: ${hasAuthor ? `present (${(doc.authors as CffAuthor[]).length})` : "MISSING"}`,
  );
  // Recommended-but-optional fields, surfaced as hints.
  const optional: string[] = [];
  if (!doc.version) optional.push("version");
  if (!doc["date-released"]) optional.push("date-released");
  if (!doc.doi) optional.push("doi");
  if (optional.length) {
    lines.push("");
    lines.push(`Optional fields not set: ${optional.join(", ")}.`);
  }
  return lines.join("\n") + "\n";
}

/** Build a CITATION.cff document from the first citation (CFF describes one
 *  primary work). */
export async function buildCff(citations: Citation[]): Promise<string> {
  const yaml = (await import("js-yaml")).default;
  const c = citations[0];
  if (!c) throw new Error("No citation to write to CITATION.cff.");

  const doc: CffDoc = {
    "cff-version": "1.2.0",
    message: "If you use this work, please cite it using these metadata.",
    type: "software",
  };
  if (c.title) doc.title = c.title;
  if (c.authors && c.authors.length) doc.authors = c.authors.map(stringToAuthor);
  if (c.extra?.version) doc.version = c.extra.version;
  if (c.year) doc["date-released"] = c.year;
  if (c.doi) doc.doi = c.doi;
  if (c.url) doc.url = c.url;
  if (c.abstract) doc.abstract = c.abstract;
  if (c.keywords && c.keywords.length) doc.keywords = c.keywords;
  if (c.extra?.license) doc.license = c.extra.license;

  return yaml.dump(doc, { lineWidth: -1, noRefs: true });
}
