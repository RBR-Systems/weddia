import type { ActivityItem, ActivityType, BudgetAction, BudgetState, BudgetSummary, Category, Expense } from '../models/budget.models';
import { computeSpentSummary, computeAllocatedTotal } from './budget.utils';

let _activitySeq = 0;
const makeActivity = (
  type: ActivityType,
  description: string,
  amount?: number,
): ActivityItem => ({
  id: `act_${Date.now()}_${++_activitySeq}`,
  type,
  description,
  amount,
  timestamp: new Date().toISOString(),
});

const prependActivity = (state: BudgetState, entry: ActivityItem): ActivityItem[] =>
  [entry, ...state.activities];

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
  const activity = makeActivity('expense_added', e.description, e.amount);
  return {
    ...withSpentUpdate(state, totalSpent),
    expenses: [...state.expenses, e],
    categories,
    activities: prependActivity(state, activity),
  };
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
  const activity = makeActivity('expense_deleted', expense.description, expense.amount);
  return {
    ...withSpentUpdate(state, totalSpent),
    expenses: state.expenses.filter((x) => x.expense_id !== expenseId),
    categories,
    activities: prependActivity(state, activity),
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

  // Only log user-driven updates, not server ID patches (expense_id-only updates)
  const userFields = ['description', 'amount', 'payment_status', 'category_id', 'vendor_name', 'notes', 'expense_date', 'methodOfPayment'] as const;
  const isUserAction = userFields.some((f) => f in data);
  let activities = state.activities;
  if (isUserAction && prev) {
    const type: ActivityType = data.payment_status === 'paid' ? 'payment_made' : 'expense_edited';
    const description = updated?.description ?? prev.description;
    const amount = updated?.amount ?? prev.amount;
    activities = prependActivity(state, makeActivity(type, description, amount));
  }

  return {
    ...withSpentUpdate(state, totalSpent),
    expenses: state.expenses.map((e) => (e.expense_id === id ? { ...e, ...data } : e)),
    activities,
  };
};

export const handleAddCategory = (state: BudgetState, category: Category): BudgetState => {
  const next = withAllocatedUpdate(state, [...state.categories, category]);
  return {
    ...next,
    activities: prependActivity(state, makeActivity('category_updated', category.budget_name ?? category.name)),
  };
};

export const handleDeleteCategory = (state: BudgetState, categoryId: string): BudgetState => {
  const cat = state.categories.find((c) => c.id === categoryId);
  const next = withAllocatedUpdate(state, state.categories.filter((c) => c.id !== categoryId));
  return {
    ...next,
    activities: cat
      ? prependActivity(state, makeActivity('category_updated', cat.budget_name ?? cat.name))
      : next.activities,
  };
};

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

  // Only log user-driven updates, not server ID patches
  const userFields: (keyof Category)[] = ['name', 'budget_name', 'budget_notes', 'allocated', 'color'];
  const isUserAction = userFields.some((f) => f in data);
  const cat = state.categories.find((c) => c.id === id);
  let activities = state.activities;
  if (isUserAction && cat) {
    const label = (data.budget_name ?? data.name ?? cat.budget_name ?? cat.name) as string;
    activities = prependActivity(state, makeActivity('category_updated', label));
  }

  return {
    ...state,
    categories: withRemaining,
    summary: {
      ...(state.summary as BudgetSummary),
      total_allocated,
      ...computeSpentSummary(state.summary?.total_budget ?? 0, state.summary?.total_spent ?? 0),
    },
    activities,
  };
};

export const handleUpdateBudget = (state: BudgetState, totalBudget: number): BudgetState => {
  const prev = state.summary?.total_budget ?? 0;
  const activity = makeActivity(
    'budget_updated',
    `Budget updated: $${prev.toLocaleString()} → $${totalBudget.toLocaleString()}`,
  );
  return {
    ...state,
    summary: {
      ...(state.summary as BudgetSummary),
      total_budget: totalBudget,
      ...computeSpentSummary(totalBudget, state.summary?.total_spent ?? 0),
    },
    activities: prependActivity(state, activity),
  };
};

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
    case "SET_VENDOR_EVENTS":    return { ...state, vendorEvents: action.payload };
    case "ASSIGN_VENDOR_EVENT":  return { ...state, vendorEvents: [...state.vendorEvents, action.payload] };
    case "UNASSIGN_VENDOR_EVENT": return { ...state, vendorEvents: state.vendorEvents.filter((ve) => ve.vendor_id !== action.payload) };
    case "UPDATE_VENDOR_EVENT":  return { ...state, vendorEvents: state.vendorEvents.map((ve) => ve.vendor_id === action.payload.vendor_id ? { ...ve, ...action.payload.data } : ve) };
    default:                     return state;
  }
};

