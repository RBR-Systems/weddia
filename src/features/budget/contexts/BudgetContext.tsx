"use client";
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { BudgetState, Category, Expense, BudgetSummary, Currency } from "../models/budget.models";
import { getDefaultCategories, DEFAULT_CURRENCY } from "../constants/budget.constants";
import { BudgetService } from "../api/budgetApi";
import { ApiError, isAbortError } from "@/shared/api/apiClient";
import { useEvent } from "@/shared/contexts/EventContext";
import { EventActions } from "@/shared/contexts/eventActions";
import {
  generateBudgetId,
  computeSpentSummary,
  computeAllocatedTotal,
  mergeTemplateCategories,
  mapApiDataToBudgetState,
  type TemplateCategoryRaw,
} from "../utils/budget.utils";
import {
  handleAddExpense,
  handleDeleteExpense,
  handleUpdateExpense,
  handleAddCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleUpdateBudget,
} from "../utils/budgetReducer.utils";

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: Partial<BudgetState> }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "UPDATE_EXPENSE"; payload: { id: string; data: Partial<Expense> } }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: { id: string; data: Partial<Category> } }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "UPDATE_BUDGET"; payload: number }
  | { type: "SET_EVENT_VENDOR_IDS"; payload: string[] };

const initialState: BudgetState = {
  isLoading: false,
  error: null,
  summary: {
    total_budget: 0,
    total_allocated: 0,
    total_spent: 0,
    total_remaining: 0,
    percentage_spent: 0,
    status: "not_started",
    currency: DEFAULT_CURRENCY as Currency,
  },
  categories: getDefaultCategories().map((c) => ({
    id: c.id,
    name: c.name,
    allocated: 0,
    spent: 0,
    remaining: 0,
    color: c.color,
    expense_count: 0,
  })),
  expenses: [],
  vendors: [],
  eventVendorIds: [],
  currency: DEFAULT_CURRENCY as Currency,
};

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case "SET_LOADING":          return { ...state, isLoading: action.payload };
    case "SET_ERROR":            return { ...state, error: action.payload };
    case "SET_DATA":             return { ...state, ...action.payload };
    case "ADD_EXPENSE":          return handleAddExpense(state, action.payload);
    case "DELETE_EXPENSE":       return handleDeleteExpense(state, action.payload);
    case "UPDATE_EXPENSE":       return handleUpdateExpense(state, action.payload.id, action.payload.data);
    case "ADD_CATEGORY":         return handleAddCategory(state, action.payload);
    case "UPDATE_CATEGORY":      return handleUpdateCategory(state, action.payload.id, action.payload.data);
    case "DELETE_CATEGORY":      return handleDeleteCategory(state, action.payload);
    case "UPDATE_BUDGET":        return handleUpdateBudget(state, action.payload);
    case "SET_EVENT_VENDOR_IDS": return { ...state, eventVendorIds: action.payload };
    default:                     return state;
  }
}

const BudgetContext = createContext<any>(null);

export function BudgetProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { state: { events: { selectedEvent } }, dispatch: eventDispatch } = useEvent();
  const eventId = (selectedEvent as any)?.id ?? 1;
  const eventBudget = (selectedEvent as any)?.budget as number | undefined;

  const loadBudgetData = useCallback(async (eid: number, signal?: AbortSignal) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await BudgetService.getBudgetData(eid, signal);
      dispatch({ type: "SET_DATA", payload: mapApiDataToBudgetState(data, eventBudget) });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (err: any) {
      if (isAbortError(err)) return;
      if (err instanceof ApiError && err.status === 401) return;
      console.error("Failed to load budget data:", err);
      dispatch({ type: "SET_ERROR", payload: err?.message ?? "Failed to load budget data" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [eventBudget]);

  useEffect(() => {
    if (!selectedEvent) return;
    const controller = new AbortController();
    loadBudgetData(eventId, controller.signal);
    try {
      const stored = localStorage.getItem(`rbr_event_vendors_${eventId}`);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      dispatch({ type: "SET_EVENT_VENDOR_IDS", payload: ids });
    } catch {
      dispatch({ type: "SET_EVENT_VENDOR_IDS", payload: [] });
    }
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, loadBudgetData]);

  const refreshData = () => loadBudgetData(eventId);

  const resolveVendorId = (vendorName?: string): string | undefined =>
    vendorName
      ? state.vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())?.vendor_id
      : undefined;

  const addExpense = (payload: Omit<Expense, "expense_id">) => {
    dispatch({ type: "ADD_EXPENSE", payload: { ...payload, expense_id: generateBudgetId() } });
    const cat = state.categories.find((c) => c.id === payload.category_id);
    BudgetService.createExpense(eventId, {
      ...payload,
      ...(cat?.catalog_id ? { category_id: cat.catalog_id } : {}),
      vendor_id: resolveVendorId(payload.vendor_name),
    }).catch((err) => console.error("createExpense failed:", err));
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    dispatch({ type: "UPDATE_EXPENSE", payload: { id, data } });
    const apiData: Partial<Expense> & { vendor_id?: string } = { ...data };
    if (data.category_id) {
      const cat = state.categories.find((c) => c.id === data.category_id);
      if (cat?.catalog_id) apiData.category_id = cat.catalog_id;
    }
    if (data.vendor_name !== undefined) apiData.vendor_id = resolveVendorId(data.vendor_name);
    BudgetService.updateExpense(eventId, id, apiData).catch((err) =>
      console.error("updateExpense failed:", err),
    );
  };

  const deleteExpense = (expenseId: string) => {
    dispatch({ type: "DELETE_EXPENSE", payload: expenseId });
    BudgetService.deleteExpense(eventId, expenseId).catch((err) =>
      console.error("deleteExpense failed:", err),
    );
  };

  const addCategory = (category: Category) => {
    dispatch({ type: "ADD_CATEGORY", payload: category });
    BudgetService.createCategory(eventId, {
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
    await BudgetService.updateCategory(id, {
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
    BudgetService.deleteCategory(categoryId).catch((err) =>
      console.error("deleteCategory failed:", err),
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

  const updateBudget = (totalBudget: number) => {
    dispatch({ type: "UPDATE_BUDGET", payload: totalBudget });
    if (selectedEvent) {
      eventDispatch({
        type: EventActions.UPDATE_EVENT,
        payload: { ...(selectedEvent as any), budget: totalBudget },
      });
    }
    BudgetService.updateBudget(eventId, { total_budget: totalBudget }).catch((err) =>
      console.error("updateBudget failed:", err),
    );
  };

  const applyCategoryPatch = (
    source: { total_budget?: number; categories?: TemplateCategoryRaw[] },
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

  const loadTemplate = (template: any) =>
    applyCategoryPatch(
      template,
      (c, totalBudget) => Math.round(((c.percentage ?? 0) * totalBudget) / 100),
      (c) => c.percentage ?? 0,
    );

  const loadEstimate = (estimate: any) =>
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

  const value = {
    state,
    loadBudgetData,
    refreshData,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    updateBudget,
    loadTemplate,
    loadEstimate,
    assignVendor,
    unassignVendor,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}


