import type { BudgetAction, BudgetState, BudgetSummary, Category, Expense } from '../models/budget.models';
import { computeSpentSummary, computeAllocatedTotal } from './budget.utils';

const withSpentUpdate = (state: BudgetState, totalSpent: number): BudgetState => ({
  ...state,
  summary: {
    ...(state.summary as BudgetSummary),
    total_spent: totalSpent,
    ...computeSpentSummary(state.summary?.total_budget ?? 0, totalSpent),
  },
});

const withAllocatedUpdate = (state: BudgetState, categories: Category[]): BudgetState => ({
  ...state,
  categories,
  summary: {
    ...(state.summary as BudgetSummary),
    total_allocated: computeAllocatedTotal(categories),
    ...computeSpentSummary(state.summary?.total_budget ?? 0, state.summary?.total_spent ?? 0),
  },
});

export const handleAddExpense = (state: BudgetState, e: Expense): BudgetState => {
  const amountDelta = e.payment_status === 'paid' ? e.amount : 0;
  const categories = state.categories.map((c) =>
    c.id === e.category_id
      ? { ...c, spent: (c.spent ?? 0) + amountDelta, expense_count: (c.expense_count ?? 0) + 1 }
      : c,
  );
  const totalSpent = (state.summary?.total_spent ?? 0) + amountDelta;
  return { ...withSpentUpdate(state, totalSpent), expenses: [...state.expenses, e], categories };
};

export const handleDeleteExpense = (state: BudgetState, expenseId: string): BudgetState => {
  const expense = state.expenses.find((x) => x.expense_id === expenseId);
  if (!expense) return state;
  const amountDelta = expense.payment_status === 'paid' ? expense.amount : 0;
  const categories = state.categories.map((c) =>
    c.id === expense.category_id
      ? {
          ...c,
          spent: Math.max(0, (c.spent ?? 0) - amountDelta),
          expense_count: Math.max(0, (c.expense_count ?? 1) - 1),
        }
      : c,
  );
  const totalSpent = Math.max(0, (state.summary?.total_spent ?? 0) - amountDelta);
  return {
    ...withSpentUpdate(state, totalSpent),
    expenses: state.expenses.filter((x) => x.expense_id !== expenseId),
    categories,
  };
};

export const handleUpdateExpense = (
  state: BudgetState,
  id: string,
  data: Partial<Expense>,
): BudgetState => {
  const prev = state.expenses.find((e) => e.expense_id === id);
  const updated = prev ? { ...prev, ...data } : null;
  let totalSpent = state.summary?.total_spent ?? 0;
  if (prev && updated && (data.payment_status !== undefined || data.amount !== undefined)) {
    if (prev.payment_status === 'paid') totalSpent = Math.max(0, totalSpent - prev.amount);
    if (updated.payment_status === 'paid') totalSpent += updated.amount;
  }
  return {
    ...withSpentUpdate(state, totalSpent),
    expenses: state.expenses.map((e) => (e.expense_id === id ? { ...e, ...data } : e)),
  };
};

export const handleAddCategory = (state: BudgetState, category: Category): BudgetState =>
  withAllocatedUpdate(state, [...state.categories, category]);

export const handleDeleteCategory = (state: BudgetState, categoryId: string): BudgetState =>
  withAllocatedUpdate(
    state,
    state.categories.filter((c) => c.id !== categoryId),
  );

export const handleUpdateCategory = (
  state: BudgetState,
  id: string,
  data: Partial<Category>,
): BudgetState => {
  const updated = state.categories.map((c) => (c.id === id ? { ...c, ...data } : c));
  const total_allocated = computeAllocatedTotal(updated);
  const withRemaining = updated.map((c) => ({
    ...c,
    remaining: (c.allocated ?? 0) - (c.spent ?? 0),
    percentage:
      total_allocated > 0
        ? Number.parseFloat((((c.allocated ?? 0) / total_allocated) * 100).toFixed(2))
        : 0,
  }));
  return {
    ...state,
    categories: withRemaining,
    summary: {
      ...(state.summary as BudgetSummary),
      total_allocated,
      ...computeSpentSummary(state.summary?.total_budget ?? 0, state.summary?.total_spent ?? 0),
    },
  };
};

export const handleUpdateBudget = (state: BudgetState, totalBudget: number): BudgetState => ({
  ...state,
  summary: {
    ...(state.summary as BudgetSummary),
    total_budget: totalBudget,
    ...computeSpentSummary(totalBudget, state.summary?.total_spent ?? 0),
  },
});

export const budgetReducer = (state: BudgetState, action: BudgetAction): BudgetState => {
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
};

