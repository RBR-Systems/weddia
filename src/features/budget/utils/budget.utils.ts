import { getRandomId } from '@/shared/utils/rng';
import type { BudgetSummary, Category, Currency } from '../models/budget.models';
import type { BudgetDataAPI } from '../models/api.models';

export const generateBudgetId = (): string => getRandomId('id_');

export const computeSpentSummary = (
  totalBudget: number,
  totalSpent: number,
): Pick<BudgetSummary, 'percentage_spent' | 'total_remaining'> => ({
  percentage_spent:
    totalBudget > 0
      ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(2))
      : 0,
  total_remaining: totalBudget - totalSpent,
});

export const computeAllocatedTotal = (categories: Category[]): number =>
  categories.reduce((sum, c) => sum + (c.allocated ?? 0), 0);

export interface TemplateCategoryRaw {
  name: string;
  percentage?: number;
  allocated?: number;
  spent?: number;
  color?: string;
}

export const mergeTemplateCategories = (
  templateCats: TemplateCategoryRaw[],
  existingCats: Category[],
  buildCategory: (raw: TemplateCategoryRaw, match: Category | undefined) => Category,
): Category[] => {
  const existingByName = new Map(
    existingCats.map((c) => [c.name.trim().toLowerCase(), c]),
  );
  const templateNames = new Set(
    templateCats.map((c) => (c.name || '').trim().toLowerCase()),
  );
  const mapped = templateCats.map((c) =>
    buildCategory(c, existingByName.get((c.name || '').trim().toLowerCase())),
  );
  const others = existingCats.filter(
    (c) => !templateNames.has(c.name.trim().toLowerCase()),
  );
  return [...mapped, ...others];
};

export const mapApiDataToBudgetState = (
  data: BudgetDataAPI,
  eventBudget?: number,
) => {
  const totalBudget = eventBudget ?? data.summary.total_budget;
  const totalSpent = data.summary.total_spent;

  return {
    summary: {
      total_budget: totalBudget,
      total_allocated: data.summary.total_allocated ?? 0,
      total_spent: totalSpent,
      ...computeSpentSummary(totalBudget, totalSpent),
      status: data.summary.status,
      currency: data.budget.currency as Currency,
    },
    categories: data.categories.map((c) => ({
      id: c.category_id,
      catalog_id: (c as any).catalog_category_id,
      name: c.name,
      description: (c as any).description ?? '',
      budget_name: (c as any).budget_name ?? '',
      budget_notes: (c as any).budget_notes ?? '',
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
      methodOfPayment: e.methodOfPayment ?? '',
      receipt_url: e.receipt_url ?? null,
      receipt_urls: e.receipt_url ? [e.receipt_url] : [],
    })),
    vendors: data.vendors.map((v) => ({
      vendor_id: v.vendor_id,
      name: v.name,
      category: v.category ?? '',
      contact_name: v.contact_person ?? '',
      email: v.email ?? '',
      phone: v.phone ?? '',
      address: v.address ?? '',
      notes: v.notes ?? '',
      rating: v.rating ?? 0,
      is_active: v.is_active ?? true,
      total_spent: v.total_spent ?? 0,
      expense_count: v.expense_count ?? 0,
    })),
    currency: data.budget.currency as Currency,
  };
};
