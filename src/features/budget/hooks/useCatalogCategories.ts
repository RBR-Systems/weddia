"use client";
import { useState, useEffect, useCallback } from "react";
import { CategoriesService } from "../api/categoriesApi";
import type { CatalogCategory } from "../models/budget.models";

export interface UseCatalogCategoriesResult {
  catalogCategories: CatalogCategory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createCategory: (name: string, description: string) => Promise<CatalogCategory>;
  updateCategory: (id: string, name: string, description: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCatalogCategories = (): UseCatalogCategoriesResult => {
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const categories = await CategoriesService.getAll();
      setCatalogCategories(categories);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load categories"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(
    async (name: string, description: string): Promise<CatalogCategory> => {
      const created = await CategoriesService.create(name, description);
      setCatalogCategories((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const updateCategory = useCallback(
    async (id: string, name: string, description: string): Promise<void> => {
      await CategoriesService.update(id, name, description);
      setCatalogCategories((prev) =>
        prev.map((c) => (c.category_id === id ? { ...c, name, description } : c)),
      );
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    await CategoriesService.remove(id);
    setCatalogCategories((prev) => prev.filter((c) => c.category_id !== id));
  }, []);

  return {
    catalogCategories,
    isLoading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
