"use client";
import { useState, useEffect } from "react";
import { CategoriesService, type BudgetCategory } from "../api/categoriesApi";

interface UseCatalogCategoriesResult {
  catalogCategories: BudgetCategory[];
  isLoading: boolean;
  error: Error | null;
}

export const useCatalogCategories = (): UseCatalogCategoriesResult => {
  const [catalogCategories, setCatalogCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    CategoriesService.getAll()
      .then(setCatalogCategories)
      .catch((err) =>
        setError(err instanceof Error ? err : new Error("Failed to load categories")),
      )
      .finally(() => setIsLoading(false));
  }, []);

  return { catalogCategories, isLoading, error };
};
