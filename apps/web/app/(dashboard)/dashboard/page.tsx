"use client";

import Link from "next/link";
import { Receipt, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendingBreakdown } from "@/components/spending-breakdown";
import { StatTile } from "@/components/stat-tile";
import { useAuth } from "@/hooks/useAuth";
import { useBudgets } from "@/hooks/useBudgets";
import { useMonthlyTransactions } from "@/hooks/useMonthlyTransactions";
import { currentMonthYear, formatCurrency, formatDate, monthLabel } from "@/lib/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const { month, year } = currentMonthYear();
  const { transactions, totalSpent, byCategory, isLoading } = useMonthlyTransactions();
  const { budgets } = useBudgets();

  const currency = user?.currency ?? "INR";
  const recent = transactions.slice(0, 6);
  const budget = user?.monthlyBudget;
  const budgetPercent = budget ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const overBudgetCount = budgets.filter((b) => (b.spent ?? 0) > b.limit).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your spending for {monthLabel(month, year)}.</p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.44_0.24_292.7)] p-7 text-primary-foreground shadow-lg shadow-primary/20">
        <p className="text-sm font-medium text-primary-foreground/80">{monthLabel(month, year)} spending</p>
        <p className="mt-1 text-[48px] font-semibold leading-none tracking-tight">
          {formatCurrency(totalSpent, currency)}
        </p>
        {budget ? (
          <div className="mt-4 max-w-md">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${budgetPercent}%` }} />
            </div>
            <p className="mt-1.5 text-xs font-medium text-primary-foreground/85">
              of {formatCurrency(budget, currency)} monthly budget
            </p>
          </div>
        ) : (
          <Link href="/budgets" className="mt-3 inline-block text-xs font-medium text-primary-foreground/85 underline">
            Set a monthly budget
          </Link>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Transactions this month"
          value={String(transactions.length)}
          icon={<Receipt className="size-4 text-muted-foreground" />}
        />
        <StatTile
          label="Top category"
          value={byCategory.length > 0 ? [...byCategory].sort((a, b) => b.amount - a.amount)[0].category : "—"}
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
        />
        <StatTile
          label="Budgets over limit"
          value={String(overBudgetCount)}
          deltaGoodDirection="down"
          icon={<Wallet className="size-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where it went</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingBreakdown data={byCategory} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 && !isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Share a UPI payment to SpendWise, or add an expense manually, to get started.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {recent.map((t) => (
                  <Link
                    key={t.id}
                    href={`/transactions?id=${t.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-70"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {formatDate(t.date)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(t.amount, t.currency)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
