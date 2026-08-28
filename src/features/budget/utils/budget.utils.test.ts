import { describe, expect, it } from "vitest";
import { mapApiDataToBudgetState } from "./budget.utils";
import type { BudgetDataAPI } from "../models/api.models";

const buildApiData = (overrides: Partial<BudgetDataAPI> = {}): BudgetDataAPI => ({
  event_id: "1",
  event_name: "Test Wedding",
  budget: {
    budget_id: "b1",
    event_id: "1",
    currency: "USD",
    notes: "",
    created_at: "",
    updated_at: "",
  },
  summary: {
    total_budget: 10000,
    total_allocated: 8000,
    total_spent: 5000,
    total_remaining: 5000,
    percentage_spent: 50,
    percentage_allocated: 80,
    status: "on_track",
    currency: "USD",
    expense_count: 3,
    vendor_count: 2,
    paid_count: 1,
    pending_count: 2,
    overdue_count: 0,
  },
  categories: [],
  expenses: [],
  vendors: [],
  vendorEvents: [],
  budget_items: [],
  payment_schedule: [],
  analytics: {
    spending_by_month: [],
    top_vendors: [],
    payment_status_breakdown: {
      paid: { count: 1, total: 3200, percentage: 64 },
      pending: { count: 2, total: 1800, percentage: 36 },
      overdue: { count: 0, total: 0, percentage: 0 },
      partial: { count: 0, total: 0, percentage: 0 },
    },
    category_trends: {
      most_spent: "",
      most_remaining: "",
      on_budget_count: 0,
      over_budget_count: 0,
      under_budget_count: 0,
    },
  },
  ...overrides,
});

describe("mapApiDataToBudgetState", () => {
  it("propagates analytics.payment_status_breakdown.paid.total as summary.total_paid", () => {
    const state = mapApiDataToBudgetState(buildApiData());
    expect(state.summary.total_paid).toBe(3200);
  });

  it("falls back to 0 when analytics/paid breakdown is missing", () => {
    const data = buildApiData();
    // @ts-expect-error - simulating a response missing the analytics block
    delete data.analytics;
    const state = mapApiDataToBudgetState(data);
    expect(state.summary.total_paid).toBe(0);
  });

  it("uses the eventBudget override for total_budget but keeps total_paid from analytics", () => {
    const state = mapApiDataToBudgetState(buildApiData(), 20000);
    expect(state.summary.total_budget).toBe(20000);
    expect(state.summary.total_paid).toBe(3200);
  });
});
