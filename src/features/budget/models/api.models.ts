// API Response Types based on database schema

export interface Timestamps {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface VendorAPI extends Timestamps {
  vendor_id: string;
  name: string;
  category: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  rating: number;
  is_active: boolean;
  total_spent: number;
  expense_count: number;
}

export interface ExpenseAPI extends Timestamps {
  expense_id: string;
  event_id: string;
  category_id: string;
  vendor_id: string | null;
  vendor_name: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_status: "paid" | "pending" | "overdue" | "partial" | "cancelled";
  methodOfPayment: string | null;
  currency: string;
  notes: string;
  receipt_url: string | null;
}

export interface CategoryAPI extends Timestamps {
  category_id: string;
  catalog_category_id?: string;
  name: string;
  description: string;
  budget_name?: string;
  budget_notes?: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  percentage_of_spent: number;
  expense_count: number;
  color: string;
}

export interface BudgetAPI extends Timestamps {
  budget_id: string;
  event_id: string;
  currency: string;
  notes: string;
}

export interface BudgetItemAPI extends Timestamps {
  budget_item_id: string;
  budget_id: string;
  category_id: string;
  description: string;
  amount: number;
  notes: string;
}

export interface BudgetSummaryAPI {
  total_budget: number;
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  percentage_spent: number;
  percentage_allocated: number;
  status: "on_track" | "at_risk" | "over_budget" | "not_started";
  currency: string;
  expense_count: number;
  vendor_count: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
}

export interface PaymentScheduleAPI {
  payment_id: string;
  expense_id: string;
  due_date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  notes: string;
}

export interface SpendingByMonthAPI {
  month: string;
  amount: number;
  expense_count: number;
}

export interface TopVendorAPI {
  vendor_id: string;
  vendor_name: string;
  total_spent: number;
  percentage: number;
}

export interface PaymentStatusBreakdownAPI {
  paid: {
    count: number;
    total: number;
    percentage: number;
  };
  pending: {
    count: number;
    total: number;
    percentage: number;
  };
  overdue: {
    count: number;
    total: number;
    percentage: number;
  };
  partial: {
    count: number;
    total: number;
    percentage: number;
  };
}

export interface CategoryTrendsAPI {
  most_spent: string;
  most_remaining: string;
  on_budget_count: number;
  over_budget_count: number;
  under_budget_count: number;
}

export interface AnalyticsAPI {
  spending_by_month: SpendingByMonthAPI[];
  top_vendors: TopVendorAPI[];
  payment_status_breakdown: PaymentStatusBreakdownAPI;
  category_trends: CategoryTrendsAPI;
}

// Main API Response
export interface BudgetDataAPI {
  event_id: string;
  event_name: string;
  budget: BudgetAPI;
  summary: BudgetSummaryAPI;
  categories: CategoryAPI[];
  expenses: ExpenseAPI[];
  vendors: VendorAPI[];
  budget_items: BudgetItemAPI[];
  payment_schedule: PaymentScheduleAPI[];
  analytics: AnalyticsAPI;
}

// API Endpoint Types
export interface GetBudgetResponse {
  success: boolean;
  data: BudgetDataAPI;
  message?: string;
}

export interface CreateExpenseRequest {
  event_id: string;
  category_id: string;
  vendor_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_status: "paid" | "pending" | "overdue" | "partial";
  methodOfPayment: string | null;
  currency: string;
  notes?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  category_id?: string;
  vendor_id?: string;
  expense_date?: string;
  payment_status?: "paid" | "pending" | "overdue" | "partial";
  methodOfPayment?: string;
  notes?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  allocated: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  allocated?: number;
}

export interface UpdateBudgetRequest {
  total_budget?: number;
  currency?: string;
  notes?: string;
}
