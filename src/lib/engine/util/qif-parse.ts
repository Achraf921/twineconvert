/**
 * QIF parser. QIF is the oldest of the Quicken family — pre-OFX, text
 * line-based, with single-character field codes. Each transaction is a
 * sequence of field lines terminated by a single `^`.
 *
 *   !Type:Bank
 *   D03/15/2024
 *   T-50.00
 *   PSTARBUCKS
 *   MMORNING COFFEE
 *   ^
 *   D03/16/2024
 *   T1500.00
 *   PEMPLOYER PAYROLL
 *   ^
 *
 * Field codes we care about:
 *   D = date    T = amount    P = payee    M = memo
 *   N = number/check#         L = category    C = cleared status
 *
 * QIF doesn't carry a unique transaction id, currency, or account id
 * (account-level QIFs do but most consumer exports don't). Those map
 * to undefined in the unified shape.
 */

import {
  type FinanceTransaction,
  type ParsedFinanceFile,
  parseQifDate,
} from "./finance-tx";

export function parseQif(raw: string): ParsedFinanceFile {
  const lines = raw.split(/\r?\n/);
  const transactions: FinanceTransaction[] = [];
  let current: Partial<FinanceTransaction> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section header (!Type:Bank, !Type:CCard, !Account, etc.) — we ignore
    // the type since our unified shape doesn't distinguish, but we reset
    // any in-progress transaction to be safe.
    if (trimmed.startsWith("!")) {
      current = {};
      continue;
    }

    // End-of-transaction marker.
    if (trimmed === "^") {
      if (current.date !== undefined && current.amount !== undefined) {
        transactions.push(current as FinanceTransaction);
      }
      current = {};
      continue;
    }

    const code = trimmed[0];
    const value = trimmed.slice(1);
    switch (code) {
      case "D":
        current.date = parseQifDate(value);
        break;
      case "T":
      case "U": // U is sometimes used identically by Quicken
        current.amount = parseFloat(value.replace(/,/g, ""));
        break;
      case "P":
        current.payee = value;
        break;
      case "M":
        current.memo = value;
        break;
      case "N":
        current.checkNumber = value;
        break;
      case "L":
        current.category = value;
        break;
      // C (cleared), A (address), S/E/$ (split lines), F (reimbursable) — ignored
    }
  }

  // Flush trailing transaction without a `^` (some hand-written QIFs miss it).
  if (current.date !== undefined && current.amount !== undefined) {
    transactions.push(current as FinanceTransaction);
  }

  return { transactions };
}
