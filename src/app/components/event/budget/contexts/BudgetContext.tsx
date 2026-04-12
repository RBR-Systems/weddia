"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import type {
  BudgetState,
  Category,
  Expense,
  Vendor,
  BudgetSummary,
  Currency,
} from "../types/budget.types";
import {
  getDefaultCategories,
  DEFAULT_CURRENCY,
} from "../constants/budget.constants";
import { BudgetService } from "../services/budget.service";
import { ApiError, isAbortError } from "@/lib/apiClient";
import { useEvent } from "@/app/contexts/EventContext";

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: Partial<BudgetState> }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "UPDATE_EXPENSE"; payload: { id: string; data: Partial<Expense> } }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | {
      type: "UPDATE_CATEGORY";
      payload: { id: string; data: Partial<Category> };
    }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "UPDATE_BUDGET"; payload: number };

function generateId() {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

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
  currency: DEFAULT_CURRENCY as Currency,
};

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DATA":
      return { ...state, ...action.payload };
    case "ADD_EXPENSE": {
      const e = action.payload;
      const categories = state.categories.map((c) =>
        c.id === e.category_id
          ? {
              ...c,
              spent: (c.spent ?? 0) + e.amount,
              expense_count: (c.expense_count ?? 0) + 1,
            }
          : c,
      );
      const total_spent = (state.summary?.total_spent ?? 0) + e.amount;
      const total_budget = state.summary?.total_budget ?? 0;
      const percentage_spent =
        total_budget > 0 ? parseFloat(((total_spent / total_budget) * 100).toFixed(2)) : 0;
      const total_remaining = total_budget - total_spent;
      return {
        ...state,
        expenses: [...state.expenses, e],
        categories,
        summary: {
          ...(state.summary as BudgetSummary),
          total_spent,
          percentage_spent,
          total_remaining,
        },
      };
    }
    case "DELETE_EXPENSE": {
      const expenseId = action.payload;
      const expense = state.expenses.find((x) => x.expense_id === expenseId);
      if (!expense) return state;
      const categories = state.categories.map((c) =>
        c.id === expense.category_id
          ? {
              ...c,
              spent: Math.max(0, (c.spent ?? 0) - expense.amount),
              expense_count: Math.max(0, (c.expense_count ?? 1) - 1),
            }
          : c,
      );
      const total_spent = Math.max(
        0,
        (state.summary?.total_spent ?? 0) - expense.amount,
      );
      const total_budget = state.summary?.total_budget ?? 0;
      const percentage_spent =
        total_budget > 0 ? parseFloat(((total_spent / total_budget) * 100).toFixed(2)) : 0;
      const total_remaining = total_budget - total_spent;
      return {
        ...state,
        expenses: state.expenses.filter((x) => x.expense_id !== expenseId),
        categories,
        summary: {
          ...(state.summary as BudgetSummary),
          total_spent,
          percentage_spent,
          total_remaining,
        },
      };
    }
    case "UPDATE_EXPENSE": {
      const { id, data } = action.payload;
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.expense_id === id ? { ...e, ...data } : e,
        ),
      };
    }
    case "ADD_CATEGORY": {
      const updatedCategories = [...state.categories, action.payload];
      const total_allocated = updatedCategories.reduce(
        (sum, c) => sum + (c.allocated ?? 0),
        0,
      );
      const total_budget = state.summary?.total_budget ?? 0;
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? parseFloat(((total_spent / total_budget) * 100).toFixed(2)) : 0;
      const total_remaining = total_budget - total_spent;

      return {
        ...state,
        categories: updatedCategories,
        summary: {
          ...(state.summary as BudgetSummary),
          total_allocated,
          percentage_spent,
          total_remaining,
        },
      };
    }
    case "UPDATE_CATEGORY": {
      const { id, data } = action.payload;
      const updatedCategories = state.categories.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      );

      // Recalculate total allocated from categories
      const total_allocated = updatedCategories.reduce(
        (sum, c) => sum + (c.allocated ?? 0),
        0,
      );
      const total_budget = state.summary?.total_budget ?? 0;
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? parseFloat(((total_spent / total_budget) * 100).toFixed(2)) : 0;
      const total_remaining = total_budget - total_spent;

      // Recalculate remaining for the updated category if it has spent amount
      const updatedCategoriesWithRemaining = updatedCategories.map((c) => ({
        ...c,
        remaining: (c.allocated ?? 0) - (c.spent ?? 0),
        percentage:
          total_allocated > 0
            ? parseFloat((((c.allocated ?? 0) / total_allocated) * 100).toFixed(2))
            : 0,
      }));

      return {
        ...state,
        categories: updatedCategoriesWithRemaining,
        summary: {
          ...(state.summary as BudgetSummary),
          total_allocated,
          percentage_spent,
          total_remaining,
        },
      };
    }
    case "DELETE_CATEGORY": {
      const updatedCategories = state.categories.filter(
        (c) => c.id !== action.payload,
      );
      const total_allocated = updatedCategories.reduce(
        (sum, c) => sum + (c.allocated ?? 0),
        0,
      );
      const total_budget = state.summary?.total_budget ?? 0;
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? parseFloat(((total_spent / total_budget) * 100).toFixed(2)) : 0;
      const total_remaining = total_budget - total_spent;

      return {
        ...state,
        categories: updatedCategories,
        summary: {
          ...(state.summary as BudgetSummary),
          total_allocated,
          percentage_spent,
          total_remaining,
        },
      };
    }
    case "UPDATE_BUDGET": {
      const total_budget = action.payload;
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? parseFloat(((total_spent / total_budget) * 100).toFixed(2)) : 0;
      const total_remaining = total_budget - total_spent;
      return {
        ...state,
        summary: {
          ...(state.summary as BudgetSummary),
          total_budget,
          percentage_spent,
          total_remaining,
        },
      };
    }
    default:
      return state;
  }
}

