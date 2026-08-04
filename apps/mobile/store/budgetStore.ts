import { create } from 'zustand';
import type { Budget, BudgetPeriod } from '@spendwise/shared';
import { api } from '../services/api';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  addBudget: (input: { category: string; limit: number; period: BudgetPeriod; alertAt: number }) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Pick<Budget, 'limit' | 'alertAt' | 'isActive'>>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ budgets: Budget[] }>('/budgets');
      set({ budgets: data.budgets, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load budgets' });
    }
  },

  addBudget: async (input) => {
    const { data } = await api.post<{ budget: Budget }>('/budgets', input);
    set({ budgets: [data.budget, ...get().budgets] });
    return data.budget;
  },

  updateBudget: async (id, updates) => {
    const { data } = await api.patch<{ budget: Budget }>(`/budgets/${id}`, updates);
    set({ budgets: get().budgets.map((b) => (b.id === id ? data.budget : b)) });
  },

  deleteBudget: async (id) => {
    await api.delete(`/budgets/${id}`);
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },
}));
