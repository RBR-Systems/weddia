import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import type { BudgetItem } from "../models/budget.models";
import type { ApiBudgetItem } from "../models/apiRaw.models";
import { ADMIN_QUERY_PARAM } from "../constants/budget.constants";

function toOptionalStringId(value: number | null | undefined): string | undefined {
  return value == null ? undefined : String(value);
}

function toOptionalNumberId(value: string | null | undefined): number | undefined {
  return value == null ? undefined : Number(value);
}

function mapBudgetItem(i: ApiBudgetItem): BudgetItem {
  return {
    item_id:     String(i.budgetItemId),
    budget_id:   String(i.budgetId),
    category_id: toOptionalStringId(i.categoryId),
    description: i.description,
    amount:      i.amount,
    notes:       i.notes ?? "",
  };
}

export async function getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
  const items = await apiGet<ApiBudgetItem[]>(
    `/api/budgetitems/budget/${budgetId}`,
    { silent401: true },
  );
  return items.map(mapBudgetItem);
}

export async function createBudgetItem(
  budgetId: string,
  data: { description: string; amount: number; notes?: string; category_id?: string },
): Promise<BudgetItem> {
  const item = await apiPost<ApiBudgetItem>(
    `/api/budgetitems?${ADMIN_QUERY_PARAM}`,
    {
      budgetId:    Number(budgetId),
      categoryId:  toOptionalNumberId(data.category_id),
      description: data.description,
      amount:      data.amount,
      notes:       data.notes ?? "",
    },
    { silent401: true },
  );
  return mapBudgetItem(item);
}

export async function updateBudgetItem(
  itemId: string,
  data: { description?: string; amount?: number; notes?: string; category_id?: string },
): Promise<void> {
  await apiPut(
    `/api/budgetitems/${itemId}?${ADMIN_QUERY_PARAM}`,
    {
      ...data,
      categoryId: toOptionalNumberId(data.category_id),
      category_id: undefined,
    },
    { silent401: true },
  );
}

export async function deleteBudgetItem(itemId: string): Promise<void> {
  await apiDelete(`/api/budgetitems/${itemId}`, { silent401: true });
}
