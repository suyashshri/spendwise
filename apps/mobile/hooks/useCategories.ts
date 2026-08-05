import { useEffect } from 'react';
import { DEFAULT_CATEGORIES } from '@spendwise/shared';
import { useCategoryStore } from '@/store/categoryStore';

export function useCategories() {
  const categories = useCategoryStore((s) => s.categories);
  const isLoading = useCategoryStore((s) => s.isLoading);
  const error = useCategoryStore((s) => s.error);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Falls back to the static defaults before the first fetch resolves (or if it fails), so
  // pickers render immediately instead of a blank/loading state on every screen that uses one.
  const list = categories.length > 0 ? categories : DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.name, isDefault: true }));

  return { categories: list, isLoading, error, addCategory, deleteCategory, refetch: fetchCategories };
}
