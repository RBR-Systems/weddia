import i18next from "i18next";
import { CHART_COLORS } from "@/theme/chartColors";
import { DEFAULT_CURRENCY } from "@/shared/constants/app.constants";
import { ADMIN_QUERY_PARAM } from "@/shared/constants/api.constants";
import type { BudgetState, Currency, EstimateCategory, PaymentStatus, WeddingStyle, BudgetTemplate } from '../models/budget.models';

export const getDefaultCategories = () => [
  {
    id: "venue",
    name: i18next.t("budgetEstimator.categories.venue"),
    icon: "HomeOutlined",
    color: CHART_COLORS.light[0], // Blue
    typical_percentage: 15,
  },
  {
    id: "catering",
    name: i18next.t("budgetEstimator.categories.catering"),
    icon: "CoffeeOutlined",
    color: CHART_COLORS.light[1], // Green
    typical_percentage: 30,
  },
  {
    id: "photography",
    name: i18next.t("budgetEstimator.categories.photography"),
    icon: "CameraOutlined",
    color: CHART_COLORS.light[4], // Purple
    typical_percentage: 10,
  },
];

export const getBudgetStatus = () => ({
  ON_TRACK: { value: "on_track" as const, label: i18next.t("statusBadge.onTrack"), color: "success" as const },
  AT_RISK: { value: "at_risk" as const, label: i18next.t("statusBadge.atRisk"), color: "warning" as const },
  OVER_BUDGET: { value: "over_budget" as const, label: i18next.t("statusBadge.overBudget"), color: "error" as const },
  NOT_STARTED: { value: "not_started" as const, label: i18next.t("statusBadge.notStarted"), color: "default" as const },
});

export const getPaymentStatus = () => ({
  PAID: { value: "paid" as const, label: i18next.t("common.paid"), color: "success" as const },
  PENDING: { value: "pending" as const, label: i18next.t("common.pending"), color: "warning" as const },
  OVERDUE: { value: "overdue" as const, label: i18next.t("common.overdue"), color: "error" as const },
  PARTIAL: { value: "partial" as const, label: i18next.t("common.partial"), color: "processing" as const },
});

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  MXN: { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX" },
} as const;

export { DEFAULT_CURRENCY, ADMIN_QUERY_PARAM };
export const EMPTY_VALUE_DISPLAY = "—";
export const DATE_DISPLAY_LOCALE = "en-US" as const;
export const BUDGET_STATUS_AT_RISK_PERCENT = 80;
export const BUDGET_STATUS_OVER_PERCENT = 100;

export const PAYMENT_STATUS_DISPLAY: Record<PaymentStatus, { labelKey: string; color: string }> = {
  paid: { labelKey: "common.paid", color: "success" },
  pending: { labelKey: "common.pending", color: "warning" },
  overdue: { labelKey: "common.overdue", color: "error" },
  partial: { labelKey: "common.partial", color: "processing" },
  cancelled: { labelKey: "common.cancelled", color: "default" },
};

export const CATEGORY_COLORS = [
  "#4A90E2", "#7ED321", "#F5A623", "#D0021B", "#9013FE",
  "#50E3C2", "#B8E986", "#BD10E0", "#417505", "#F8E71C",
] as const;

// ── Vendors ──────────────────────────────────────────────────────────────────

export const VENDOR_TABLE_PAGE_SIZE = 10;
export const VENDOR_DETAILS_PAGE_SIZE = 5;
export const VENDOR_DRAWER_WIDTH = 600;

// ── Payment ──────────────────────────────────────────────────────────────────

export const UPCOMING_PAYMENT_DAYS = 7;
export const CALENDAR_CELL_MAX_ITEMS = 3;
export const PAYMENT_TABLE_PAGE_SIZE = 10;
export const ALL_STATUSES_FILTER = "all" as const;

export const getPaymentMethodOptions = () => [
  { value: "Credit Card",   label: i18next.t("expenseModal.paymentMethods.creditCard") },
  { value: "Bank Transfer", label: i18next.t("expenseModal.paymentMethods.bankTransfer") },
  { value: "Cash",          label: i18next.t("expenseModal.paymentMethods.cash") },
  { value: "Check",         label: i18next.t("expenseModal.paymentMethods.check") },
  { value: "Other",         label: i18next.t("expenseModal.paymentMethods.other") },
];

// ── Advanced Feature Thresholds ──────────────────────────────────────────────

export const OVER_BUDGET_THRESHOLD_PERCENT = 90;
export const BUDGET_WARNING_THRESHOLD_PERCENT = 75;
export const CATEGORY_WARNING_THRESHOLD = 0.8;

// ── Budget Estimator ─────────────────────────────────────────────────────────

export const ESTIMATE_CATEGORIES: EstimateCategory[] = [
  {
    name: "Venue",
    percentage: 30,
    color: CHART_COLORS.light[0],
    description: "Reception hall, ceremony site, rentals",
  },
  {
    name: "Catering & Bar",
    percentage: 25,
    color: CHART_COLORS.light[1],
    description: "Food, drinks, cake, service staff",
  },
  {
    name: "Photography & Video",
    percentage: 12,
    color: CHART_COLORS.light[4],
    description: "Photographer, videographer, albums",
  },
  {
    name: "Flowers & Decor",
    percentage: 8,
    color: CHART_COLORS.light[7],
    description: "Bouquets, centerpieces, decorations",
  },
  {
    name: "Music & Entertainment",
    percentage: 7,
    color: CHART_COLORS.light[6],
    description: "DJ, band, lighting, games",
  },
  {
    name: "Attire & Beauty",
    percentage: 6,
    color: CHART_COLORS.light[5],
    description: "Dress, suit, hair, makeup",
  },
  {
    name: "Stationery",
    percentage: 3,
    color: CHART_COLORS.light[2],
    description: "Invitations, programs, signage",
  },
  {
    name: "Transportation",
    percentage: 3,
    color: CHART_COLORS.light[9],
    description: "Limo, shuttle, valet",
  },
  {
    name: "Favors & Gifts",
    percentage: 2,
    color: CHART_COLORS.light[10],
    description: "Guest gifts, wedding party gifts",
  },
  {
    name: "Miscellaneous",
    percentage: 4,
    color: CHART_COLORS.light[11],
    description: "Tips, insurance, unexpected costs",
  },
];

