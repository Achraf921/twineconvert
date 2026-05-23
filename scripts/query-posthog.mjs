/**
 * Query PostHog via its HogQL API using a Personal API Key.
 *
 * Bypasses the PostHog MCP server's OAuth scope quirks — uses a plain
 * Authorization: Bearer <personal-api-key> header. The key needs read
 * scopes on at least: query, event_definition, person, insight.
 *
 * Subcommands (designed around twineconvert's funnel events):
 *
 *   funnel [--hours N]
 *     Aggregate funnel counts across the last N hours (default 24).
 *     Reports file_selected → convert_clicked → convert_success vs
 *     convert_error → download_clicked totals.
 *
 *   errors [--hours N] [--limit N]
 *     convert_error events grouped by tool and error_class.
 *
 *   tools [--hours N] [--limit N]
 *     Tool-by-tool conversion success counts.
 *
 *   sql "<HogQL>"
 *     Run an arbitrary HogQL query and dump the result as JSON.
 *
 *   project
 *     Show which project this key is scoped to (sanity check).
 *
 * Auto-discovers the project ID on first run and caches it in
 * .posthog-project-id (gitignored via the .env* glob's sibling check —
 * if you want it explicitly ignored, add it to .gitignore).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const KEY = process.env.POSTHOG_API_KEY;
const HOST = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
if (!KEY) {
  console.error("Missing POSTHOG_API_KEY. Set it in .env.local and source the file.");
  process.exit(1);
}

const PROJECT_CACHE = resolve(".posthog-project-id");

async function api(path, init = {}) {
  const res = await fetch(`${HOST}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostHog API ${res.status} ${res.statusText} on ${path}: ${body}`);
  }
  return res.json();
}

async function getProjectId() {
  if (existsSync(PROJECT_CACHE)) {
    return readFileSync(PROJECT_CACHE, "utf8").trim();
  }
  const data = await api("/api/projects/");
  const projects = data.results ?? [];
  if (projects.length === 0) throw new Error("No projects visible to this key.");
  // twineconvert is the only project most likely; if more than one, prefer
  // anything matching "twine" in the name; otherwise take the first.
  const match =
    projects.find((p) => /twine|convert/i.test(p.name ?? "")) ?? projects[0];
  writeFileSync(PROJECT_CACHE, String(match.id));
  console.error(`# Cached project ID ${match.id} ("${match.name}") to ${PROJECT_CACHE}`);
  return String(match.id);
}

async function hogql(projectId, query) {
  return api(`/api/projects/${projectId}/query/`, {
    method: "POST",
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
}

function flag(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

function printRows(columns, rows) {
  if (rows.length === 0) {
    console.log("(no rows)");
    return;
  }
  const widths = columns.map((c, i) =>
    Math.max(c.length, ...rows.map((r) => String(r[i] ?? "").length)),
  );
  const fmt = (cells) =>
    cells.map((cell, i) => String(cell ?? "").padEnd(widths[i])).join("  ");
  console.log(fmt(columns));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) console.log(fmt(row));
}

const subcommand = process.argv[2];
const projectId = await getProjectId();

if (subcommand === "project") {
  const data = await api(`/api/projects/${projectId}/`);
  console.log(`Project ID:   ${data.id}`);
  console.log(`Project name: ${data.name}`);
  console.log(`Created:      ${data.created_at}`);
  console.log(`API host:     ${HOST}`);
} else if (subcommand === "funnel") {
  const hours = Number(flag("--hours", "24"));
  const data = await hogql(
    projectId,
    `
    SELECT
      countIf(event = 'file_selected')    AS file_selected,
      countIf(event = 'convert_clicked')  AS convert_clicked,
      countIf(event = 'convert_success')  AS convert_success,
      countIf(event = 'convert_error')    AS convert_error,
      countIf(event = 'download_clicked') AS download_clicked
    FROM events
    WHERE timestamp >= now() - INTERVAL ${hours} HOUR
    `,
  );
  const row = data.results?.[0] ?? [];
  console.log(`Funnel over last ${hours}h:`);
  console.log(`  file_selected     ${row[0] ?? 0}`);
  console.log(`  convert_clicked   ${row[1] ?? 0}`);
  console.log(`  convert_success   ${row[2] ?? 0}`);
  console.log(`  convert_error     ${row[3] ?? 0}`);
  console.log(`  download_clicked  ${row[4] ?? 0}`);
  if (row[1] > 0) {
    const successRate = ((row[2] / row[1]) * 100).toFixed(1);
    const errorRate = ((row[3] / row[1]) * 100).toFixed(1);
    console.log("");
    console.log(`  success rate      ${successRate}% of clicked`);
    console.log(`  error rate        ${errorRate}% of clicked`);
  }
} else if (subcommand === "errors") {
  const hours = Number(flag("--hours", "24"));
  const limit = Number(flag("--limit", "20"));
  // Group by the new rich fields (error_message + input_ext) on top of
  // tool/error_class so we can tell bug vs guardrail and which input
  // shape is failing, without ever seeing the file. error_message is
  // our own thrown text, not user data.
  const data = await hogql(
    projectId,
    `
    SELECT
      properties.tool          AS tool,
      properties.input_ext     AS ext,
      properties.error_class   AS error_class,
      properties.error_message AS error_message,
      count()                  AS errors,
      max(timestamp)           AS last_seen
    FROM events
    WHERE event = 'convert_error'
      AND timestamp >= now() - INTERVAL ${hours} HOUR
    GROUP BY tool, ext, error_class, error_message
    ORDER BY errors DESC
    LIMIT ${limit}
    `,
  );
  console.log(`convert_error events, last ${hours}h:`);
  printRows(
    ["tool", "ext", "error_class", "error_message", "errors", "last_seen"],
    data.results ?? [],
  );
} else if (subcommand === "tools") {
  const hours = Number(flag("--hours", "24"));
  const limit = Number(flag("--limit", "20"));
  const data = await hogql(
    projectId,
    `
    SELECT
      properties.tool                                                AS tool,
      countIf(event = 'convert_success')                             AS success,
      countIf(event = 'convert_error')                               AS error,
      countIf(event = 'download_clicked')                            AS downloads
    FROM events
    WHERE event IN ('convert_success','convert_error','download_clicked')
      AND timestamp >= now() - INTERVAL ${hours} HOUR
    GROUP BY tool
    ORDER BY (success + error) DESC
    LIMIT ${limit}
    `,
  );
  console.log(`Per-tool activity, last ${hours}h:`);
  printRows(["tool", "success", "error", "downloads"], data.results ?? []);
} else if (subcommand === "sql") {
  const query = process.argv[3];
  if (!query) {
    console.error('Usage: node scripts/query-posthog.mjs sql "<HogQL query>"');
    process.exit(1);
  }
  const data = await hogql(projectId, query);
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log("Usage:");
  console.log("  node scripts/query-posthog.mjs project");
  console.log("  node scripts/query-posthog.mjs funnel [--hours 24]");
  console.log("  node scripts/query-posthog.mjs errors [--hours 24] [--limit 20]");
  console.log("  node scripts/query-posthog.mjs tools  [--hours 24] [--limit 20]");
  console.log('  node scripts/query-posthog.mjs sql "<HogQL>"');
  process.exit(1);
}
