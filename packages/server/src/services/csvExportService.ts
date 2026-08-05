import type { TransactionDocument } from "../models/Transaction";

const HEADERS = ["Date", "Merchant", "Category", "Amount", "Currency", "Note", "Recurring"];

// RFC 4180: a field containing a comma, quote, or newline must be quoted, with embedded quotes
// doubled — merchant/note are free text a user typed, so both are guaranteed to hit this eventually.
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(transactions: TransactionDocument[]): string {
  const rows = transactions.map((t) => [
    t.date.toISOString().slice(0, 10),
    t.merchant,
    t.category,
    t.amount.toFixed(2),
    t.currency,
    t.note ?? "",
    t.isRecurring ? "Yes" : "No",
  ]);

  return [HEADERS, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}
