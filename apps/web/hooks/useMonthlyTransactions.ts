"use client";

import { useEffect, useMemo } from "react";
import type { CategoryBreakdown } from "@/components/spending-breakdown";
import { useTransactionStore } from "@/store/transactionStore";
import { currentMonthYear } from "@/lib/format";

export function useMonthlyTransactions(month?: number, year?: number) {
  const { month: m, year: y } = month && year ? { month, year } : currentMonthYear();
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);

  useEffect(() => {
    fetchTransactions({ month: m, year: y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, y]);

  // Sum amountInBaseCurrency, not amount — transactions can be in different currencies (see
  // specifications/12-multi-currency.md); amountInBaseCurrency is already converted to the
  // user's account currency at save time.
  const totalSpent = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amountInBaseCurrency, 0),
    [transactions]
  );

  const byCategory: CategoryBreakdown[] = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amountInBaseCurrency);
    }
    return Array.from(totals.entries()).map(([category, amount]) => ({ category, amount }));
  }, [transactions]);

  return { transactions, totalSpent, byCategory, isLoading, refetch: () => fetchTransactions({ month: m, year: y }) };
}
