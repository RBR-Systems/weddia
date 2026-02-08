/**
 * Chart color tokens — single source of truth for all data-visualization colors.
 * Consumed by Recharts, Ant Design charts, and any component that renders graphs.
 *
 * Every palette ships light & dark variants so charts remain legible in both themes.
 */

// ---------------------------------------------------------------------------
// PRIMARY CATEGORICAL COLORS
// Use for different data series (pie charts, bar charts, line graphs, etc.)
// ---------------------------------------------------------------------------
export const CHART_COLORS = {
  light: [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#6366F1", // Indigo
    "#84CC16", // Lime
    "#A855F7", // Violet
  ],
  dark: [
    "#60A5FA", // Lighter Blue
    "#34D399", // Lighter Green
    "#FCD34D", // Lighter Amber
    "#F87171", // Lighter Red
    "#A78BFA", // Lighter Purple
    "#22D3EE", // Lighter Cyan
    "#FB923C", // Lighter Orange
    "#F472B6", // Lighter Pink
    "#2DD4BF", // Lighter Teal
    "#818CF8", // Lighter Indigo
    "#A3E635", // Lighter Lime
    "#C084FC", // Lighter Violet
  ],
} as const;

// ---------------------------------------------------------------------------
// SEQUENTIAL COLORS (Single Hue)
// Use for heatmaps, choropleth maps, or showing magnitude
// ---------------------------------------------------------------------------
export const SEQUENTIAL_COLORS = {
  light: {
    /** Blue scale — data density, frequency, intensity */
    blue: ["#EFF6FF", "#DBEAFE", "#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1E40AF"],
    /** Green scale — growth, success metrics */
    green: ["#F0FDF4", "#DCFCE7", "#BBF7D0", "#86EFAC", "#4ADE80", "#22C55E", "#16A34A", "#15803D"],
    /** Purple scale — engagement, activity */
    purple: ["#FAF5FF", "#F3E8FF", "#E9D5FF", "#D8B4FE", "#C084FC", "#A855F7", "#9333EA", "#7E22CE"],
    /** Orange scale — alerts, warnings */
    orange: ["#FFF7ED", "#FFEDD5", "#FED7AA", "#FDBA74", "#FB923C", "#F97316", "#EA580C", "#C2410C"],
    /** Gray scale — neutral data */
    gray: ["#F9FAFB", "#F3F4F6", "#E5E7EB", "#D1D5DB", "#9CA3AF", "#6B7280", "#4B5563", "#374151"],
  },
  dark: {
    blue: ["#1E3A8A", "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"],
    green: ["#14532D", "#166534", "#15803D", "#16A34A", "#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0"],
    purple: ["#581C87", "#6B21A8", "#7E22CE", "#9333EA", "#A855F7", "#C084FC", "#D8B4FE", "#E9D5FF"],
    orange: ["#7C2D12", "#9A3412", "#C2410C", "#EA580C", "#F97316", "#FB923C", "#FDBA74", "#FED7AA"],
    gray: ["#1F2937", "#374151", "#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6"],
  },
} as const;

// ---------------------------------------------------------------------------
// DIVERGING COLORS
// Use for showing deviation from a midpoint (positive/negative, gain/loss)
// ---------------------------------------------------------------------------
export const DIVERGING_COLORS = {
  light: {
    /** Red → Green (loss to gain, negative to positive) */
    redGreen: [
      "#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#F3F4F6",
      "#86EFAC", "#4ADE80", "#22C55E", "#16A34A",
    ],
    /** Blue → Orange (cool to warm, below to above) */
    blueOrange: [
      "#1E40AF", "#3B82F6", "#60A5FA", "#BFDBFE", "#F3F4F6",
      "#FED7AA", "#FB923C", "#F97316", "#EA580C",
    ],
    /** Purple → Green (alternative diverging) */
    purpleGreen: [
      "#7E22CE", "#9333EA", "#A855F7", "#D8B4FE", "#F3F4F6",
      "#86EFAC", "#22C55E", "#16A34A", "#15803D",
    ],
  },
  dark: {
    redGreen: [
      "#991B1B", "#DC2626", "#EF4444", "#F87171", "#374151",
      "#4ADE80", "#22C55E", "#16A34A", "#14532D",
    ],
    blueOrange: [
      "#1E3A8A", "#2563EB", "#3B82F6", "#93C5FD", "#374151",
      "#FDBA74", "#F97316", "#EA580C", "#9A3412",
    ],
    purpleGreen: [
      "#581C87", "#7E22CE", "#A855F7", "#C084FC", "#374151",
      "#4ADE80", "#16A34A", "#15803D", "#14532D",
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// SEMANTIC COLORS
// Use for status indicators, alerts, and meaningful states
// ---------------------------------------------------------------------------
export const SEMANTIC_CHART_COLORS = {
  light: {
    success: "#10B981",  // Positive outcomes, completed, approved
    warning: "#F59E0B",  // Caution, pending, needs attention
    error: "#EF4444",    // Negative outcomes, failed, rejected
    info: "#3B82F6",     // Informational, in progress, neutral
    neutral: "#6B7280",  // Inactive, disabled, not started
  },
  dark: {
    success: "#34D399",
    warning: "#FCD34D",
    error: "#F87171",
    info: "#60A5FA",
    neutral: "#9CA3AF",
  },
} as const;

// ---------------------------------------------------------------------------
// COMPARISON COLORS (for A/B testing, comparisons, variants)
// ---------------------------------------------------------------------------
export const COMPARISON_COLORS = {
  light: {
    primary: "#3B82F6",   // Option A, Current, Actual
    secondary: "#8B5CF6", // Option B, Previous, Target
    tertiary: "#06B6D4",  // Option C, Forecast, Benchmark
  },
  dark: {
    primary: "#60A5FA",
    secondary: "#A78BFA",
    tertiary: "#22D3EE",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build bidirectional lookup maps for resolving stored hex colors across themes.
const _lightToDark = new Map<string, string>();
const _darkToLight = new Map<string, string>();

CHART_COLORS.light.forEach((c, i) => {
  _lightToDark.set(c.toLowerCase(), CHART_COLORS.dark[i]);
  _darkToLight.set(CHART_COLORS.dark[i].toLowerCase(), c);
});

/**
 * Resolve a stored chart color for the active theme.
 *
 * If the hex belongs to the opposite palette it returns the equivalent
 * colour in the target mode. Custom (non-palette) colors pass through
 * unchanged — this lets user-picked colors from the ColorPicker survive.
 */
export function resolveChartColor(hex: string, mode: "light" | "dark"): string {
  const key = hex.toLowerCase();
  if (mode === "dark") return _lightToDark.get(key) ?? hex;
  return _darkToLight.get(key) ?? hex;
}

/** Return the categorical palette for the given mode. */
export function getChartColors(mode: "light" | "dark") {
  return CHART_COLORS[mode];
}

/** Pick a categorical color by index (wraps around). */
export function getChartColor(index: number, mode: "light" | "dark") {
  const palette = CHART_COLORS[mode];
  return palette[index % palette.length];
}

/** Return the semantic palette for the given mode. */
export function getSemanticColors(mode: "light" | "dark") {
  return SEMANTIC_CHART_COLORS[mode];
}

/** Return the comparison palette for the given mode. */
export function getComparisonColors(mode: "light" | "dark") {
  return COMPARISON_COLORS[mode];
}