export const STYLE_MULTIPLIERS: Record<
  WeddingStyle,
  { label: string; multiplier: number; perGuest: number }
> = {
  budget: { label: "Budget-Friendly", multiplier: 0.7, perGuest: 100 },
  moderate: { label: "Moderate", multiplier: 1, perGuest: 200 },
  upscale: { label: "Upscale", multiplier: 1.5, perGuest: 350 },
  luxury: { label: "Luxury", multiplier: 2.5, perGuest: 500 },
};

// ── Expense List ─────────────────────────────────────────────────────────────

export const EXPENSE_TABLE_PAGE_SIZE = 10;
export const EXPENSE_TABLE_SCROLL = { x: 800 } as const;

// ── Expense Modal ─────────────────────────────────────────────────────────────

export const EXPENSE_MODAL_WIDTH = 520;

// ── Reports ───────────────────────────────────────────────────────────────────

export const REPORT_TABLE_PAGE_SIZE = 10;
export const REPORT_DATE_FORMAT = "YYYY-MM-DD" as const;
export const REPORT_CATEGORY_CSV_HEADERS = "Category,Allocated,Spent,Remaining,Expenses" as const;

// ── Charts ────────────────────────────────────────────────────────────────────

export const CHART_LABEL_MAX_CHARS = 10;

// ── Templates ─────────────────────────────────────────────────────────────────

export const TEMPLATE_MAX_PREVIEW_CATEGORIES = 3;
export const TEMPLATE_PREVIEW_MODAL_WIDTH = 500;

// ── Budget Stats ──────────────────────────────────────────────────────────────

export const REMAINING_WARNING_RATIO = 0.2;

// ── Category List ─────────────────────────────────────────────────────────────

export const CATEGORY_SEARCH_WIDTH = 200;

// ── Budget Templates ─────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATES: BudgetTemplate[] = [
  {
    id: "classic",
    name: "Classic Wedding",
    description: "Traditional wedding budget allocation",
    total_budget: 30000,
    categories: [
      { name: "Venue", percentage: 40, color: CHART_COLORS.light[0] },
      { name: "Catering", percentage: 25, color: CHART_COLORS.light[1] },
      { name: "Photography", percentage: 10, color: CHART_COLORS.light[4] },
      { name: "Flowers", percentage: 8, color: CHART_COLORS.light[7] },
      { name: "Music", percentage: 7, color: CHART_COLORS.light[6] },
      { name: "Attire", percentage: 5, color: CHART_COLORS.light[5] },
      { name: "Other", percentage: 5, color: CHART_COLORS.light[11] },
    ],
    created_at: "2026-01-01",
  },
  {
    id: "intimate",
    name: "Intimate Celebration",
    description: "Smaller guest list, higher quality focus",
    total_budget: 15000,
    categories: [
      { name: "Venue & Catering", percentage: 50, color: CHART_COLORS.light[0] },
      { name: "Photography", percentage: 15, color: CHART_COLORS.light[4] },
      { name: "Flowers & Decor", percentage: 15, color: CHART_COLORS.light[7] },
      { name: "Attire", percentage: 10, color: CHART_COLORS.light[5] },
      { name: "Music", percentage: 10, color: CHART_COLORS.light[6] },
    ],
    created_at: "2026-01-01",
  },
  {
    id: "luxury",
    name: "Luxury Wedding",
    description: "Premium vendors and full-service planning",
    total_budget: 100000,
    categories: [
      { name: "Venue", percentage: 30, color: CHART_COLORS.light[0] },
      { name: "Catering & Bar", percentage: 20, color: CHART_COLORS.light[1] },
      { name: "Photography & Video", percentage: 12, color: CHART_COLORS.light[4] },
      { name: "Flowers & Decor", percentage: 12, color: CHART_COLORS.light[7] },
      { name: "Entertainment", percentage: 10, color: CHART_COLORS.light[6] },
      { name: "Attire & Beauty", percentage: 8, color: CHART_COLORS.light[5] },
      { name: "Stationery", percentage: 3, color: CHART_COLORS.light[2] },
      { name: "Transportation", percentage: 3, color: CHART_COLORS.light[9] },
      { name: "Miscellaneous", percentage: 2, color: CHART_COLORS.light[11] },
    ],
    created_at: "2026-01-01",
  },
];

// ── Initial State ─────────────────────────────────────────────────────────────

export const BUDGET_INITIAL_STATE: BudgetState = {
  isLoading: false,
  error: null,
  summary: {
    total_budget: 0,
    total_allocated: 0,
    total_spent: 0,
    total_remaining: 0,
    percentage_spent: 0,
    status: "not_started",
    currency: DEFAULT_CURRENCY as Currency,
  },
  categories: getDefaultCategories().map((c) => ({
    id: c.id,
    name: c.name,
    allocated: 0,
    spent: 0,
    remaining: 0,
    color: c.color,
    expense_count: 0,
  })),
  expenses: [],
  vendors: [],
  vendorEvents: [],
  currency: DEFAULT_CURRENCY as Currency,
  activities: [],
};
