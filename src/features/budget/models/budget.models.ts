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
  id: string;            // budgetId (line-item PK)
  catalog_id?: string;   // categoryId from global catalog
  name: string;          // catalog category name
  description?: string;  // catalog category description
  budget_name?: string;  // user-given name for this budget entry
  budget_notes?: string; // user notes for this budget entry
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
  receipt_url?: string | null;
  receipt_urls?: string[];
  notes?: string;
  currency?: string;
}

export interface Vendor {
  vendor_id: string;
  name: string;
  category?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  rating?: number;
  is_active?: boolean;
  total_spent?: number;
  expense_count?: number;
}

export interface BudgetItem {
  item_id: string;
  budget_id: string;
  category_id?: string;
  description: string;
  amount: number;
  notes?: string;
}

// ── Activity Log ────────────────────────────────────────────────────────────

export type ActivityType =
  | 'expense_added'
  | 'expense_edited'
  | 'expense_deleted'
  | 'payment_made'
  | 'category_updated'
  | 'budget_updated';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  amount?: number;
  user?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = 'warning' | 'alert' | 'reminder' | 'info';

export interface BudgetNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationSettings {
  budgetAlerts: boolean;
  paymentReminders: boolean;
  categoryWarnings: boolean;
  weeklyDigest: boolean;
  emailNotifications: boolean;
}

// ── Budget Estimator ─────────────────────────────────────────────────────────

export type WeddingStyle = 'budget' | 'moderate' | 'upscale' | 'luxury';

export interface EstimateCategory {
  name: string;
  percentage: number;
  color: string;
  description: string;
}

// ── Budget Templates ─────────────────────────────────────────────────────────

export interface TemplateCategoryDef {
  name: string;
  percentage: number;
  color: string;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  total_budget: number;
  categories: TemplateCategoryDef[];
  created_at: string;
}

// Catalog (global lookup) category — distinct from a budget Category which has allocation data
export interface CatalogCategory {
  category_id: string;
  name: string;
  description: string;
}

export interface BudgetState {
  isLoading: boolean;
  error: string | null;
  summary: BudgetSummary | null;
  categories: Category[];
  expenses: Expense[];
  vendors: Vendor[];
  eventVendorIds: string[];
  currency: Currency;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export type ReportType = "summary" | "category" | "expense" | "vendor";

export interface ChartTooltipEntry {
  name: string;
  value: number;
  color: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
  currency: string;
}

export interface CategoriesSummaryProps {
  categories: Category[];
  currency: string;
  totalRemaining: number;
  totalLabel: string;
}
