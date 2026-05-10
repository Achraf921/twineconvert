/**
 * CSV ↔ FinanceTransaction[] bridge using Papa Parse (already in deps).
 *
 * On read, we auto-detect column meaning from headers using a small
 * dictionary of synonyms. This lets users drop in CSV exports from
 * basically any bank without manual column mapping, most banks use
 * recognizable names like "Posted Date", "Description", "Amount".
 *
 * Two amount conventions exist in real bank CSVs:
 *   1. Single signed column: "Amount" with negatives for debits.
 *   2. Two columns: "Debit" + "Credit" (one is empty per row).
 * We detect both.
 */

import type { FinanceTransaction } from "./finance-tx";

interface ColumnMap {
  date?: number;
  amount?: number;
  debit?: number;
  credit?: number;
  payee?: number;
  memo?: number;
  type?: number;
  checkNumber?: number;
  category?: number;
}

const SYNONYMS: Record<keyof ColumnMap, string[]> = {
  date: ["date", "posted date", "transaction date", "trans date", "post date"],
  amount: ["amount", "value", "transaction amount"],
  debit: ["debit", "withdrawal", "withdrawals", "money out", "out"],
  credit: ["credit", "deposit", "deposits", "money in", "in"],
  payee: ["payee", "name", "description", "merchant", "details", "narrative"],
  memo: ["memo", "notes", "note", "reference"],
  type: ["type", "transaction type", "trans type"],
  checkNumber: ["check", "check number", "check #", "cheque"],
  category: ["category"],
};

function detectColumns(headers: string[]): ColumnMap {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const map: ColumnMap = {};
  for (const [field, synonyms] of Object.entries(SYNONYMS) as [keyof ColumnMap, string[]][]) {
    for (let i = 0; i < lower.length; i++) {
      if (synonyms.includes(lower[i])) {
        map[field] = i;
        break;
      }
    }
  }
  return map;
}

function parseDate(raw: string): string {
  const trimmed = raw.trim();
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // MM/DD/YYYY or M/D/YYYY (US bank default)
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    let year = us[3];
    if (year.length === 2) {
      const yn = parseInt(year, 10);
      year = yn < 50 ? `20${year}` : `19${year}`;
    }
    return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  }
  // DD/MM/YYYY (UK/EU) and DD-MM-YYYY ambiguity is intentionally NOT auto-detected
  // here, there's no way to disambiguate "01/02/2024" without knowing locale.
  // Fall back to native Date parsing for ISO-ish forms.
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return trimmed;
}

function parseAmount(raw: string): number {
  // Strip currency symbols, spaces, commas. Keep leading "-" and "(".
  const cleaned = raw
    .trim()
    .replace(/[^\d.,()\-]/g, "")
    .replace(/,/g, "");
  // Accounting convention: parentheses around a number = negative.
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    return -parseFloat(cleaned.slice(1, -1));
  }
  return parseFloat(cleaned);
}

export async function parseFinanceCsv(text: string): Promise<FinanceTransaction[]> {
  const Papa = (await import("papaparse")).default;
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const rows = parsed.data;
  if (rows.length < 1) return [];

  const headers = rows[0];
  const cols = detectColumns(headers);
  const dataRows = rows.slice(1);

  // Fall back to positional layout if headers are unrecognizable.
  // Common positional convention: date,amount,description,memo
  if (cols.date === undefined) cols.date = 0;
  if (cols.amount === undefined && cols.debit === undefined && cols.credit === undefined) {
    cols.amount = 1;
  }
  if (cols.payee === undefined) cols.payee = 2;

  const transactions: FinanceTransaction[] = [];
  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const dateRaw = row[cols.date!];
    if (!dateRaw) continue;

    let amount = NaN;
    if (cols.amount !== undefined && row[cols.amount]) {
      amount = parseAmount(row[cols.amount]);
    } else if (cols.debit !== undefined || cols.credit !== undefined) {
      const debit = cols.debit !== undefined && row[cols.debit] ? parseAmount(row[cols.debit]) : 0;
      const credit = cols.credit !== undefined && row[cols.credit] ? parseAmount(row[cols.credit]) : 0;
      // Debit is typically positive in two-column form but represents money out.
      amount = (credit || 0) - Math.abs(debit || 0);
    }
    if (isNaN(amount)) continue;

    transactions.push({
      date: parseDate(dateRaw),
      amount,
      payee: cols.payee !== undefined ? row[cols.payee]?.trim() : undefined,
      memo: cols.memo !== undefined ? row[cols.memo]?.trim() : undefined,
      type: cols.type !== undefined ? row[cols.type]?.trim() : undefined,
      checkNumber: cols.checkNumber !== undefined ? row[cols.checkNumber]?.trim() : undefined,
      category: cols.category !== undefined ? row[cols.category]?.trim() : undefined,
    });
  }

  return transactions;
}

export async function transactionsToCsv(txs: FinanceTransaction[]): Promise<string> {
  const Papa = (await import("papaparse")).default;
  const rows = txs.map((t) => ({
    Date: t.date,
    Amount: t.amount.toFixed(2),
    Payee: t.payee ?? "",
    Memo: t.memo ?? "",
    Type: t.type ?? "",
    "Check Number": t.checkNumber ?? "",
    Category: t.category ?? "",
    "Transaction ID": t.fitid ?? "",
  }));
  return Papa.unparse(rows);
}
