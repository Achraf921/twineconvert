/**
 * OFX 2.x writer. Produces well-formed XML that's accepted by Quicken,
 * GnuCash, Money in Excel, and most personal-finance apps. The same
 * output is valid as OFX, QFX (with INTU.BID), and QBO (with QuickBooks
 * MIME wrapper) — vendor variants are produced by passing different
 * `flavor` options.
 *
 * We don't bother with OFX 1.x output even though we accept it as input.
 * Every modern consumer reads 2.x; producing 2.x means cleaner XML and
 * no SGML serialization edge cases.
 */

import { type FinanceTransaction, toOfxDate } from "./finance-tx";

export type OfxFlavor = "ofx" | "qfx" | "qbo";

export interface BuildOfxOptions {
  transactions: FinanceTransaction[];
  flavor?: OfxFlavor;
  accountId?: string;
  currency?: string;
}

function nowOfxDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildTransactionXml(tx: FinanceTransaction, idx: number): string {
  const fitid = tx.fitid ?? `TX${nowOfxDate()}${idx}`;
  const trnType = tx.type ?? (tx.amount < 0 ? "DEBIT" : "CREDIT");
  const parts = [
    `      <STMTTRN>`,
    `        <TRNTYPE>${escapeXml(trnType)}</TRNTYPE>`,
    `        <DTPOSTED>${toOfxDate(tx.date)}</DTPOSTED>`,
    `        <TRNAMT>${tx.amount.toFixed(2)}</TRNAMT>`,
    `        <FITID>${escapeXml(fitid)}</FITID>`,
  ];
  if (tx.checkNumber) parts.push(`        <CHECKNUM>${escapeXml(tx.checkNumber)}</CHECKNUM>`);
  if (tx.payee) parts.push(`        <NAME>${escapeXml(tx.payee.slice(0, 32))}</NAME>`);
  if (tx.memo) parts.push(`        <MEMO>${escapeXml(tx.memo)}</MEMO>`);
  parts.push(`      </STMTTRN>`);
  return parts.join("\n");
}

export function buildOfx(opts: BuildOfxOptions): string {
  const txs = opts.transactions;
  const acctId = opts.accountId ?? "0000000000";
  const currency = opts.currency ?? "USD";
  const flavor = opts.flavor ?? "ofx";
  const isQfx = flavor === "qfx";
  const isQbo = flavor === "qbo";

  // Date range — earliest and latest transaction dates, falling back to today.
  const dates = txs.map((t) => t.date).sort();
  const dtStart = dates[0] ? toOfxDate(dates[0]) : nowOfxDate();
  const dtEnd = dates[dates.length - 1] ? toOfxDate(dates[dates.length - 1]) : nowOfxDate();

  // Compute closing balance as the sum of transactions (caller can override later if needed).
  const balance = txs.reduce((sum, t) => sum + t.amount, 0);

  const intuTags = isQfx
    ? `      <INTU.BID>00000</INTU.BID>\n      <INTU.USERID>${escapeXml(acctId)}</INTU.USERID>\n`
    : "";

  const headerPi = isQbo
    ? `<?xml version="1.0" encoding="UTF-8"?>\n<?OFX OFXHEADER="200" VERSION="220" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>\n`
    : `<?xml version="1.0" encoding="UTF-8"?>\n<?OFX OFXHEADER="200" VERSION="200" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>\n`;

  return `${headerPi}<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
      <DTSERVER>${nowOfxDate()}</DTSERVER>
      <LANGUAGE>ENG</LANGUAGE>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
      <STMTRS>
        <CURDEF>${escapeXml(currency)}</CURDEF>
        <BANKACCTFROM>
          <BANKID>000000000</BANKID>
          <ACCTID>${escapeXml(acctId)}</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
${intuTags}        <BANKTRANLIST>
          <DTSTART>${dtStart}</DTSTART>
          <DTEND>${dtEnd}</DTEND>
${txs.map(buildTransactionXml).join("\n")}
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>${balance.toFixed(2)}</BALAMT>
          <DTASOF>${dtEnd}</DTASOF>
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
}
