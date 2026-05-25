"use client";
import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import {
  getBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from "../api/budgetItemsApi";
import { ApiError } from "@/shared/api/apiClient";
import type { BudgetItem, Category } from "../models/budget.models";

export interface CategoryItemEditValues {
  description: string;
  amount: number | null;
  notes: string;
}

const EMPTY_EDIT: CategoryItemEditValues = { description: "", amount: null, notes: "" };

export interface UseCategoryItemsResult {
  items: BudgetItem[];
  isLoading: boolean;
  isSaving: boolean;
  editingItemId: string | null;
  editValues: CategoryItemEditValues;
  isAddingItem: boolean;
  setEditValues: Dispatch<SetStateAction<CategoryItemEditValues>>;
  setIsAddingItem: (value: boolean) => void;
  fetchItems: (budgetId: string) => Promise<void>;
  startEdit: (item: BudgetItem) => void;
  cancelEdit: () => void;
  saveEdit: (category: Category | null) => Promise<void>;
  addItem: (
    categoryId: string,
    catalogId: string | undefined,
    values: { description: string; amount: number; notes?: string },
  ) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
}

export const useCategoryItems = (): UseCategoryItemsResult => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<CategoryItemEditValues>(EMPTY_EDIT);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const fetchItems = useCallback(async (budgetId: string) => {
    setIsLoading(true);
    try {
      const data = await getBudgetItems(budgetId);
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      // silently fail — items section shows empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startEdit = useCallback((item: BudgetItem) => {
    setEditingItemId(item.item_id);
    setEditValues({ description: item.description, amount: item.amount, notes: item.notes ?? "" });
    setIsAddingItem(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingItemId(null);
    setEditValues(EMPTY_EDIT);
  }, []);

  const saveEdit = useCallback(
    async (category: Category | null) => {
      if (!editingItemId || editValues.amount === null) return;
      setIsSaving(true);
      try {
        const editingItem = items.find((i) => i.item_id === editingItemId);
        const payload = {
          description: editValues.description,
          amount: editValues.amount,
          notes: editValues.notes,
          category_id: editingItem?.category_id ?? category?.catalog_id,
        };
        await updateBudgetItem(editingItemId, payload);
        setItems((prev) =>
          prev.map((i) => (i.item_id === editingItemId ? { ...i, ...payload } : i)),
        );
        setEditingItemId(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return;
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [editingItemId, editValues, items],
  );

  const addItem = useCallback(
    async (
      categoryId: string,
      catalogId: string | undefined,
      values: { description: string; amount: number; notes?: string },
    ) => {
      setIsSaving(true);
      try {
        const created = await createBudgetItem(categoryId, { ...values, category_id: catalogId });
        setItems((prev) => [...prev, created]);
        setIsAddingItem(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return;
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await deleteBudgetItem(itemId);
      setItems((prev) => prev.filter((i) => i.item_id !== itemId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      throw err;
    }
  }, []);

  return {
    items,
    isLoading,
    isSaving,
    editingItemId,
    editValues,
    isAddingItem,
    setEditValues,
    setIsAddingItem,
    fetchItems,
    startEdit,
    cancelEdit,
    saveEdit,
    addItem,
    deleteItem,
  };
};
