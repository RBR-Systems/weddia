import type { BudgetDataAPI } from "../models/api.models";
import type { BudgetStatus, PaymentStatus, VendorEvent, VendorEventStatus } from "../models/budget.models";
import type {
  ApiCategory,
  ApiBudget,
  ApiExpense,
  ApiVendor,
  ApiVendorEvent,
} from "../models/apiRaw.models";
import {
  CATEGORY_COLORS,
  DEFAULT_CURRENCY,
  BUDGET_STATUS_AT_RISK_PERCENT,
  BUDGET_STATUS_OVER_PERCENT,
} from "../constants/budget.constants";

export interface RawBudgetPayload {
  eventId: number;
  budgets: ApiBudget[];
  expenses: ApiExpense[];
  categories: ApiCategory[];
  vendors: ApiVendor[];
  vendorEvents: ApiVendorEvent[];
}

const PAID: PaymentStatus = "paid";
const PENDING: PaymentStatus = "pending";

function determineBudgetStatus(pctSpent: number, totalSpent: number): BudgetStatus {
  if (pctSpent >= BUDGET_STATUS_OVER_PERCENT) return "over_budget";
  if (pctSpent >= BUDGET_STATUS_AT_RISK_PERCENT) return "at_risk";
  if (totalSpent === 0) return "not_started";
  return "on_track";
}

function nowTimestamps() {
  const now = new Date().toISOString();
  return { created_at: now, updated_at: now };
}

// Single-pass aggregation over expenses — O(n) instead of O(V×E) nested filters
function buildExpenseAggregates(expenses: ApiExpense[]) {
  const spentPerCategory = new Map<number, number>();
  const countPerCategory = new Map<number, number>();
  const spentPerVendor = new Map<number, number>();
  const countPerVendor = new Map<number, number>();

  for (const e of expenses) {
    if (e.paymentStatus === PAID) {
      spentPerCategory.set(e.categoryId, (spentPerCategory.get(e.categoryId) ?? 0) + e.amount);
      if (e.vendorId != null) {
        spentPerVendor.set(e.vendorId, (spentPerVendor.get(e.vendorId) ?? 0) + e.amount);
      }
    }
    countPerCategory.set(e.categoryId, (countPerCategory.get(e.categoryId) ?? 0) + 1);
    if (e.vendorId != null) {
      countPerVendor.set(e.vendorId, (countPerVendor.get(e.vendorId) ?? 0) + 1);
    }
  }

  return { spentPerCategory, countPerCategory, spentPerVendor, countPerVendor };
}

function mapCategories(
  budgets: ApiBudget[],
  categoryLookup: Map<number, ApiCategory>,
  spentPerCategory: Map<number, number>,
  countPerCategory: Map<number, number>,
  totalBudget: number,
) {
  return budgets.map((b, i) => {
    const cat = categoryLookup.get(b.categoryId);
    const spent = spentPerCategory.get(b.categoryId) ?? b.spentAmount;
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
      expense_count: countPerCategory.get(b.categoryId) ?? 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      ...nowTimestamps(),
    };
  });
}

function mapExpenses(
  expenses: ApiExpense[],
  budgetByCategoryId: Map<number, ApiBudget>,
  vendorLookup: Map<number, ApiVendor>,
  currency: string,
) {
  return expenses.map((e) => {
    const vendor = e.vendorId != null ? vendorLookup.get(e.vendorId) : undefined;
    const budget = budgetByCategoryId.get(e.categoryId);
    return {
      expense_id: String(e.expenseId),
      event_id: String(e.eventId),
      category_id: String(budget?.budgetId ?? e.categoryId),
      vendor_id: e.vendorId != null ? String(e.vendorId) : null,
      vendor_name: vendor?.vendorName ?? "",
      description: e.description,
      amount: e.amount,
      expense_date: e.expenseDate,
      payment_status: ((e.paymentStatus ?? PENDING).toLowerCase()) as PaymentStatus,
      methodOfPayment: e.methodOfPayment ?? null,
      currency: e.currency ?? currency,
      notes: e.notes ?? "",
      receipt_url: e.receiptUrl ?? null,
      ...nowTimestamps(),
    };
  });
}

