/**
 * SARIF (Static Analysis Results Interchange Format), JSON shape
 * specified by OASIS, output by every modern SAST tool (CodeQL, Semgrep,
 * Bandit, ESLint, Snyk, Checkmarx, Sonar). The structure is well-typed
 * but verbose; for our purposes we flatten the per-result fields users
 * actually need in a report or spreadsheet.
 *
 * A SARIF document looks (simplified) like:
 *
 *   {
 *     "version": "2.1.0",
 *     "runs": [{
 *       "tool": { "driver": { "name": "Semgrep", "version": "1.0.0", "rules": [...] } },
 *       "results": [{
 *         "ruleId": "javascript.lang.security.xss.X",
 *         "level": "error",
 *         "message": { "text": "..." },
 *         "locations": [{
 *           "physicalLocation": {
 *             "artifactLocation": { "uri": "src/foo.ts" },
 *             "region": { "startLine": 42, "startColumn": 5 }
 *           }
 *         }]
 *       }]
 *     }]
 *   }
 *
 * We accept the v2.1.0 spec shape and tolerate the older 2.0.0 shape.
 * Multi-run files are collapsed into a single flat list with a `tool`
 * column added per row.
 */

export interface SarifFinding {
  tool: string;
  toolVersion?: string;
  ruleId: string;
  ruleName?: string;
  ruleDescription?: string;
  level: "error" | "warning" | "note" | "none" | string;
  message: string;
  uri?: string;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  /** Snippet from the source if the SARIF document includes one. */
  snippet?: string;
  /** Help URI from the rule definition (where to read about the issue). */
  helpUri?: string;
}

export function parseSarif(text: string): SarifFinding[] {
  const doc = JSON.parse(text);
  const findings: SarifFinding[] = [];
  const runs = Array.isArray(doc?.runs) ? doc.runs : [];

  for (const run of runs) {
    const tool = run?.tool?.driver?.name ?? "unknown";
    const toolVersion = run?.tool?.driver?.version;
    const rules = Array.isArray(run?.tool?.driver?.rules) ? run.tool.driver.rules : [];
    // Build a ruleId → metadata lookup so we can enrich each result.
    const ruleMap = new Map<string, { name?: string; description?: string; helpUri?: string }>();
    for (const r of rules) {
      ruleMap.set(r.id, {
        name: r.name ?? r.shortDescription?.text,
        description: r.fullDescription?.text ?? r.shortDescription?.text,
        helpUri: r.helpUri,
      });
    }

    const results = Array.isArray(run?.results) ? run.results : [];
    for (const r of results) {
      const ruleId = r.ruleId ?? "(no rule id)";
      const meta = ruleMap.get(ruleId) ?? {};
      const loc = r.locations?.[0]?.physicalLocation;
      const region = loc?.region;
      findings.push({
        tool,
        toolVersion,
        ruleId,
        ruleName: meta.name,
        ruleDescription: meta.description,
        level: r.level ?? "warning",
        message: r.message?.text ?? r.message?.markdown ?? "",
        uri: loc?.artifactLocation?.uri,
        startLine: region?.startLine,
        startColumn: region?.startColumn,
        endLine: region?.endLine,
        endColumn: region?.endColumn,
        snippet: region?.snippet?.text,
        helpUri: meta.helpUri,
      });
    }
  }
  return findings;
}
