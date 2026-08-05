import PDFDocument from "pdfkit";
import { getCurrencyInfo } from "@spendwise/shared";
import type { TransactionDocument } from "../models/Transaction";

interface ReportMeta {
  userName: string;
  userCurrency: string;
  rangeLabel: string;
}

const COLUMNS = [
  { label: "Date", width: 70 },
  { label: "Merchant", width: 170 },
  { label: "Category", width: 110 },
  { label: "Amount", width: 100 },
];
const ROW_HEIGHT = 20;

export function generateTransactionsPdf(transactions: TransactionDocument[], meta: ReportMeta): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const { locale } = getCurrencyInfo(meta.userCurrency);
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: meta.userCurrency }).format(amount);

  doc.font("Helvetica-Bold").fontSize(20).fillColor("#111").text("SpendWise");
  doc.font("Helvetica").fontSize(11).fillColor("#666").text(`Transaction report — ${meta.rangeLabel}`);
  doc.text(`${meta.userName} · generated ${new Date().toLocaleDateString("en-US")}`);
  doc.moveDown();

  const total = transactions.reduce((sum, t) => sum + t.amountInBaseCurrency, 0);
  doc
    .fillColor("#111")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(`Total: ${formatAmount(total)}  ·  ${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`);
  doc.moveDown(1);

  const startX = doc.page.margins.left;
  let y = doc.y;

  function newPage(): void {
    doc.addPage();
    y = doc.page.margins.top;
  }

  function drawRow(cells: string[], bold: boolean): void {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(bold ? "#111" : "#333");
    let x = startX;
    cells.forEach((cell, i) => {
      doc.text(cell, x, y, { width: COLUMNS[i].width, ellipsis: true, lineBreak: false });
      x += COLUMNS[i].width;
    });
    y += ROW_HEIGHT;
    if (y > doc.page.height - doc.page.margins.bottom - ROW_HEIGHT) {
      newPage();
    }
  }

  drawRow(COLUMNS.map((c) => c.label), true);
  for (const t of transactions) {
    drawRow(
      [
        t.date.toISOString().slice(0, 10),
        t.merchant,
        t.category,
        formatAmount(t.amount) + (t.currency !== meta.userCurrency ? ` (${t.currency})` : ""),
      ],
      false
    );
  }

  if (transactions.length === 0) {
    doc.font("Helvetica").fontSize(11).fillColor("#666").text("No transactions in this range.", startX, y);
  }

  return doc;
}
