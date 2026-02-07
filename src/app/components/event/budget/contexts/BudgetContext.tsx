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
  BudgetSummary,
  Currency,
} from "../types/budget.types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CURRENCY,
} from "../constants/budget.constants";
import { BudgetService } from "../services/budget.service";

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
    total_spent: 0,
    total_remaining: 0,
    percentage_spent: 0,
    status: "not_started",
    currency: DEFAULT_CURRENCY as Currency,
  },
  categories: DEFAULT_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    allocated: 0,
    spent: 0,
    remaining: 0,
    color: c.color,
    expense_count: 0,
  })),
  expenses: [],
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
        total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
      const total_remaining = Math.max(0, total_budget - total_spent);
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
        total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
      const total_remaining = Math.max(0, total_budget - total_spent);
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
      const total_budget = updatedCategories.reduce(
        (sum, c) => sum + (c.allocated ?? 0),
        0,
      );
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
      const total_remaining = Math.max(0, total_budget - total_spent);

      return {
        ...state,
        categories: updatedCategories,
        summary: {
          ...(state.summary as BudgetSummary),
          total_budget,
          percentage_spent,
          total_remaining,
          total_allocated: total_budget,
        },
      };
    }
    case "UPDATE_CATEGORY": {
      const { id, data } = action.payload;
      const updatedCategories = state.categories.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      );

      // Recalculate total budget if allocated amount changed
      const total_budget = updatedCategories.reduce(
        (sum, c) => sum + (c.allocated ?? 0),
        0,
      );
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
      const total_remaining = Math.max(0, total_budget - total_spent);

      // Recalculate remaining for the updated category if it has spent amount
      const updatedCategoriesWithRemaining = updatedCategories.map((c) => ({
        ...c,
        remaining: (c.allocated ?? 0) - (c.spent ?? 0),
        percentage:
          total_budget > 0
            ? Math.round(((c.allocated ?? 0) / total_budget) * 100)
            : 0,
      }));

      return {
        ...state,
        categories: updatedCategoriesWithRemaining,
        summary: {
          ...(state.summary as BudgetSummary),
          total_budget,
          percentage_spent,
          total_remaining,
          total_allocated: total_budget,
        },
      };
    }
    case "DELETE_CATEGORY": {
      const updatedCategories = state.categories.filter(
        (c) => c.id !== action.payload,
      );
      const total_budget = updatedCategories.reduce(
        (sum, c) => sum + (c.allocated ?? 0),
        0,
      );
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
      const total_remaining = Math.max(0, total_budget - total_spent);

      return {
        ...state,
        categories: updatedCategories,
        summary: {
          ...(state.summary as BudgetSummary),
          total_budget,
          percentage_spent,
          total_remaining,
          total_allocated: total_budget,
        },
      };
    }
    case "UPDATE_BUDGET": {
      const total_budget = action.payload;
      const total_spent = state.summary?.total_spent ?? 0;
      const percentage_spent =
        total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
      const total_remaining = Math.max(0, total_budget - total_spent);
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

  const loadBudgetData = useCallback(async (eventId?: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // Use the budget service to fetch data
      const data = await BudgetService.getBudgetData(eventId || "event_001");

      const budgetData: Partial<BudgetState> = {
        summary: data.summary,
        categories: data.categories.map((c) => ({
          id: c.category_id,
          name: c.name,
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
          receipt_urls: e.receipt_url ? [e.receipt_url] : [],
        })),
        currency: data.budget.currency as Currency,
      };

      dispatch({ type: "SET_DATA", payload: budgetData });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (err: any) {
      console.error("Failed to load budget data:", err);
      dispatch({
        type: "SET_ERROR",
        payload: err?.message ?? "Failed to load budget data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const refreshData = () => loadBudgetData();

  const addExpense = (payload: Omit<Expense, "expense_id">) => {
    const expense: Expense = { ...payload, expense_id: generateId() };
    dispatch({ type: "ADD_EXPENSE", payload: expense });
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    dispatch({ type: "UPDATE_EXPENSE", payload: { id, data } });
  };

  const deleteExpense = (expenseId: string) => {
    dispatch({ type: "DELETE_EXPENSE", payload: expenseId });
  };

  const addCategory = (category: Category) => {
    dispatch({ type: "ADD_CATEGORY", payload: category });
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    dispatch({ type: "UPDATE_CATEGORY", payload: { id, data } });
  };

  const deleteCategory = (categoryId: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: categoryId });
  };

  const updateBudget = (totalBudget: number) => {
    dispatch({ type: "UPDATE_BUDGET", payload: totalBudget });
  };

  const loadTemplate = (template: any) => {
    if (template.total_budget) {
      dispatch({ type: "UPDATE_BUDGET", payload: template.total_budget });
    }
    if (template.categories) {
      dispatch({
        type: "SET_DATA",
        payload: { categories: template.categories },
      });
    }
  };

  const loadEstimate = (estimate: any) => {
    if (estimate.total_budget) {
      dispatch({ type: "UPDATE_BUDGET", payload: estimate.total_budget });
    }
    if (estimate.categories) {
      dispatch({
        type: "SET_DATA",
        payload: { categories: estimate.categories },
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
