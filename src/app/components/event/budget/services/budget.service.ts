import type { BudgetDataAPI } from "../types/api.types";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

// Palette used for category colors (cycles if more than array length)
const CATEGORY_COLORS = [
  "#4A90E2", "#7ED321", "#F5A623", "#D0021B", "#9013FE",
  "#50E3C2", "#B8E986", "#BD10E0", "#417505", "#F8E71C",
];

// ─── Raw API shapes ──────────────────────────────────────────────────────────

interface ApiCategory { categoryId: number; name: string; description?: string }
interface ApiBudget {
  budgetId: number; eventId: number; categoryId: number;
  description: string; allocatedAmount: number; spentAmount: number;
  remainingAmount: number; currency: string; notes?: string;
}
interface ApiExpense {
  expenseId: number; eventId: number; vendorId?: number | null;
  categoryId: number; description: string; amount: number;
  expenseDate: string; notes?: string; currency: string; receiptUrl?: string | null;
}
interface ApiVendor {
  vendorId: number; vendorName: string; category: string;
  contactPerson?: string; email?: string; mobilePhone?: string;
  phone?: string; address?: string; notes?: string; rating: number; isActive: boolean;
}

// ─── Fetch + assemble ────────────────────────────────────────────────────────

export class BudgetService {
  static async getBudgetData(eventId: number): Promise<BudgetDataAPI> {
    const [budgets, expenses, categories, vendors] = await Promise.all([
      apiGet<ApiBudget[]>(`/api/budgets/event/${eventId}`),
      apiGet<ApiExpense[]>(`/api/expenses/event/${eventId}`),
      apiGet<ApiCategory[]>("/api/categoriesexpensebudget"),
      apiGet<ApiVendor[]>("/api/vendors"),
    ]);

    const categoryMap = new Map<number, ApiCategory>(
      categories.map((c) => [c.categoryId, c]),
    );
    const vendorMap = new Map<number, ApiVendor>(
      vendors.map((v) => [v.vendorId, v]),
    );

    // Build category stats from budgets + expenses
    const spentPerCategory = new Map<number, number>();
    const expenseCountPerCategory = new Map<number, number>();
    for (const e of expenses) {
      spentPerCategory.set(e.categoryId, (spentPerCategory.get(e.categoryId) ?? 0) + e.amount);
      expenseCountPerCategory.set(e.categoryId, (expenseCountPerCategory.get(e.categoryId) ?? 0) + 1);
    }

    const totalBudget = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
    const totalAllocated = totalBudget;
    const totalRemaining = totalBudget - totalSpent;
    const currency = budgets[0]?.currency ?? "USD";

    const mappedCategories = budgets.map((b, i) => {
      const cat = categoryMap.get(b.categoryId);
      const spent = spentPerCategory.get(b.categoryId) ?? b.spentAmount;
      const expCount = expenseCountPerCategory.get(b.categoryId) ?? 0;
      return {
        category_id: String(b.budgetId),
        name: cat?.name ?? b.description,
        description: cat?.description ?? "",
        allocated: b.allocatedAmount,
        spent,
        remaining: b.allocatedAmount - spent,
        percentage: totalBudget > 0 ? (b.allocatedAmount / totalBudget) * 100 : 0,
        percentage_of_spent: b.allocatedAmount > 0 ? (spent / b.allocatedAmount) * 100 : 0,
        expense_count: expCount,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const mappedExpenses = expenses.map((e) => {
      const vendor = e.vendorId ? vendorMap.get(e.vendorId) : undefined;
      // Find which budget entry corresponds to this categoryId to get budget_id as category_id
      const budget = budgets.find((b) => b.categoryId === e.categoryId);
      return {
        expense_id: String(e.expenseId),
        event_id: String(e.eventId),
        category_id: String(budget?.budgetId ?? e.categoryId),
        vendor_id: e.vendorId ? String(e.vendorId) : null,
        vendor_name: vendor?.vendorName ?? "",
        description: e.description,
        amount: e.amount,
        expense_date: e.expenseDate,
        payment_status: "paid" as const,
        methodOfPayment: "",
        currency: e.currency ?? currency,
        notes: e.notes ?? "",
        receipt_url: e.receiptUrl ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const mappedVendors = vendors.map((v) => ({
      vendor_id: String(v.vendorId),
      name: v.vendorName,
      category: v.category,
      contact_person: v.contactPerson ?? "",
      email: v.email ?? "",
      phone: v.mobilePhone ?? v.phone ?? "",
      address: v.address ?? "",
      notes: v.notes ?? "",
      rating: v.rating,
      is_active: v.isActive,
      total_spent: expenses
        .filter((e) => e.vendorId === v.vendorId)
        .reduce((s, e) => s + e.amount, 0),
      expense_count: expenses.filter((e) => e.vendorId === v.vendorId).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const pctSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const status =
      pctSpent >= 100 ? "over_budget" :
      pctSpent >= 80  ? "at_risk"     :
      totalSpent === 0 ? "not_started" : "on_track";

    return {
      event_id: String(eventId),
      event_name: "",
      budget: {
        budget_id: String(eventId),
        event_id: String(eventId),
        currency,
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      summary: {
        total_budget: totalBudget,
        total_allocated: totalAllocated,
        total_spent: totalSpent,
        total_remaining: totalRemaining,
        percentage_spent: pctSpent,
        percentage_allocated: 100,
        status,
        currency,
        expense_count: expenses.length,
        vendor_count: vendors.length,
        paid_count: expenses.length,
        pending_count: 0,
        overdue_count: 0,
      },
      categories: mappedCategories,
      expenses: mappedExpenses,
      vendors: mappedVendors,
      budget_items: [],
      payment_schedule: [],
      analytics: {
        spending_by_month: [],
        top_vendors: [],
        payment_status_breakdown: {
          paid: { count: expenses.length, total: totalSpent, percentage: 100 },
          pending: { count: 0, total: 0, percentage: 0 },
          overdue: { count: 0, total: 0, percentage: 0 },
          partial: { count: 0, total: 0, percentage: 0 },
        },
        category_trends: {
          most_spent: mappedCategories[0]?.name ?? "",
          most_remaining: "",
          on_budget_count: mappedCategories.length,
          over_budget_count: 0,
          under_budget_count: 0,
        },
      },
    };
  }

  static async createExpense(eventId: number, expenseData: any): Promise<void> {
    await apiPost(`/api/expenses?adminId=1`, {
      eventId,
      vendorId: expenseData.vendor_id ? Number(expenseData.vendor_id) : null,
      categoryId: Number(expenseData.category_id),
      description: expenseData.description,
      amount: expenseData.amount,
      expenseDate: expenseData.expense_date,
      currency: expenseData.currency ?? "USD",
      notes: expenseData.notes,
    });
  }

  static async updateExpense(eventId: number, expenseId: string, updates: any): Promise<void> {
    await apiPut(`/api/expenses/${expenseId}?adminId=1`, updates);
  }

  static async deleteExpense(eventId: number, expenseId: string): Promise<void> {
    await apiDelete(`/api/expenses/${expenseId}`);
  }

  static async updateBudget(eventId: number, updates: any): Promise<void> {
    await apiPut(`/api/events/${eventId}?adminId=1`, { budget: updates.total_budget });
  }

  /** budgetId = the category_id stored in the frontend (mapped from budgetId) */
  static async updateCategory(budgetId: string, updates: { name?: string; allocated?: number; color?: string }): Promise<void> {
    if (updates.allocated !== undefined) {
      await apiPut(`/api/budgets/${budgetId}?adminId=1`, {
        allocatedAmount: updates.allocated,
      });
    }
  }

  static async deleteCategory(budgetId: string): Promise<void> {
    await apiDelete(`/api/budgets/${budgetId}`);
  }

  static async createCategory(eventId: number, category: { name: string; description?: string; allocated: number; currency?: string }): Promise<{ budgetId: number; categoryId: number }> {
    // Step 1: create the global category definition
    const cat = await apiPost<{ categoryId: number }>(`/api/categoriesexpensebudget?adminId=1`, {
      name: category.name,
      description: category.description ?? "",
    });
    // Step 2: create a budget entry linking this category to the event
    const budget = await apiPost<{ budgetId: number }>(`/api/budgets?adminId=1`, {
      eventId,
      categoryId: cat.categoryId,
      description: category.name,
      allocatedAmount: category.allocated,
      spentAmount: 0,
      currency: category.currency ?? "USD",
    });
    return { budgetId: budget.budgetId, categoryId: cat.categoryId };
  }
}
