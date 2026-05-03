import type { BudgetDataAPI } from "../models/api.models";
import type { ApiBudget, ApiExpense, ApiCategory, ApiVendor, ApiVendorEvent } from "../models/apiRaw.models";
import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import { ADMIN_QUERY_PARAM, DEFAULT_CURRENCY } from "../constants/budget.constants";
import { mapRawToBudgetData } from "../utils/budgetMapper.utils";

export async function getBudgetData(eventId: number, signal?: AbortSignal): Promise<BudgetDataAPI> {
  const [budgets, expenses, categories, vendors, vendorEvents] = await Promise.all([
    apiGet<ApiBudget[]>(`/api/budgets/event/${eventId}`, { signal }),
    apiGet<ApiExpense[]>(`/api/expenses/event/${eventId}`, { signal }),
    apiGet<ApiCategory[]>("/api/categoriesexpensebudget", { signal }),
    apiGet<ApiVendor[]>("/api/vendors", { signal }),
    apiGet<ApiVendorEvent[]>(`/api/vendors-events/event/${eventId}`, { signal }).catch(() => [] as ApiVendorEvent[]),
  ]);

  return mapRawToBudgetData({ eventId, budgets, expenses, categories, vendors, vendorEvents });
}

export async function updateBudget(eventId: number, updates: { total_budget: number }): Promise<void> {
  await apiPut(`/api/events/${eventId}?${ADMIN_QUERY_PARAM}`, { budget: updates.total_budget });
}

export async function createCategory(
  eventId: number,
  category: { catalogCategoryId: string; budget_name: string; budget_notes?: string; allocated: number; currency?: string },
): Promise<{ budgetId: number }> {
  const budget = await apiPost<{ budgetId: number }>(`/api/budgets?${ADMIN_QUERY_PARAM}`, {
    eventId,
    categoryId:      Number(category.catalogCategoryId),
    description:     category.budget_name,
    notes:           category.budget_notes ?? "",
    allocatedAmount: category.allocated,
    spentAmount:     0,
    currency:        category.currency ?? DEFAULT_CURRENCY,
  });
  return { budgetId: budget.budgetId };
}

export async function updateCategory(
  budgetId: string,
  fullBody: {
    eventId: number;
    categoryId: number;
    description: string;
    allocatedAmount: number;
    spentAmount: number;
    currency: string;
    notes?: string;
  },
): Promise<void> {
  await apiPut(`/api/budgets/${budgetId}?${ADMIN_QUERY_PARAM}`, fullBody);
}

export async function deleteCategory(budgetId: string): Promise<void> {
  await apiDelete(`/api/budgets/${budgetId}`);
}


