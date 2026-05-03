"use client";
import type React from "react";
import type {
  BudgetAction,
  BudgetState,
  BudgetSummary,
  Category,
  CategoryPatchSource,
  Expense,
  TemplateCategoryRaw,
} from "../models/budget.models";
import {
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  updateBudget as apiUpdateBudget,
} from "../api/budgetApi";
import {
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
} from "../api/expensesApi";
import { EventActions } from "@/shared/contexts/eventActions";
import type { EventAction } from "@/shared/contexts/eventActions";
import type { EventCardProps } from "@/features/events-list/models/eventCardProps.models";
import {
  generateBudgetId,
  computeSpentSummary,
  computeAllocatedTotal,
  mergeTemplateCategories,
} from "../utils/budget.utils";

interface UseBudgetActionsParams {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
  eventId: number;
  selectedEvent: EventCardProps | null | undefined;
  eventDispatch: React.Dispatch<EventAction>;
}

export interface UseBudgetActionsResult {
  addExpense: (payload: Omit<Expense, "expense_id">) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => void;
  updateBudget: (totalBudget: number) => void;
  assignVendor: (vendorId: string) => void;
  unassignVendor: (vendorId: string) => void;
  loadTemplate: (template: CategoryPatchSource) => void;
  loadEstimate: (estimate: CategoryPatchSource) => void;
}

