export type Currency = "USD" | "EUR" | "GBP" | "MXN" | "CAD";

export type BudgetStatus =
  | "on_track"
  | "at_risk"
  | "over_budget"
  | "not_started";
export type PaymentStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "partial"
  | "cancelled";

export interface Timestamps {
  created_at?: string;
  updated_at?: string;
}

export interface BudgetSummary {
  total_budget: number;
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  percentage_spent: number;
  status: BudgetStatus;
  currency: Currency;
}

export interface Category {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage?: number;
  expense_count?: number;
  color?: string;
}

export interface Expense {
  expense_id: string;
  description: string;
  amount: number;
  category_id: string;
  vendor_name?: string;
  expense_date: string;
  payment_status: PaymentStatus;
  methodOfPayment: string;
  receipt_urls?: string[];
}

export interface BudgetState {
  isLoading: boolean;
  error: string | null;
  summary: BudgetSummary | null;
  categories: Category[];
  expenses: Expense[];
  currency: Currency;
}
