/**
 * Render a Citation list as a human-readable bibliography in Markdown
 * or HTML. The output is in a simplified APA-ish format that's close
 * enough for blog posts, READMEs, and document footnotes without
 * requiring a full CSL renderer (which would mean bundling citeproc.js,
 * a ~300KB library, just for two converters).
 *
 * Format examples:
 *
 *   Smith, J., & Doe, J. (2024). A paper about things.
 *     *Nature*, *123*, 45–67. https://doi.org/10.1038/sample.2024.001
 *
 *   Brown, A. (2023). *Book on a topic*. MIT Press.
 *
 *   Carter, M. (2022). Article in proceedings. In *Proceedings of X*
 *     (pp. 100–110). ACM.
 *
 * Users who need exact APA/MLA/Chicago compliance should run the output
 * through their reference-manager's formatter; this is for the 80%
 * case of "I just want a readable list of my sources."
 */

import type { Citation } from "./citation";

// ---- Shared formatting ---------------------------------------------------

function authorList(authors: string[] | undefined): string {
  if (!authors || authors.length === 0) return "";
  // Format each "Last, First" → "Last, F." (initial only)
  const formatted = authors.map((a) => {
    const [last, first] = a.split(",").map((s) => s.trim());
    if (!first) return last;
    // Take first letter of each given name to mimic APA initials
    const initials = first
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase() + ".")
      .join(" ");
    return `${last}, ${initials}`;
  });
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  // 3+ authors: last is preceded by "& "
  const last = formatted[formatted.length - 1];
  return `${formatted.slice(0, -1).join(", ")}, & ${last}`;
}

function yearOrNd(c: Citation): string {
  return c.year ? `(${c.year})` : "(n.d.)";
}

/** Build a doi.org URL if we have a bare DOI; pass-through full URLs. */
function doiUrl(doi: string): string {
  if (/^https?:\/\//i.test(doi)) return doi;
  return `https://doi.org/${doi}`;
}

// ---- Markdown rendering --------------------------------------------------

function mdEntry(c: Citation): string {
  const parts: string[] = [];
  const authors = authorList(c.authors);
  if (authors) parts.push(authors + ".");
  parts.push(yearOrNd(c) + ".");
  if (c.title) parts.push(c.type === "book" || c.type === "thesis" ? `*${c.title}*.` : `${c.title}.`);
  // Container (journal, book title, or proceedings) in italics
  if (c.journal) parts.push(`*${c.journal}*`);
  else if (c.booktitle) parts.push(`In *${c.booktitle}*`);
  // Volume + issue + pages
  const vipParts: string[] = [];
  if (c.volume) vipParts.push(`*${c.volume}*`);
  if (c.issue) vipParts.push(`(${c.issue})`);
  if (c.pages) vipParts.push(c.pages);
  if (vipParts.length > 0) parts.push(vipParts.join(", ") + ".");
  if (c.publisher) parts.push(`${c.publisher}.`);
  if (c.doi) parts.push(doiUrl(c.doi));
  else if (c.url) parts.push(c.url);
  return parts.join(" ");
}

/** Render a citation list as a numbered Markdown bibliography. */
export function buildMarkdownBibliography(
  citations: Citation[],
  opts?: { title?: string },
): string {
  if (citations.length === 0) {
    throw new Error("Bibliography has no entries to render");
  }
  const title = opts?.title ?? "References";
  const lines = [`# ${title}`, ""];
  citations.forEach((c, i) => {
    lines.push(`${i + 1}. ${mdEntry(c)}`);
  });
  return lines.join("\n") + "\n";
}

// ---- HTML rendering ------------------------------------------------------

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlEntry(c: Citation): string {
  const parts: string[] = [];
  const authors = authorList(c.authors);
  if (authors) parts.push(htmlEscape(authors) + ".");
  parts.push(yearOrNd(c) + ".");
  if (c.title) {
    parts.push(
      c.type === "book" || c.type === "thesis"
        ? `<em>${htmlEscape(c.title)}</em>.`
        : `${htmlEscape(c.title)}.`,
    );
  }
  if (c.journal) parts.push(`<em>${htmlEscape(c.journal)}</em>`);
  else if (c.booktitle) parts.push(`In <em>${htmlEscape(c.booktitle)}</em>`);
  const vipParts: string[] = [];
  if (c.volume) vipParts.push(`<em>${htmlEscape(c.volume)}</em>`);
  if (c.issue) vipParts.push(`(${htmlEscape(c.issue)})`);
  if (c.pages) vipParts.push(htmlEscape(c.pages));
  if (vipParts.length > 0) parts.push(vipParts.join(", ") + ".");
  if (c.publisher) parts.push(htmlEscape(c.publisher) + ".");
  if (c.doi) {
    const url = doiUrl(c.doi);
    parts.push(`<a href="${htmlEscape(url)}">${htmlEscape(url)}</a>`);
  } else if (c.url) {
    parts.push(`<a href="${htmlEscape(c.url)}">${htmlEscape(c.url)}</a>`);
  }
  return parts.join(" ");
}

export function buildHtmlBibliography(
  citations: Citation[],
  opts?: { title?: string },
): string {
  if (citations.length === 0) {
    throw new Error("Bibliography has no entries to render");
  }
  const title = opts?.title ?? "References";
  const items = citations.map((c) => `    <li>${htmlEntry(c)}</li>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${htmlEscape(title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 800px; margin: 2em auto; padding: 0 1em; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.25em; }
    ol { padding-left: 2em; }
    li { margin-bottom: 0.75em; }
    a { color: #0066cc; text-decoration: none; word-break: break-all; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${htmlEscape(title)}</h1>
  <ol>
${items}
  </ol>
</body>
</html>
`;
}
