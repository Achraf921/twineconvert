import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGedcom, type GedcomIndividual, type GedcomFamily } from "../util/gedcom-parse";

/**
 * GEDCOM → HTML family tree report. Self-contained single HTML file with
 * inlined CSS — opens cleanly in any browser. Layout is a section per
 * individual with parents/spouses/children rendered as anchor links to
 * other individuals on the page (so users can click around).
 *
 * For users who want a printed family tree, this output can then be
 * piped through a print-to-PDF in the browser. The dedicated `gedcom-to-pdf`
 * route just runs that step server-free for them.
 */
const gedcomToHtml: Converter = {
  id: "gedcom-to-html",
  label: "GEDCOM → HTML",
  fromMime: ["text/plain", "application/x-gedcom"],
  accept: [".ged", ".gedcom"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const text = await input.text();
      const data = parseGedcom(text);
      html = renderHtml(data.individuals, data.families);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse GEDCOM",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function renderIndividual(
  ind: GedcomIndividual,
  individualsById: Map<string, GedcomIndividual>,
  familiesById: Map<string, GedcomFamily>,
): string {
  const link = (id: string) => {
    const target = individualsById.get(id);
    return target
      ? `<a href="#i-${escapeHtml(id)}">${escapeHtml(target.name ?? id)}</a>`
      : escapeHtml(id);
  };

  const parentFamily = ind.familyAsChild ? familiesById.get(ind.familyAsChild) : undefined;
  const parents: string[] = [];
  if (parentFamily?.husbandId) parents.push(link(parentFamily.husbandId));
  if (parentFamily?.wifeId) parents.push(link(parentFamily.wifeId));

  const spouseLinks: string[] = [];
  const childrenLinks: string[] = [];
  for (const fid of ind.familyAsSpouse) {
    const fam = familiesById.get(fid);
    if (!fam) continue;
    const spouseId = fam.husbandId === ind.id ? fam.wifeId : fam.husbandId;
    if (spouseId) spouseLinks.push(link(spouseId));
    for (const cid of fam.childIds) childrenLinks.push(link(cid));
  }

  const parts: string[] = [];
  if (ind.birthDate || ind.birthPlace) parts.push(`<dt>Born</dt><dd>${escapeHtml([ind.birthDate, ind.birthPlace].filter(Boolean).join(" — "))}</dd>`);
  if (ind.deathDate || ind.deathPlace) parts.push(`<dt>Died</dt><dd>${escapeHtml([ind.deathDate, ind.deathPlace].filter(Boolean).join(" — "))}</dd>`);
  if (parents.length) parts.push(`<dt>Parents</dt><dd>${parents.join(", ")}</dd>`);
  if (spouseLinks.length) parts.push(`<dt>Spouse${spouseLinks.length > 1 ? "s" : ""}</dt><dd>${spouseLinks.join(", ")}</dd>`);
  if (childrenLinks.length) parts.push(`<dt>Children</dt><dd>${childrenLinks.join(", ")}</dd>`);

  return `<article id="i-${escapeHtml(ind.id)}">
    <h2>${escapeHtml(ind.name ?? ind.id)}</h2>
    <dl>${parts.join("")}</dl>
  </article>`;
}

function renderHtml(individuals: GedcomIndividual[], families: GedcomFamily[]): string {
  const indById = new Map(individuals.map((i) => [i.id, i]));
  const famById = new Map(families.map((f) => [f.id, f]));
  const sorted = [...individuals].sort((a, b) =>
    (a.surname ?? "").localeCompare(b.surname ?? "") || (a.givenName ?? "").localeCompare(b.givenName ?? ""),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Family Tree</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
  article { border-bottom: 1px solid #ddd; padding: 1rem 0; }
  h2 { margin-bottom: 0.25rem; }
  dl { display: grid; grid-template-columns: 100px 1fr; gap: 0.25rem 1rem; margin: 0; }
  dt { font-weight: 600; color: #555; }
  a { color: #0a58ca; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>Family Tree (${individuals.length} individuals, ${families.length} families)</h1>
${sorted.map((i) => renderIndividual(i, indById, famById)).join("\n")}
</body>
</html>`;
}

export default gedcomToHtml;