const BudgetContext = createContext<any>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = (selectedEvent as any)?.id ?? 1;
  const eventBudget = (selectedEvent as any)?.budget as number | undefined;

  const loadBudgetData = useCallback(async (eid: number, signal?: AbortSignal) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await BudgetService.getBudgetData(eid, signal);

      // Use the event's assigned budget as the source of truth for total_budget
      const totalBudget = eventBudget ?? data.summary.total_budget;
      const totalSpent = data.summary.total_spent;
      const totalRemaining = totalBudget - totalSpent;
      const percentageSpent = totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(2)) : 0;

      const budgetData: Partial<BudgetState> = {
        summary: {
          total_budget: totalBudget,
          total_allocated: data.summary.total_allocated ?? 0,
          total_spent: totalSpent,
          total_remaining: totalRemaining,
          percentage_spent: percentageSpent,
          status: data.summary.status as any,
          currency: data.budget.currency as Currency,
        },
        categories: data.categories.map((c) => ({
          id: c.category_id,
          catalog_id: (c as any).catalog_category_id,
          name: c.name,
          description: (c as any).description ?? "",
          budget_name: (c as any).budget_name ?? "",
          budget_notes: (c as any).budget_notes ?? "",
          allocated: c.allocated,
          spent: c.spent,
          remaining: c.remaining,
          percentage: c.percentage,
          expense_count: c.expense_count,
          color: c.color,
        })),
        expenses: data.expenses.map((e) => ({
          expense_id: e.expense_id,
          description: e.description,
          amount: e.amount,
          category_id: e.category_id,
          vendor_name: e.vendor_name,
          expense_date: e.expense_date,
          payment_status: e.payment_status,
          methodOfPayment: e.methodOfPayment ?? "",
          receipt_urls: e.receipt_url ? [e.receipt_url] : [],
        })),
        vendors: data.vendors.map((v) => ({
          vendor_id: v.vendor_id,
          name: v.name,
        })),
        currency: data.budget.currency as Currency,
      };

      dispatch({ type: "SET_DATA", payload: budgetData });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (err: any) {
      if (isAbortError(err)) return;
      if (err instanceof ApiError && err.status === 401) return;
      console.error("Failed to load budget data:", err);
      dispatch({
        type: "SET_ERROR",
        payload: err?.message ?? "Failed to load budget data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [eventBudget]);

  useEffect(() => {
    // Don't load until the selected event is available;
    // selectedEvent is intentionally not in deps — eventId and loadBudgetData
    // already change when selectedEvent transitions from null to an object.
    if (!selectedEvent) return;
    const controller = new AbortController();
    loadBudgetData(eventId, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, loadBudgetData]);

  const refreshData = () => loadBudgetData(eventId);

  const resolveVendorId = (vendorName?: string): string | undefined => {
    if (!vendorName) return undefined;
    const vendor = state.vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase(),
    );
    return vendor?.vendor_id;
  };

  const addExpense = (payload: Omit<Expense, "expense_id">) => {
    const expense: Expense = { ...payload, expense_id: generateId() };
    dispatch({ type: "ADD_EXPENSE", payload: expense });

    // Resolve catalog categoryId and vendor_id for the API
    const cat = state.categories.find((c) => c.id === payload.category_id);
    const apiPayload: Partial<Expense> & { currency?: string; vendor_id?: string } = {
      ...payload,
      ...(cat?.catalog_id ? { category_id: cat.catalog_id } : {}),
      vendor_id: resolveVendorId(payload.vendor_name),
    };

    BudgetService.createExpense(eventId, apiPayload).catch((err) =>
      console.error("createExpense failed:", err),
    );
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    dispatch({ type: "UPDATE_EXPENSE", payload: { id, data } });

    // Resolve catalog categoryId and vendor_id for the API
    const apiData: Partial<Expense> & { vendor_id?: string } = { ...data };
    if (data.category_id) {
      const cat = state.categories.find((c) => c.id === data.category_id);
      if (cat?.catalog_id) {
        apiData.category_id = cat.catalog_id;
      }
    }
    if (data.vendor_name !== undefined) {
      apiData.vendor_id = resolveVendorId(data.vendor_name);
    }

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
      .then(({ budgetId }) => {
        dispatch({
          type: "UPDATE_CATEGORY",
          payload: { id: category.id, data: { id: String(budgetId) } },
        });
      })
      .catch((err) => console.error("createCategory failed:", err));
  };

  const updateCategory = async (id: string, data: Partial<Category>): Promise<void> => {
    const current = state.categories.find((c) => c.id === id);
    if (!current) return;

    dispatch({ type: "UPDATE_CATEGORY", payload: { id, data } });

    const allocated = data.allocated ?? current.allocated;
    await BudgetService.updateCategory(id, {
      eventId,
      categoryId: Number(current.catalog_id),
      description: data.budget_name ?? current.budget_name ?? current.name,
      allocatedAmount: allocated,
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

  const updateBudget = (totalBudget: number) => {
    dispatch({ type: "UPDATE_BUDGET", payload: totalBudget });
    BudgetService.updateBudget(eventId, { total_budget: totalBudget }).catch((err) =>
      console.error("updateBudget failed:", err),
    );
  };

  const loadTemplate = (template: any) => {
    const totalBudget =
      template.total_budget ?? state.summary?.total_budget ?? 0;

    if (template.total_budget) {
      dispatch({ type: "UPDATE_BUDGET", payload: template.total_budget });
    }

    if (template.categories) {
      const existingByName = new Map<string, Category>();
      state.categories.forEach((c) => existingByName.set(c.name.trim().toLowerCase(), c));

      const mapped = template.categories.map((c: any) => {
        const key = (c.name || "").trim().toLowerCase();
        const existing = existingByName.get(key);
        const allocated = Math.round(((c.percentage ?? 0) * totalBudget) / 100);

        return {
          id: existing?.id ?? generateId(),
          name: c.name,
          allocated,
          // Preserve existing spent/expense_count when matching by name
          spent: existing?.spent ?? 0,
          expense_count: existing?.expense_count ?? 0,
          remaining: allocated - (existing?.spent ?? 0),
          percentage: c.percentage ?? 0,
          color: c.color ?? existing?.color,
        } as Category;
      });

      // Keep any existing categories not present in the template
      const templateNames = new Set(
        template.categories.map((c: any) => (c.name || "").trim().toLowerCase()),
      );
      const others = state.categories.filter(
        (c) => !templateNames.has(c.name.trim().toLowerCase()),
      );

      const combined = [...mapped, ...others];

      const total_allocated = combined.reduce((s, x) => s + (x.allocated ?? 0), 0);
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        totalBudget > 0 ? parseFloat(((total_spent / totalBudget) * 100).toFixed(2)) : 0;
      const total_remaining = totalBudget - total_spent;

      dispatch({
        type: "SET_DATA",
        payload: {
          categories: combined,
          summary: {
            ...(state.summary as BudgetSummary),
            total_allocated,
            percentage_spent,
            total_remaining,
            total_budget: totalBudget,
          },
        },
      });
    }
  };

  const loadEstimate = (estimate: any) => {
    const totalBudget =
      estimate.total_budget ?? state.summary?.total_budget ?? 0;

    if (estimate.total_budget) {
      dispatch({ type: "UPDATE_BUDGET", payload: estimate.total_budget });
    }

    if (estimate.categories) {
      const existingByName = new Map<string, Category>();
      state.categories.forEach((c) => existingByName.set(c.name.trim().toLowerCase(), c));

      const mapped = estimate.categories.map((c: any) => {
        const key = (c.name || "").trim().toLowerCase();
        const existing = existingByName.get(key);
        const allocated =
          typeof c.allocated === "number"
            ? Math.round(c.allocated)
            : Math.round(((c.percentage ?? 0) * totalBudget) / 100);

        const percentage =
          typeof c.percentage === "number"
            ? parseFloat((c.percentage).toFixed(2))
            : totalBudget > 0
            ? parseFloat(((allocated / totalBudget) * 100).toFixed(2))
            : 0;

        return {
          id: existing?.id ?? generateId(),
          name: c.name,
          allocated,
          spent: existing?.spent ?? (typeof c.spent === "number" ? c.spent : 0),
          expense_count: existing?.expense_count ?? 0,
          remaining: allocated - (existing?.spent ?? (c.spent ?? 0)),
          percentage,
          color: c.color ?? existing?.color,
        } as Category;
      });

      const templateNames = new Set(
        estimate.categories.map((c: any) => (c.name || "").trim().toLowerCase()),
      );
      const others = state.categories.filter(
        (c) => !templateNames.has(c.name.trim().toLowerCase()),
      );

      const combined = [...mapped, ...others];

      const total_allocated = combined.reduce((s, x) => s + (x.allocated ?? 0), 0);
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        totalBudget > 0 ? parseFloat(((total_spent / totalBudget) * 100).toFixed(2)) : 0;
      const total_remaining = totalBudget - total_spent;

      dispatch({
        type: "SET_DATA",
        payload: {
          categories: combined,
          summary: {
            ...(state.summary as BudgetSummary),
            total_allocated,
            percentage_spent,
            total_remaining,
            total_budget: totalBudget,
          },
        },
      });
    }
  };

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
