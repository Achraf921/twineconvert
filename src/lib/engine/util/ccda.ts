/**
 * C-CDA (Consolidated Clinical Document Architecture) helpers. C-CDA is
 * the HL7 XML format every U.S. EHR exports for "transition of care"
 * documents — discharge summary, continuity of care document (CCD),
 * referral note, etc. Required for Meaningful Use / Promoting
 * Interoperability incentive programs.
 *
 * Structure (very roughly):
 *   <ClinicalDocument xmlns="urn:hl7-org:v3">
 *     <recordTarget>
 *       <patientRole>
 *         <patient>
 *           <name><given>...</given><family>...</family></name>
 *           <birthTime value="19800101"/>
 *         </patient>
 *       </patientRole>
 *     </recordTarget>
 *     <author>...</author>
 *     <component>
 *       <structuredBody>
 *         <component>
 *           <section>
 *             <title>Allergies</title>
 *             <text>...</text>
 *             <entry>...</entry>
 *           </section>
 *         </component>
 *       </structuredBody>
 *     </component>
 *   </ClinicalDocument>
 *
 * The full data model is enormous (HL7 publishes hundreds of templates).
 * We extract the structurally-stable patient demographics + section
 * titles/text — enough to triage and view the document, not enough to
 * import structured data into a clinical decision support system.
 */

import { XMLParser } from "fast-xml-parser";

export interface CcdaPatient {
  givenName?: string;
  familyName?: string;
  middleName?: string;
  birthTime?: string;
  gender?: string;
  mrn?: string;
}

export interface CcdaSection {
  title: string;
  text: string;
}

export interface CcdaDocument {
  documentTitle?: string;
  documentDate?: string;
  patient: CcdaPatient;
  sections: CcdaSection[];
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
});

/** Walk an arbitrary node and concatenate all string content (XML text
 *  content extraction). C-CDA section text is usually wrapped in <text>
 *  with nested <paragraph> + <list> + <table> markup; we flatten to a
 *  single string for the readable view. */
function extractText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (typeof node === "object") {
    return Object.entries(node as Record<string, unknown>)
      .filter(([k]) => !k.startsWith("@_"))
      .map(([, v]) => extractText(v))
      .join(" ");
  }
  return "";
}

/** Coerce a possibly-array node into an array. fast-xml-parser returns
 *  a single object for one child and an array for many; we want uniform
 *  array handling. */
function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** First non-empty string from a list of candidates. Used because
 *  C-CDA fields can be expressed as either text content or a `value`
 *  attribute depending on the source EHR. */
function firstString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (typeof c === "number") return String(c);
  }
  return undefined;
}

export function parseCcda(xml: string): CcdaDocument {
  const root = xmlParser.parse(xml);
  const doc = root?.ClinicalDocument;
  if (!doc) {
    throw new Error("Not a C-CDA document (missing <ClinicalDocument> root)");
  }

  const documentTitle = firstString(doc.title);
  const documentDate = firstString(doc.effectiveTime?.["@_value"]);

  // Patient: recordTarget → patientRole → patient
  const pr = doc.recordTarget?.patientRole;
  const p = pr?.patient;
  const nameNode = asArray<Record<string, unknown>>(p?.name)[0];
  const ids = asArray<Record<string, unknown>>(pr?.id);

  const patient: CcdaPatient = {
    givenName: firstString(asArray(nameNode?.given)[0]),
    familyName: firstString(nameNode?.family),
    middleName: firstString(asArray(nameNode?.given)[1]),
    birthTime: firstString(p?.birthTime?.["@_value"]),
    gender: firstString(p?.administrativeGenderCode?.["@_code"]),
    mrn: firstString(ids[0]?.["@_extension"]),
  };

  // Sections: component → structuredBody → component[] → section
  const componentBody = doc.component?.structuredBody;
  const componentList = asArray<Record<string, unknown>>(componentBody?.component);
  const sections: CcdaSection[] = componentList
    .map((c) => {
      const sec = c.section as Record<string, unknown> | undefined;
      if (!sec) return null;
      return {
        title: firstString(sec.title) ?? "(untitled section)",
        text: extractText(sec.text).replace(/\s+/g, " ").trim(),
      };
    })
    .filter((s): s is CcdaSection => s !== null);

  return { documentTitle, documentDate, patient, sections };
}

/** Render a C-CDA as a clean, readable HTML document. Strips the medical
 *  XML noise; keeps the patient header + section titles + section text
 *  in a layout that prints well and indexes cleanly for full-text search. */
export function ccdaToHtml(doc: CcdaDocument): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const fmtDate = (ts?: string): string => {
    if (!ts) return "";
    // C-CDA timestamps: YYYYMMDD or YYYYMMDDHHMMSS+ZZZZ
    const m = ts.match(/^(\d{4})(\d{2})(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : ts;
  };
  const p = doc.patient;
  const name = [p.givenName, p.middleName, p.familyName].filter(Boolean).join(" ");
  const sectionsHtml = doc.sections
    .map(
      (s) =>
        `    <section>\n      <h2>${escape(s.title)}</h2>\n      <p>${escape(s.text || "(no content)")}</p>\n    </section>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escape(doc.documentTitle ?? "Clinical Document")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 2em auto; padding: 0 1em; line-height: 1.5; color: #1a1a1a; }
    header { border-bottom: 2px solid #ccc; padding-bottom: 1em; margin-bottom: 2em; }
    h1 { margin: 0 0 0.5em; font-size: 1.5em; }
    dl { display: grid; grid-template-columns: max-content auto; gap: 0.25em 1em; margin: 0; }
    dt { font-weight: 600; color: #555; }
    section h2 { font-size: 1.1em; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.25em; margin-top: 1.5em; }
  </style>
</head>
<body>
  <header>
    <h1>${escape(doc.documentTitle ?? "Clinical Document")}</h1>
    <dl>
      <dt>Patient</dt><dd>${escape(name || "(unknown)")}</dd>
      <dt>DOB</dt><dd>${escape(fmtDate(p.birthTime))}</dd>
      <dt>Gender</dt><dd>${escape(p.gender ?? "")}</dd>
      <dt>MRN</dt><dd>${escape(p.mrn ?? "")}</dd>
      <dt>Document date</dt><dd>${escape(fmtDate(doc.documentDate))}</dd>
    </dl>
  </header>
${sectionsHtml}
</body>
</html>
`;
}
