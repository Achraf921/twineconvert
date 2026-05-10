/**
 * Common transaction shape used by every finance-format converter.
 *
 * The four formats we touch (OFX, QFX, QBO, QIF) all describe the same
 * thing, a list of bank/credit-card transactions, but each uses
 * different field names, encodings, and idioms. Centralizing on this
 * shape lets every parser/writer pair degrade gracefully (missing fields
 * become undefined; unknown fields get dropped).
 */

export interface FinanceTransaction {
  /** ISO 8601 date (YYYY-MM-DD). All formats lose intra-day precision in CSV exports anyway. */
  date: string;
  /** Signed amount. Negative = debit/withdrawal, positive = credit/deposit. */
  amount: number;
  /** Payee / counterparty name. */
  payee?: string;
  /** Free-form memo / description. */
  memo?: string;
  /** Transaction type as exported by the source. Free-form; common values: DEBIT, CREDIT, CHECK, ATM, XFER, INT, DIV. */
  type?: string;
  /** Check number (when applicable). */
  checkNumber?: string;
  /** Category (Quicken/QIF tradition; OFX rarely carries this). */
  category?: string;
  /** Unique transaction id from source. Preserved across OFX→OFX roundtrips so duplicates can be detected on import. */
  fitid?: string;
}

export interface ParsedFinanceFile {
  transactions: FinanceTransaction[];
  /** Source-reported account id, when present. */
  accountId?: string;
  /** Source-reported currency code (ISO 4217), when present. Default USD. */
  currency?: string;
}

/** Format an OFX-style YYYYMMDD[HHMMSS] timestamp into ISO YYYY-MM-DD. */
export function parseOfxDate(raw: string): string {
  const cleaned = raw.trim().slice(0, 8);
  if (cleaned.length < 8) return raw;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
}

/** Format an ISO date into OFX YYYYMMDD000000. */
export function toOfxDate(iso: string): string {
  const compact = iso.replace(/-/g, "");
  return compact.length === 8 ? `${compact}000000` : compact;
}

/** Format an ISO date into QIF MM/DD/YYYY (US style, QIF is a US format). */
export function toQifDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

/** Parse a QIF MM/DD/YYYY or M/D/YYYY (with optional ' apostrophe before YY) into ISO. */
export function parseQifDate(raw: string): string {
  // QIF dates: M/D/YYYY, M/D'YY, MM/DD/YYYY, etc. Quicken sometimes
  // writes M/D'YY where ' separates a 2-digit year. We normalize all.
  const cleaned = raw.replace(/'/g, "/").trim();
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return cleaned;
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) {
    // Quicken's '20 vs '99 ambiguity: <50 → 2000s, >=50 → 1900s. Industry standard.
    const yn = parseInt(year, 10);
    year = yn < 50 ? `20${year}` : `19${year}`;
  }
  return `${year}-${month}-${day}`;
}