export const useBudgetActions = ({
  state,
  dispatch,
  eventId,
  selectedEvent,
  eventDispatch,
}: UseBudgetActionsParams): UseBudgetActionsResult => {
  const resolveVendorId = (vendorName?: string): string | undefined =>
    vendorName
      ? state.vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())?.vendor_id
      : undefined;

  const addExpense = (payload: Omit<Expense, "expense_id">) => {
    const tempId = generateBudgetId();
    dispatch({ type: "ADD_EXPENSE", payload: { ...payload, expense_id: tempId } });
    const cat = state.categories.find((c) => c.id === payload.category_id);
    apiCreateExpense(eventId, {
      ...payload,
      ...(cat?.catalog_id ? { category_id: cat.catalog_id } : {}),
      vendor_id: resolveVendorId(payload.vendor_name),
    })
      .then(({ expenseId }) => {
        // Replace the temp ID with the real server-assigned ID so future PUTs work correctly.
        dispatch({ type: "UPDATE_EXPENSE", payload: { id: tempId, data: { expense_id: String(expenseId) } } });
      })
      .catch((err) => console.error("createExpense failed:", err));
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    dispatch({ type: "UPDATE_EXPENSE", payload: { id, data } });
    // Guard: temp IDs haven't been synced to the server yet.
    if (id.startsWith("id_")) return;

    const apiData: Partial<Expense> & { vendor_id?: string } = { ...data };

    // Resolve category to catalog ID when category is being changed.
    if (data.category_id) {
      const cat = state.categories.find((c) => c.id === data.category_id);
      if (cat?.catalog_id) apiData.category_id = cat.catalog_id;
    }

    if (data.vendor_name !== undefined) apiData.vendor_id = resolveVendorId(data.vendor_name);

    apiUpdateExpense(eventId, id, apiData).catch((err) =>
      console.error("updateExpense failed:", err),
    );
  };

  const deleteExpense = (expenseId: string) => {
    dispatch({ type: "DELETE_EXPENSE", payload: expenseId });
    apiDeleteExpense(eventId, expenseId).catch((err) =>
      console.error("deleteExpense failed:", err),
    );
  };

  const addCategory = (category: Category) => {
    dispatch({ type: "ADD_CATEGORY", payload: category });
    apiCreateCategory(eventId, {
      catalogCategoryId: category.catalog_id!,
      budget_name: category.budget_name ?? "",
      budget_notes: category.budget_notes,
      allocated: category.allocated ?? 0,
    })
      .then(({ budgetId }) =>
        dispatch({ type: "UPDATE_CATEGORY", payload: { id: category.id, data: { id: String(budgetId) } } }),
      )
      .catch((err) => console.error("createCategory failed:", err));
  };

  const updateCategory = async (id: string, data: Partial<Category>): Promise<void> => {
    const current = state.categories.find((c) => c.id === id);
    if (!current) return;
    dispatch({ type: "UPDATE_CATEGORY", payload: { id, data } });
    await apiUpdateCategory(id, {
      eventId,
      categoryId: Number(current.catalog_id),
      description: data.budget_name ?? current.budget_name ?? current.name,
      allocatedAmount: data.allocated ?? current.allocated,
      spentAmount: current.spent,
      currency: state.currency,
      notes: data.budget_notes ?? current.budget_notes ?? "",
    });
  };

  const deleteCategory = (categoryId: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: categoryId });
    apiDeleteCategory(categoryId).catch((err) =>
      console.error("deleteCategory failed:", err),
    );
  };

  const updateBudget = (totalBudget: number) => {
    dispatch({ type: "UPDATE_BUDGET", payload: totalBudget });
    if (selectedEvent) {
      eventDispatch({
        type: EventActions.UPDATE_EVENT,
        payload: { ...(selectedEvent as EventCardProps), budget: totalBudget },
      });
    }
    apiUpdateBudget(eventId, { total_budget: totalBudget }).catch((err) =>
      console.error("updateBudget failed:", err),
    );
  };

  const assignVendor = (vendorId: string) => {
    if (state.eventVendorIds.includes(vendorId)) return;
    const updated = [...state.eventVendorIds, vendorId];
    dispatch({ type: "SET_EVENT_VENDOR_IDS", payload: updated });
    localStorage.setItem(`rbr_event_vendors_${eventId}`, JSON.stringify(updated));
  };

  const unassignVendor = (vendorId: string) => {
    const updated = state.eventVendorIds.filter((id) => id !== vendorId);
    dispatch({ type: "SET_EVENT_VENDOR_IDS", payload: updated });
    localStorage.setItem(`rbr_event_vendors_${eventId}`, JSON.stringify(updated));
  };

  const applyCategoryPatch = (
    source: CategoryPatchSource,
    getAllocated: (c: TemplateCategoryRaw, totalBudget: number) => number,
    getPercentage: (c: TemplateCategoryRaw, allocated: number, totalBudget: number) => number,
  ) => {
    const totalBudget = source.total_budget ?? state.summary?.total_budget ?? 0;
    if (source.total_budget) dispatch({ type: "UPDATE_BUDGET", payload: source.total_budget });
    if (!source.categories) return;

    const combined = mergeTemplateCategories(
      source.categories,
      state.categories,
      (c, match) => {
        const allocated = getAllocated(c, totalBudget);
        return {
          id: match?.id ?? generateBudgetId(),
          name: c.name,
          allocated,
          spent: match?.spent ?? (typeof c.spent === "number" ? c.spent : 0),
          expense_count: match?.expense_count ?? 0,
          remaining: allocated - (match?.spent ?? (c.spent ?? 0)),
          percentage: getPercentage(c, allocated, totalBudget),
          color: c.color ?? match?.color,
        } as Category;
      },
    );

    const total_allocated = computeAllocatedTotal(combined);
    const total_spent = state.summary?.total_spent ?? 0;
    dispatch({
      type: "SET_DATA",
      payload: {
        categories: combined,
        summary: {
          ...(state.summary as BudgetSummary),
          ...computeSpentSummary(totalBudget, total_spent),
          total_allocated,
          total_budget: totalBudget,
        },
      },
    });
  };

  const loadTemplate = (template: CategoryPatchSource) =>
    applyCategoryPatch(
      template,
      (c, totalBudget) => Math.round(((c.percentage ?? 0) * totalBudget) / 100),
      (c) => c.percentage ?? 0,
    );

  const loadEstimate = (estimate: CategoryPatchSource) =>
    applyCategoryPatch(
      estimate,
      (c, totalBudget) =>
        typeof c.allocated === "number"
          ? Math.round(c.allocated)
          : Math.round(((c.percentage ?? 0) * totalBudget) / 100),
      (c, allocated, totalBudget) =>
        typeof c.percentage === "number"
          ? Number.parseFloat(c.percentage.toFixed(2))
          : totalBudget > 0
          ? Number.parseFloat(((allocated / totalBudget) * 100).toFixed(2))
          : 0,
    );

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    updateBudget,
    assignVendor,
    unassignVendor,
    loadTemplate,
    loadEstimate,
  };
};
