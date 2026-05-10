/**
 * Parser for OFX 1.x (SGML), OFX 2.x (XML), QFX (OFX + Intuit tags), and
 * QBO (OFX + QuickBooks tags). All four formats share the same body
 * structure (`<STMTTRN>` blocks under `<BANKTRANLIST>` / `<CCSTMTRS>`),
 * differing only in headers and a handful of vendor-specific tags we
 * don't need to interpret.
 *
 * The hairy part is OFX 1.x: it's "SGML" in the loose sense — tags like
 * `<DTPOSTED>20240101` close implicitly at the next `<`, which isn't
 * valid XML. We rewrite the body into well-formed XML before handing it
 * to DOMParser. The transformation is: every line matching
 * `<TAG>value` (no closer) becomes `<TAG>value</TAG>`.
 */

import {
  type FinanceTransaction,
  type ParsedFinanceFile,
  parseOfxDate,
} from "./finance-tx";

function stripHeader(raw: string): { body: string; isOfx2: boolean } {
  // OFX 2.x starts with <?xml ... ?> followed by <?OFX OFXHEADER="200" ...?>
  // OFX 1.x starts with key:value header lines, then a blank line, then <OFX>
  // QBO is OFX 2.x with QuickBooks-specific PI. QFX is usually 1.x (Quicken).
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<?OFX")) {
    // 2.x: drop everything before <OFX>
    const idx = trimmed.indexOf("<OFX>");
    return { body: idx >= 0 ? trimmed.slice(idx) : trimmed, isOfx2: true };
  }
  // 1.x: header is key:value lines until first blank line
  const blankIdx = raw.search(/\r?\n\r?\n/);
  const body = blankIdx >= 0 ? raw.slice(blankIdx).trimStart() : raw;
  return { body, isOfx2: false };
}

/**
 * Insert closing tags for the implicit-close SGML form used by OFX 1.x.
 * Walks line-by-line because that's how real OFX files are written.
 */
function sgmlToXml(body: string): string {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      // Match opener with text content and no closer on the same line.
      // e.g. "<DTPOSTED>20240101" → "<DTPOSTED>20240101</DTPOSTED>"
      const m = trimmed.match(/^<([A-Z0-9.]+)>([^<]+)$/i);
      if (m) {
        return `<${m[1]}>${escapeXmlContent(m[2])}</${m[1]}>`;
      }
      return trimmed;
    })
    .join("\n");
}

/** Escape `&`, `<`, `>` in raw OFX text content so the XML parser doesn't choke. */
function escapeXmlContent(s: string): string {
  return s.replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getText(node: Element | null, tag: string): string | undefined {
  if (!node) return undefined;
  const el = node.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() || undefined;
}

export function parseOfx(raw: string): ParsedFinanceFile {
  const { body, isOfx2 } = stripHeader(raw);
  const xml = isOfx2 ? body : sgmlToXml(body);

  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser unavailable in this environment");
  }
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.getElementsByTagName("parsererror")[0];
  if (parseError) {
    throw new Error(`OFX parse failed: ${parseError.textContent?.slice(0, 120)}`);
  }

  const transactions: FinanceTransaction[] = [];

  // Account id can live in BANKACCTFROM (bank/checking) or CCACCTFROM (credit card).
  const acctNode =
    doc.getElementsByTagName("BANKACCTFROM")[0] ??
    doc.getElementsByTagName("CCACCTFROM")[0];
  const accountId = getText(acctNode, "ACCTID");

  // Currency lives at the statement level.
  const stmtNode =
    doc.getElementsByTagName("STMTRS")[0] ??
    doc.getElementsByTagName("CCSTMTRS")[0];
  const currency = getText(stmtNode, "CURDEF") ?? "USD";

  const txNodes = doc.getElementsByTagName("STMTTRN");
  for (const txNode of Array.from(txNodes)) {
    const dateRaw = getText(txNode, "DTPOSTED") ?? getText(txNode, "DTUSER");
    const amountRaw = getText(txNode, "TRNAMT");
    if (!dateRaw || !amountRaw) continue;

    transactions.push({
      date: parseOfxDate(dateRaw),
      amount: parseFloat(amountRaw),
      payee: getText(txNode, "NAME") ?? getText(txNode, "PAYEE"),
      memo: getText(txNode, "MEMO"),
      type: getText(txNode, "TRNTYPE"),
      checkNumber: getText(txNode, "CHECKNUM"),
      fitid: getText(txNode, "FITID"),
    });
  }

  return { transactions, accountId, currency };
}
