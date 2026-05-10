import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSarif, type SarifFinding } from "../util/sarif";

/**
 * SARIF → HTML report. Self-contained printable report with severity
 * counts, a per-tool breakdown, and a sortable findings table. Targets
 * the "I need to send this scan result to a non-engineer stakeholder"
 * use case (security consultants delivering audit reports, dev leads
 * showing CI scans to product).
 */
const sarifToHtml: Converter = {
  id: "sarif-to-html",
  label: "SARIF → HTML report",
  fromMime: ["application/sarif+json", "application/json"],
  accept: [".sarif", ".json"],
  toMime: "text/html",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const findings = parseSarif(await input.text());
      html = renderHtml(findings);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse SARIF",
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

function levelBadge(level: string): string {
  const colorMap: Record<string, string> = {
    error: "#d73a49",
    warning: "#e3b341",
    note: "#1f6feb",
    none: "#8b949e",
  };
  const bg = colorMap[level] ?? "#8b949e";
  return `<span style="display:inline-block;background:${bg};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;text-transform:uppercase;">${escapeHtml(level)}</span>`;
}

function renderHtml(findings: SarifFinding[]): string {
  const counts = { error: 0, warning: 0, note: 0, other: 0 };
  for (const f of findings) {
    const k = (f.level === "error" || f.level === "warning" || f.level === "note") ? f.level : "other";
    counts[k]++;
  }
  const tools = Array.from(new Set(findings.map((f) => f.tool)));

  const rows = findings
    .map((f) => {
      const where = f.uri ? `${escapeHtml(f.uri)}${f.startLine ? `:${f.startLine}` : ""}` : "";
      const helpLink = f.helpUri ? `<a href="${escapeHtml(f.helpUri)}" target="_blank" rel="noopener">docs</a>` : "";
      return `<tr>
        <td>${levelBadge(f.level)}</td>
        <td><code style="font-size:0.85rem;">${escapeHtml(f.ruleId)}</code></td>
        <td>${escapeHtml(f.message)}</td>
        <td><code style="font-size:0.85rem;">${where}</code></td>
        <td>${helpLink}</td>
      </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SARIF Scan Report</title>
<style>
  body { font-family: -apple-system, system-ui, "Segoe UI", sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1rem; color: #24292f; }
  h1 { border-bottom: 1px solid #d0d7de; padding-bottom: 0.5rem; margin-bottom: 1rem; }
  .summary { display: flex; gap: 16px; margin: 1rem 0 2rem; }
  .stat { background: #f6f8fa; padding: 12px 16px; border-radius: 8px; border: 1px solid #d0d7de; }
  .stat .num { font-size: 1.6rem; font-weight: 700; }
  .stat .label { font-size: 0.85rem; color: #57606a; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eaeef2; vertical-align: top; }
  th { background: #f6f8fa; font-weight: 600; position: sticky; top: 0; }
  tr:hover { background: #f6f8fa; }
  code { background: #eaeef2; padding: 1px 4px; border-radius: 3px; }
  .meta { color: #57606a; font-size: 0.85rem; margin-bottom: 1rem; }
</style>
</head>
<body>
<h1>SARIF Scan Report</h1>
<div class="meta">${findings.length} finding${findings.length === 1 ? "" : "s"} from ${tools.length} tool${tools.length === 1 ? "" : "s"}: ${tools.map(escapeHtml).join(", ")}</div>
<div class="summary">
  <div class="stat"><div class="num" style="color:#d73a49;">${counts.error}</div><div class="label">Errors</div></div>
  <div class="stat"><div class="num" style="color:#e3b341;">${counts.warning}</div><div class="label">Warnings</div></div>
  <div class="stat"><div class="num" style="color:#1f6feb;">${counts.note}</div><div class="label">Notes</div></div>
  ${counts.other > 0 ? `<div class="stat"><div class="num" style="color:#8b949e;">${counts.other}</div><div class="label">Other</div></div>` : ""}
</div>
<table>
  <thead><tr><th>Level</th><th>Rule</th><th>Message</th><th>Location</th><th></th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;
}

export default sarifToHtml;
