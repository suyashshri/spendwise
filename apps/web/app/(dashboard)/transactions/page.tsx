"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { Transaction } from "@spendwise/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionFormDialog } from "@/components/transaction-form-dialog";
import { useCategoryStore } from "@/store/categoryStore";
import { useTransactionStore } from "@/store/transactionStore";
import { currentMonthYear, formatCurrency, formatDate, monthLabel } from "@/lib/format";

const ALL = "all";

export default function TransactionsPage() {
  const categories = useCategoryStore((s) => s.categories);
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  const [{ month, year }, setPeriod] = useState(currentMonthYear());
  const [category, setCategory] = useState(ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions({ month, year, category: category === ALL ? undefined : category });
  }, [month, year, category, fetchTransactions]);

  const shiftMonth = (delta: number) => {
    setPeriod(({ month: m, year: y }) => {
      const d = new Date(y, m - 1 + delta, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });
  };

  const total = useMemo(() => transactions.reduce((sum, t) => sum + t.amountInBaseCurrency, 0), [transactions]);

  const onEdit = (t: Transaction) => {
    setEditing(t);
    setIsFormOpen(true);
  };

  const onAdd = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const onDelete = async (t: Transaction) => {
    if (window.confirm(`Delete the ${t.merchant} transaction? This cannot be undone.`)) {
      await deleteTransaction(t.id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
        </div>
        <Button onClick={onAdd} className="h-9">
          <Plus className="size-4" />
          Add expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium">{monthLabel(month, year)}</span>
          <Button variant="outline" size="icon-sm" onClick={() => shiftMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total: {formatCurrency(total)}</span>
          <Select value={category} onValueChange={(value) => value && setCategory(value)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No transactions in this period.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium">{t.merchant}</div>
                    {t.needsReview ? (
                      <Badge variant="outline" className="mt-1 text-amber-600 dark:text-amber-400">
                        Needs review
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(t.amount, t.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(t)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => onDelete(t)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} transaction={editing} />
    </div>
  );
}
