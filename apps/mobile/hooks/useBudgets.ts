import { useEffect } from 'react';
import { useBudgetStore } from '@/store/budgetStore';

export function useBudgets() {
  const budgets = useBudgetStore((s) => s.budgets);
  const isLoading = useBudgetStore((s) => s.isLoading);
  const error = useBudgetStore((s) => s.error);
  const fetchBudgets = useBudgetStore((s) => s.fetchBudgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, isLoading, error, addBudget, updateBudget, deleteBudget, refetch: fetchBudgets };
}
