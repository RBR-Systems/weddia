import i18next from "i18next";
import { CHART_COLORS } from "@/theme/chartColors";

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

export const DEFAULT_CURRENCY = "USD";
