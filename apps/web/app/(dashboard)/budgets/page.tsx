"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { BudgetFormDialog } from "@/components/budget-form-dialog";
import { BudgetProgressBar } from "@/components/budget-progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBudgets } from "@/hooks/useBudgets";
import { useMonthlyTransactions } from "@/hooks/useMonthlyTransactions";
import { currentMonthYear, monthLabel } from "@/lib/format";

export default function BudgetsPage() {
  const { user, updateProfile } = useAuth();
  const { month, year } = currentMonthYear();
  const { totalSpent } = useMonthlyTransactions();
  const { budgets, deleteBudget } = useBudgets();

  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [overallInput, setOverallInput] = useState(user?.monthlyBudget ? String(user.monthlyBudget) : "");
  const [isSavingOverall, setIsSavingOverall] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const currency = user?.currency ?? "INR";

  const onSaveOverall = async () => {
    const value = Number(overallInput);
    if (!(value > 0)) {
      setOverallError("Enter an amount greater than 0");
      return;
    }
    setOverallError(null);
    setIsSavingOverall(true);
    const result = await updateProfile({ monthlyBudget: value });
    setIsSavingOverall(false);
    if (result.success) {
      setIsEditingOverall(false);
    } else {
      setOverallError(result.message);
    }
  };

  const onDeleteBudget = async (id: string, label: string) => {
    if (window.confirm(`Remove the ${label} budget?`)) {
      await deleteBudget(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">Keep spending in check, category by category.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            {monthLabel(month, year)} overall budget
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsEditingOverall((v) => !v)}>
            {user?.monthlyBudget ? "Edit" : "Set budget"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditingOverall ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 20000"
                value={overallInput}
                onChange={(e) => setOverallInput(e.target.value)}
                className="max-w-48"
              />
              <Button onClick={onSaveOverall} disabled={isSavingOverall}>
                {isSavingOverall ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : user?.monthlyBudget ? (
            <BudgetProgressBar label="Overall" spent={totalSpent} limit={user.monthlyBudget} alertAt={80} currency={currency} />
          ) : (
            <p className="text-sm text-muted-foreground">Set a monthly budget to track how much of it you&apos;ve used.</p>
          )}
          {overallError ? <p className="mt-2 text-sm text-destructive">{overallError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Category budgets</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="size-4" />
            Add budget
          </Button>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Set a budget for a specific category — like Food &amp; Dining or Transport — to get alerts as you
              approach the limit.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {budgets.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1">
                    <BudgetProgressBar
                      label={`${b.category} · ${b.period}`}
                      spent={b.spent ?? 0}
                      limit={b.limit}
                      alertAt={b.alertAt}
                      currency={currency}
                    />
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => onDeleteBudget(b.id, b.category)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetFormDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
