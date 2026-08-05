"use client";

import { useEffect, useState } from "react";
import type { BudgetPeriod } from "@spendwise/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgetStore } from "@/store/budgetStore";
import { useCategoryStore } from "@/store/categoryStore";
import { extractApiErrorMessage } from "@/lib/api";

export function BudgetFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);

  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");
  const [limit, setLimit] = useState("");
  const [alertAt, setAlertAt] = useState("80");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.category === c.name && b.period === period)
  );

  useEffect(() => {
    if (open) {
      setCategory(availableCategories[0]?.name ?? "");
      setLimit("");
      setAlertAt("80");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, period]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(limit);
    if (!(value > 0) || !category) {
      setError("Choose a category and enter an amount greater than 0");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await addBudget({ category, limit: value, period, alertAt: Number(alertAt) });
      onOpenChange(false);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New category budget</DialogTitle>
          <DialogDescription>Get notified as you approach the limit.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground">Every category already has a {period} budget.</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Period</Label>
              <Select value={period} onValueChange={(value) => value && setPeriod(value as BudgetPeriod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="limit">Limit amount</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                min="0"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alertAt">Alert at (% of limit)</Label>
            <Input
              id="alertAt"
              type="number"
              min="0"
              max="100"
              value={alertAt}
              onChange={(e) => setAlertAt(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSaving || availableCategories.length === 0} className="w-full">
              {isSaving ? "Saving…" : "Add budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
