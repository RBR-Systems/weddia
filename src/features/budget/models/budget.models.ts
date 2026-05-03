import type { Vendor } from "@/shared/models/vendor.models";
export type { Vendor };

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
  methodOfPayment: string | null;
  receipt_url?: string | null;
  receipt_urls?: string[];
  notes?: string;
  currency?: string;
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

// ── Planner ──────────────────────────────────────────────────────────────────

export type BulkActionModal = 'status' | 'category' | 'delete' | null;

// Catalog (global lookup) category — distinct from a budget Category which has allocation data
export interface CatalogCategory {
  category_id: string;
  name: string;
  description: string;
}

export interface CatalogCategoryListProps {
  readonly loading: boolean;
  readonly categories: CatalogCategory[];
  readonly search: string;
  readonly onCreateClick: () => void;
  readonly onEditClick: (cat: CatalogCategory) => void;
  readonly onDeleteConfirm: (cat: CatalogCategory) => void;
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

// ── Context ───────────────────────────────────────────────────────────────────

export interface TemplateCategoryRaw {
  name: string;
  percentage?: number;
  allocated?: number;
  spent?: number;
  color?: string;
}

export type CategoryPatchSource = {
  total_budget?: number;
  categories?: TemplateCategoryRaw[];
};

export type BudgetAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: Partial<BudgetState> }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "UPDATE_EXPENSE"; payload: { id: string; data: Partial<Expense> } }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: { id: string; data: Partial<Category> } }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "UPDATE_BUDGET"; payload: number }
  | { type: "SET_EVENT_VENDOR_IDS"; payload: string[] };

export interface BudgetContextValue {
  state: BudgetState;
  loadBudgetData: (eid: number, signal?: AbortSignal) => Promise<void>;
  refreshData: () => Promise<void>;
  addExpense: (payload: Omit<Expense, "expense_id">) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => void;
  updateBudget: (totalBudget: number) => void;
  loadTemplate: (template: CategoryPatchSource) => void;
  loadEstimate: (estimate: CategoryPatchSource) => void;
  assignVendor: (vendorId: string) => void;
  unassignVendor: (vendorId: string) => void;
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
