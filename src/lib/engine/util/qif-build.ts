/**
 * QIF writer. We emit `!Type:Bank` (the most generic / widely-accepted
 * type) and standard D/T/P/M/N/L field codes. Quicken, GnuCash, and
 * most personal-finance apps accept this regardless of whether the
 * underlying account is checking, savings, or credit-card.
 */

import { type FinanceTransaction, toQifDate } from "./finance-tx";

export function buildQif(transactions: FinanceTransaction[]): string {
  const lines: string[] = ["!Type:Bank"];
  for (const tx of transactions) {
    lines.push(`D${toQifDate(tx.date)}`);
    lines.push(`T${tx.amount.toFixed(2)}`);
    if (tx.checkNumber) lines.push(`N${tx.checkNumber}`);
    if (tx.payee) lines.push(`P${tx.payee}`);
    if (tx.memo) lines.push(`M${tx.memo}`);
    if (tx.category) lines.push(`L${tx.category}`);
    lines.push("^");
  }
  return lines.join("\n") + "\n";
}
