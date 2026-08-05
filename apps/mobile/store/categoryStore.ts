import { create } from 'zustand';
import type { Category } from '@spendwise/shared';
import { api } from '../services/api';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (input: { name: string; icon: string; color: string }) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ categories: Category[] }>('/categories');
      set({ categories: data.categories, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not load categories' });
    }
  },

  addCategory: async (input) => {
    const { data } = await api.post<{ category: Category }>('/categories', input);
    set({ categories: [...get().categories, data.category] });
    return data.category;
  },

  deleteCategory: async (id) => {
    await api.delete(`/categories/${id}`);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },
}));