function mapVendors(
  vendors: ApiVendor[],
  spentPerVendor: Map<number, number>,
  countPerVendor: Map<number, number>,
) {
  return vendors.map((v) => ({
    vendor_id: String(v.vendorId),
    name: v.vendorName,
    category_id: v.categoryId ?? null,
    category_name: v.categoryName ?? "",
    contact_person: v.contactPerson ?? "",
    email: v.email ?? "",
    phone: v.mobilePhone ?? v.phone ?? "",
    address: v.address ?? "",
    notes: v.notes ?? "",
    rating: v.rating,
    is_active: v.isActive,
    total_spent: spentPerVendor.get(v.vendorId) ?? 0,
    expense_count: countPerVendor.get(v.vendorId) ?? 0,
    ...nowTimestamps(),
  }));
}

// Single-pass payment status grouping — O(n)
function buildPaymentBreakdown(expenses: ApiExpense[], totalSpent: number) {
  const groups = {
    paid:    { count: 0, total: 0 },
    pending: { count: 0, total: 0 },
    overdue: { count: 0, total: 0 },
    partial: { count: 0, total: 0 },
  };

  for (const e of expenses) {
    const status = (e.paymentStatus ?? "pending") as keyof typeof groups;
    const group = groups[status];
    if (group) {
      group.count++;
      group.total += e.amount;
    }
  }

  const withPercentage = (g: { count: number; total: number }) => ({
    ...g,
    percentage: totalSpent > 0 ? (g.total / totalSpent) * 100 : 0,
  });

  return {
    paid:    withPercentage(groups.paid),
    pending: withPercentage(groups.pending),
    overdue: withPercentage(groups.overdue),
    partial: withPercentage(groups.partial),
  };
}

function mapVendorEvents(raw: ApiVendorEvent[], eventId: number): VendorEvent[] {
  return raw.map((v) => ({
    vendor_id: String(v.vendorId),
    event_id: eventId,
    contracted_amount: v.contractedAmount ?? undefined,
    contracted_date: v.contractedDate ?? undefined,
    status: ((v.status ?? "active") as VendorEventStatus),
    notes: v.notes ?? undefined,
  }));
}

export function mapRawToBudgetData(payload: RawBudgetPayload): BudgetDataAPI {
  const { eventId, budgets, expenses, categories, vendors, vendorEvents } = payload;

  const categoryLookup = new Map(categories.map((c) => [c.categoryId, c]));
  const vendorLookup = new Map(vendors.map((v) => [v.vendorId, v]));
  const budgetByCategoryId = new Map(budgets.map((b) => [b.categoryId, b]));

  const aggregates = buildExpenseAggregates(expenses);

  const totalBudget = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent = aggregates.spentPerCategory
    .values()
    .reduce((s, v) => s + v, 0);
  const currency = budgets[0]?.currency ?? DEFAULT_CURRENCY;
  const pctSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const mappedCategories = mapCategories(
    budgets, categoryLookup,
    aggregates.spentPerCategory, aggregates.countPerCategory,
    totalBudget,
  );
  const mappedExpenses = mapExpenses(expenses, budgetByCategoryId, vendorLookup, currency);
  const mappedVendors = mapVendors(vendors, aggregates.spentPerVendor, aggregates.countPerVendor);
  const paymentBreakdown = buildPaymentBreakdown(expenses, totalSpent);

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
      total_allocated: totalBudget,
      total_spent: totalSpent,
      total_remaining: totalBudget - totalSpent,
      percentage_spent: pctSpent,
      percentage_allocated: 100,
      status: determineBudgetStatus(pctSpent, totalSpent),
      currency,
      expense_count: expenses.length,
      vendor_count: vendors.length,
      paid_count:    paymentBreakdown.paid.count,
      pending_count: paymentBreakdown.pending.count,
      overdue_count: paymentBreakdown.overdue.count,
    },
    categories: mappedCategories,
    expenses: mappedExpenses,
    vendors: mappedVendors,
    vendorEvents: mapVendorEvents(vendorEvents, eventId),
    budget_items: [],
    payment_schedule: [],
    analytics: {
      spending_by_month: [],
      top_vendors: [],
      payment_status_breakdown: paymentBreakdown,
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
