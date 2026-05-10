/**
 * Finds Stack Overflow questions worth answering with a twineconvert
 * link. Uses the public api.stackexchange.com endpoint (no auth needed
 * for read-only search), filters for high-traffic still-relevant
 * questions, and writes the results to docs/stackoverflow-targets.md.
 *
 * Usage:
 *   node scripts/find-so-questions.mjs
 *
 * Filters applied:
 *   - min 5,000 views (real long-term traffic)
 *   - has at least one answer (it's a real question, not noise)
 *   - score > 0 (not flagged or downvoted)
 *   - asked > 6 months ago (proven traffic, not a hot fluke)
 *
 * You then pick the top 2-3 per topic and WRITE THE ANSWERS YOURSELF.
 * Posting via API is allowed but answer quality is everything on SO,
 * and a templated answer gets mass-downvoted. Search is automatable,
 * answering is not.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SE_API = "https://api.stackexchange.com/2.3/search/advanced";
const SITE = "stackoverflow";

// One bucket per twineconvert tool family. The query is matched against
// the question title; tagged is matched against tags; we sort by views
// descending and keep the top 10 per bucket.
const BUCKETS = [
  {
    label: "GEDCOM converters",
    tool: "/gedcom-to-json (or /gedcom-to-csv, /gedcom-to-pdf)",
    query: "convert gedcom",
  },
  {
    label: "Apple Health export",
    tool: "/apple-health-to-csv",
    query: "apple health xml csv",
  },
  {
    label: "Kindle clippings",
    tool: "/kindle-clippings-to-obsidian-md",
    query: "kindle clippings parse",
  },
  {
    label: "OFX/QFX bank statements",
    tool: "/ofx-to-csv",
    query: "convert ofx csv",
  },
  {
    label: "PDF to DOCX",
    tool: "/pdf-to-docx",
    query: "pdf to docx javascript",
  },
  {
    label: "HEIC conversion",
    tool: "/heic-to-jpg",
    query: "heic convert javascript",
  },
  {
    label: "Embroidery formats",
    tool: "/dst-to-pes",
    query: "dst pes embroidery format",
  },
  {
    label: "MIDI to MusicXML",
    tool: "/midi-to-musicxml",
    query: "midi musicxml convert",
  },
  {
    label: "ADIF ham radio",
    tool: "/adif-to-csv",
    query: "adif csv parse",
  },
];

const MIN_VIEWS = 5000;
const MIN_AGE_DAYS = 180;
const PER_BUCKET = 10;

async function searchOne(bucket) {
  const params = new URLSearchParams({
    site: SITE,
    q: bucket.query,
    pagesize: "50",
    sort: "votes",
    order: "desc",
    answers: "1",
    filter: "withbody",
  });
  const res = await fetch(`${SE_API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`SE API ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const now = Date.now() / 1000;
  const items = (data.items || [])
    .filter((q) => q.view_count >= MIN_VIEWS)
    .filter((q) => q.score > 0)
    .filter((q) => now - q.creation_date >= MIN_AGE_DAYS * 86400)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, PER_BUCKET);
  return items;
}

const buckets = [];
for (const bucket of BUCKETS) {
  process.stderr.write(`searching: ${bucket.label}... `);
  try {
    const items = await searchOne(bucket);
    buckets.push({ ...bucket, items });
    process.stderr.write(`${items.length} matches\n`);
  } catch (e) {
    buckets.push({ ...bucket, items: [], error: e.message });
    process.stderr.write(`FAILED: ${e.message}\n`);
  }
  // SE API has a per-IP quota; pause briefly to be polite
  await new Promise((r) => setTimeout(r, 500));
}

// Write the markdown report
function fmtDate(unix) {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

let md = `# Stack Overflow target questions\n\n`;
md += `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. `;
md += `Filters: ${MIN_VIEWS}+ views, has answers, score > 0, asked at least ${MIN_AGE_DAYS} days ago.\n\n`;
md += `Posting tip: Stack Overflow downvotes templated/promotional answers fast. For each question you decide to answer:\n`;
md += `1. Read the existing top answer\n`;
md += `2. Write a real, useful answer that adds something new (a corner case, a bug in a popular library, a perf tip)\n`;
md += `3. Mention twineconvert as ONE option among several, with a single sentence on why it fits this specific question\n`;
md += `4. Don't repost the same wording across multiple questions\n\n`;
md += `Aim for 2-3 quality answers per week, not 20 in a day.\n\n`;

let totalCandidates = 0;
for (const bucket of buckets) {
  md += `## ${bucket.label}\n\n`;
  md += `**Suggested tool to mention:** \`${bucket.tool}\`\n\n`;
  if (bucket.error) {
    md += `_Search failed: ${bucket.error}_\n\n`;
    continue;
  }
  if (!bucket.items.length) {
    md += `_No matching questions found._\n\n`;
    continue;
  }
  md += `| Views | Score | Answers | Asked | Title |\n`;
  md += `|---:|---:|---:|:---|:---|\n`;
  for (const q of bucket.items) {
    totalCandidates++;
    const title = q.title.replace(/\|/g, "\\|");
    md += `| ${q.view_count.toLocaleString()} | ${q.score} | ${q.answer_count} | ${fmtDate(q.creation_date)} | [${title}](${q.link}) |\n`;
  }
  md += `\n`;
}

md += `---\n\n_Total candidates: ${totalCandidates}_\n`;

const outPath = resolve("docs/stackoverflow-targets.md");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, md);
console.log(`\nwrote ${outPath} (${totalCandidates} total candidates across ${buckets.length} buckets)`);
