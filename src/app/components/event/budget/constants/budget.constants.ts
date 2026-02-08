import { CHART_COLORS } from "@/theme/chartColors";

export const DEFAULT_CATEGORIES = [
  {
    id: "venue",
    name: "Venue",
    icon: "HomeOutlined",
    color: CHART_COLORS.light[0], // Blue
    typical_percentage: 15,
  },
  {
    id: "catering",
    name: "Catering & Bar",
    icon: "CoffeeOutlined",
    color: CHART_COLORS.light[1], // Green
    typical_percentage: 30,
  },
  {
    id: "photography",
    name: "Photography & Videography",
    icon: "CameraOutlined",
    color: CHART_COLORS.light[4], // Purple
    typical_percentage: 10,
  },
];

export const BUDGET_STATUS = {
  ON_TRACK: { value: "on_track", label: "On Track", color: "success" },
  AT_RISK: { value: "at_risk", label: "At Risk", color: "warning" },
  OVER_BUDGET: { value: "over_budget", label: "Over Budget", color: "error" },
  NOT_STARTED: { value: "not_started", label: "Not Started", color: "default" },
} as const;

export const PAYMENT_STATUS = {
  PAID: { value: "paid", label: "Paid", color: "success" },
  PENDING: { value: "pending", label: "Pending", color: "warning" },
  OVERDUE: { value: "overdue", label: "Overdue", color: "error" },
  PARTIAL: { value: "partial", label: "Partial", color: "processing" },
} as const;

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  MXN: { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX" },
} as const;

export const DEFAULT_CURRENCY = "USD";
