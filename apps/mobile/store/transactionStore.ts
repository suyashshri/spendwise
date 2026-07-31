import { create } from 'zustand';
import type { Transaction } from '@spendwise/shared';
import { api } from '../services/api';

interface TransactionFilters {
  month?: number;
  year?: number;
  category?: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (input: {
    amount: number;
    merchant: string;
    category: string;
    date: string;
    note?: string;
  }) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ transactions: Transaction[] }>('/transactions', {
        params: { ...filters, limit: 100 },
      });
      set({ transactions: data.transactions, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load transactions' });
    }
  },

  addTransaction: async (input) => {
    const { data } = await api.post<{ transaction: Transaction }>('/transactions', input);
    set({ transactions: [data.transaction, ...get().transactions] });
    return data.transaction;
  },

  updateTransaction: async (id, updates) => {
    const { data } = await api.patch<{ transaction: Transaction }>(`/transactions/${id}`, updates);
    set({
      transactions: get().transactions.map((t) => (t.id === id ? data.transaction : t)),
    });
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`);
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
  },
}));
