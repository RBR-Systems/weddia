import type { BudgetDataAPI } from "../models/api.models";
import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";

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
  remainingAmount: number; currency: string; notes?: string | null;
}
interface ApiExpense {
  expenseId: number; eventId: number; vendorId?: number | null;
  categoryId: number; description: string; amount: number;
  expenseDate: string; notes?: string; currency: string; receiptUrl?: string | null;
  paymentStatus?: string | null; methodOfPayment?: string | null;
}
interface ApiVendor {
  vendorId: number; vendorName: string; category: string;
  contactPerson?: string; email?: string; mobilePhone?: string;
  phone?: string; address?: string; notes?: string; rating: number; isActive: boolean;
}

// ─── Fetch + assemble ────────────────────────────────────────────────────────

export class BudgetService {
  static async getBudgetData(eventId: number, signal?: AbortSignal): Promise<BudgetDataAPI> {
    const [budgets, expenses, categories, vendors] = await Promise.all([
      apiGet<ApiBudget[]>(`/api/budgets/event/${eventId}`, { signal }),
      apiGet<ApiExpense[]>(`/api/expenses/event/${eventId}`, { signal }),
      apiGet<ApiCategory[]>("/api/categoriesexpensebudget", { signal }),
      apiGet<ApiVendor[]>("/api/vendors", { signal }),
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
      if (e.paymentStatus === "paid") {
        spentPerCategory.set(e.categoryId, (spentPerCategory.get(e.categoryId) ?? 0) + e.amount);
      }
      expenseCountPerCategory.set(e.categoryId, (expenseCountPerCategory.get(e.categoryId) ?? 0) + 1);
    }

    const totalBudget = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = expenses.filter((e) => e.paymentStatus === "paid").reduce((s, e) => s + e.amount, 0);
    const totalAllocated = totalBudget;
    const totalRemaining = totalBudget - totalSpent;
    const currency = budgets[0]?.currency ?? "USD";

    const mappedCategories = budgets.map((b, i) => {
      const cat = categoryMap.get(b.categoryId);
      const spent = spentPerCategory.get(b.categoryId) ?? b.spentAmount;
      const expCount = expenseCountPerCategory.get(b.categoryId) ?? 0;
      return {
        category_id: String(b.budgetId),
        catalog_category_id: String(b.categoryId),
        name: cat?.name ?? b.description,
        description: cat?.description ?? "",
        budget_name: b.description ?? "",
        budget_notes: b.notes ?? "",
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
        payment_status: (e.paymentStatus ?? "pending") as import("../models/budget.models").PaymentStatus,
        methodOfPayment: e.methodOfPayment ?? "",
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
        .filter((e) => e.vendorId === v.vendorId && e.paymentStatus === "paid")
        .reduce((s, e) => s + e.amount, 0),
      expense_count: expenses.filter((e) => e.vendorId === v.vendorId).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const pctSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    let status: string;
    if (pctSpent >= 100) {
      status = "over_budget";
    } else if (pctSpent >= 80) {
      status = "at_risk";
    } else if (totalSpent === 0) {
      status = "not_started";
    } else {
      status = "on_track";
    }

    const paidExpenses    = expenses.filter((e) => e.paymentStatus === "paid");
    const pendingExpenses = expenses.filter((e) => e.paymentStatus === "pending" || !e.paymentStatus);
    const overdueExpenses = expenses.filter((e) => e.paymentStatus === "overdue");
    const partialExpenses = expenses.filter((e) => e.paymentStatus === "partial");

    const sumAmount = (list: ApiExpense[]) => list.reduce((s, e) => s + e.amount, 0);

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
        paid_count:    paidExpenses.length,
        pending_count: pendingExpenses.length,
        overdue_count: overdueExpenses.length,
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
          paid:    { count: paidExpenses.length,    total: sumAmount(paidExpenses),    percentage: totalSpent > 0 ? (sumAmount(paidExpenses)    / totalSpent) * 100 : 0 },
          pending: { count: pendingExpenses.length, total: sumAmount(pendingExpenses), percentage: totalSpent > 0 ? (sumAmount(pendingExpenses) / totalSpent) * 100 : 0 },
          overdue: { count: overdueExpenses.length, total: sumAmount(overdueExpenses), percentage: totalSpent > 0 ? (sumAmount(overdueExpenses) / totalSpent) * 100 : 0 },
          partial: { count: partialExpenses.length, total: sumAmount(partialExpenses), percentage: totalSpent > 0 ? (sumAmount(partialExpenses) / totalSpent) * 100 : 0 },
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

  static async createExpense(eventId: number, expenseData: Partial<import("../models/budget.models").Expense> & { currency?: string; vendor_id?: string }): Promise<void> {
    await apiPost(`/api/expenses?adminId=1`, {
      eventId,
      vendorId:        expenseData.vendor_id ? Number(expenseData.vendor_id) : null,
      categoryId:      Number(expenseData.category_id),
      description:     expenseData.description,
      amount:          expenseData.amount,
      expenseDate:     expenseData.expense_date,
      currency:        expenseData.currency ?? "USD",
      notes:           expenseData.notes,
      paymentStatus:   expenseData.payment_status,
      methodOfPayment: expenseData.methodOfPayment,
      receiptUrl:      expenseData.receipt_url ?? null,
    });
  }

  static async updateExpense(_eventId: number, expenseId: string, updates: Partial<import("../models/budget.models").Expense> & { vendor_id?: string }): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.description  !== undefined) body.description     = updates.description;
    if (updates.amount       !== undefined) body.amount          = updates.amount;
    if (updates.category_id  !== undefined) body.categoryId      = Number(updates.category_id);
    if (updates.vendor_id    !== undefined) body.vendorId        = updates.vendor_id ? Number(updates.vendor_id) : null;
    if (updates.expense_date !== undefined) body.expenseDate     = updates.expense_date;
    if (updates.notes        !== undefined) body.notes           = updates.notes;
    if (updates.currency     !== undefined) body.currency        = updates.currency;
    if (updates.payment_status  !== undefined) body.paymentStatus   = updates.payment_status;
    if (updates.methodOfPayment !== undefined) body.methodOfPayment = updates.methodOfPayment;
    if (updates.receipt_url     !== undefined) body.receiptUrl      = updates.receipt_url ?? null;
    await apiPut(`/api/expenses/${expenseId}?adminId=1`, body);
  }

  static async deleteExpense(eventId: number, expenseId: string): Promise<void> {
    await apiDelete(`/api/expenses/${expenseId}`);
  }

  static async updateBudget(eventId: number, updates: any): Promise<void> {
    await apiPut(`/api/events/${eventId}?adminId=1`, { budget: updates.total_budget });
  }

  /** budgetId = the category_id stored in the frontend (mapped from budgetId) */
  static async updateCategory(
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
    await apiPut(`/api/budgets/${budgetId}?adminId=1`, fullBody);
  }

  static async deleteCategory(budgetId: string): Promise<void> {
    await apiDelete(`/api/budgets/${budgetId}`);
  }

  // ─── Budget Items ────────────────────────────────────────────────────────────

  static async getBudgetItems(budgetId: string): Promise<import("../models/budget.models").BudgetItem[]> {
    interface ApiBudgetItem {
      budgetItemId: number; budgetId: number; categoryId?: number | null;
      description: string; amount: number; notes?: string | null;
    }
    const items = await apiGet<ApiBudgetItem[]>(`/api/budgetitems/budget/${budgetId}`, { silent401: true });
    return items.map((i) => ({
      item_id: String(i.budgetItemId),
      budget_id: String(i.budgetId),
      category_id: (i.categoryId !== undefined && i.categoryId !== null) ? String(i.categoryId) : undefined,
      description: i.description,
      amount: i.amount,
      notes: i.notes ?? "",
    }));
  }

  static async createBudgetItem(
    budgetId: string,
    data: { description: string; amount: number; notes?: string; category_id?: string },
  ): Promise<import("../models/budget.models").BudgetItem> {
    interface ApiBudgetItem {
      budgetItemId: number; budgetId: number; categoryId?: number | null;
      description: string; amount: number; notes?: string | null;
    }
    const item = await apiPost<ApiBudgetItem>(`/api/budgetitems?adminId=1`, {
      budgetId: Number(budgetId),
      categoryId: (data.category_id !== undefined && data.category_id !== null) ? Number(data.category_id) : undefined,
      description: data.description,
      amount: data.amount,
      notes: data.notes ?? "",
    }, { silent401: true });
    return {
      item_id: String(item.budgetItemId),
      budget_id: String(item.budgetId),
      category_id: (item.categoryId !== undefined && item.categoryId !== null) ? String(item.categoryId) : undefined,
      description: item.description,
      amount: item.amount,
      notes: item.notes ?? "",
    };
  }

  static async updateBudgetItem(
    itemId: string,
    data: { description?: string; amount?: number; notes?: string; category_id?: string },
  ): Promise<void> {
    await apiPut(`/api/budgetitems/${itemId}?adminId=1`, {
      ...data,
      categoryId: (data.category_id !== undefined && data.category_id !== null) ? Number(data.category_id) : undefined,
      category_id: undefined,
    }, { silent401: true });
  }

  static async deleteBudgetItem(itemId: string): Promise<void> {
    await apiDelete(`/api/budgetitems/${itemId}`, { silent401: true });
  }

  static async createCategory(eventId: number, category: { catalogCategoryId: string; budget_name: string; budget_notes?: string; allocated: number; currency?: string }): Promise<{ budgetId: number }> {
    const budget = await apiPost<{ budgetId: number }>(`/api/budgets?adminId=1`, {
      eventId,
      categoryId: Number(category.catalogCategoryId),
      description: category.budget_name,
      notes: category.budget_notes ?? "",
      allocatedAmount: category.allocated,
      spentAmount: 0,
      currency: category.currency ?? "USD",
    });
    return { budgetId: budget.budgetId };
  }

  static async getVendors(): Promise<import("../models/budget.models").Vendor[]> {
    const vendors = await apiGet<ApiVendor[]>("/api/vendors");
    return vendors.map((v) => ({
      vendor_id: String(v.vendorId),
      name: v.vendorName,
      category: v.category,
      contact_name: v.contactPerson ?? "",
      email: v.email ?? "",
      phone: v.mobilePhone ?? v.phone ?? "",
      address: v.address ?? "",
      notes: v.notes ?? "",
      rating: v.rating,
      is_active: v.isActive,
      total_spent: 0,
      expense_count: 0,
    }));
  }

  static async updateVendor(vendorId: string, data: {
    vendorName: string;
    category: string;
    contactPerson?: string;
    email?: string;
    mobilePhone?: string;
    address?: string;
    notes?: string;
    rating?: number;
    isActive?: boolean;
  }): Promise<void> {
    await apiPut(`/api/vendors/${vendorId}?adminId=1`, {
      vendorName:    data.vendorName,
      category:      data.category,
      contactPerson: data.contactPerson ?? null,
      email:         data.email ?? null,
      mobilePhone:   data.mobilePhone ?? null,
      address:       data.address ?? null,
      notes:         data.notes ?? null,
      rating:        data.rating ?? 0,
      isActive:      data.isActive ?? true,
    });
  }

  static async deleteVendor(vendorId: string): Promise<void> {
    await apiDelete(`/api/vendors/${vendorId}`);
  }

  static async createVendor(data: {
    vendorName: string;
    category: string;
    contactPerson?: string;
    email?: string;
    mobilePhone?: string;
    address?: string;
    notes?: string;
    rating?: number;
  }): Promise<import("../models/budget.models").Vendor> {
    const created = await apiPost<ApiVendor>(`/api/vendors?adminId=1`, {
      vendorName: data.vendorName,
      category:   data.category,
      contactPerson: data.contactPerson ?? null,
      email:         data.email ?? null,
      mobilePhone:   data.mobilePhone ?? null,
      address:       data.address ?? null,
      notes:         data.notes ?? null,
      rating:        data.rating ?? 0,
      isActive:      true,
    });
    return { vendor_id: String(created.vendorId), name: created.vendorName };
  }
}
