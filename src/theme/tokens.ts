/**
 * Single source of truth for all design tokens.
 * Used by both globals.css (via CSS custom properties) and themeConfig.ts.
 */

// ---- Typography ----
export const FONT_FAMILY =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const HEADING_FONT_FAMILY = '"Playfair Display", serif';
export const FONT_SIZE_BASE = 15;
export const BORDER_RADIUS = 8;

// ---- Light Mode ----
export const light = {
  // Base
  background: "#fffbf8",
  foreground: "#2a2421",

  // Surfaces
  primaryBg: "#ffffff",
  primaryBgHover: "#f5ede7",
  secondaryBg: "#faf6f2",
  cardBg: "#ffffff",
  cardBorder: "#e8ddd4",

  // Text
  text: "#2a2421",
  textSecondary: "#6b6460",
  textTertiary: "#9b8f88",
  textMuted: "#bcb3ad",

  // Primary / Accent
  primary: "#c9a38c",
  primaryHover: "#b8927a",
  primaryActive: "#a67f68",
  primaryForeground: "#ffffff",

  // Secondary
  secondary: "#d4a29a",
  secondaryHover: "#c39189",

  // Status
  inProgress: "#5b6bc1",
  inProgressBg: "#eef0fb",
  inProgressBorder: "#c5cae9",
  completed: "#5cb68a",
  completedBg: "#e8f5ee",
  completedBorder: "#a5d6c1",
  canceled: "#b85c5c",
  canceledBg: "#faebeb",
  canceledBorder: "#e5b3b3",
  notStarted: "#6b6460",
  notStartedBg: "#f0eeec",
  notStartedBorder: "#c9c4c0",

  // UI Elements
  buttonText: "#ffffff",
  secondaryButtonBg: "#ffffff",
  secondaryButtonHover: "#f5ede7",
  secondaryButtonText: "#2a2421",
  secondaryButtonBorder: "#e8ddd4",
  progressBg: "#f0eeec",
  badgeColor: "#d4756b",
  badgeBg: "#faebeb",

  // Input
  inputBg: "#ffffff",
  inputBorder: "#e8ddd4",
  inputBorderFocus: "#c9a38c",
  inputText: "#2a2421",
  inputPlaceholder: "#9b8f88",

  // Dividers
  divider: "#e8ddd4",
  dividerLight: "#f5ede7",

  // Links
  linkColor: "#b8927a",
  linkHover: "#a67f68",

  // Shadows
  shadowColor: "rgba(42, 36, 33, 0.1)",
} as const;

// ---- Dark Mode ----
export const dark = {
  // Base
  background: "#1a1614",
  foreground: "#f5ede7",

  // Surfaces
  primaryBg: "#241e1c",
  primaryBgHover: "#2f2825",
  secondaryBg: "#2a2421",
  cardBg: "#241e1c",
  cardBorder: "#3d3532",

  // Text
  text: "#f5ede7",
  textSecondary: "#bcb3ad",
  textTertiary: "#9b8f88",
  textMuted: "#6b6460",

  // Primary / Accent
  primary: "#d4a89a",
  primaryHover: "#e5b9ab",
  primaryActive: "#c39789",
  primaryForeground: "#1a1614",

  // Secondary
  secondary: "#ddb3a8",
  secondaryHover: "#eec4b9",

  // Status
  inProgress: "#7b8dd9",
  inProgressBg: "#1f2538",
  inProgressBorder: "#3d4563",
  completed: "#6db193",
  completedBg: "#1a2e25",
  completedBorder: "#2f4d3f",
  canceled: "#d17a7a",
  canceledBg: "#2e1e1e",
  canceledBorder: "#533333",
  notStarted: "#9b8f88",
  notStartedBg: "#252220",
  notStartedBorder: "#3d3532",

  // UI Elements
  buttonText: "#1a1614",
  secondaryButtonBg: "#2f2825",
  secondaryButtonHover: "#3d3532",
  secondaryButtonText: "#f5ede7",
  secondaryButtonBorder: "#3d3532",
  progressBg: "#2f2825",
  badgeColor: "#e88a7e",
  badgeBg: "#2e1e1e",

  // Input
  inputBg: "#2f2825",
  inputBorder: "#3d3532",
  inputBorderFocus: "#d4a89a",
  inputText: "#f5ede7",
  inputPlaceholder: "#6b6460",

  // Dividers
  divider: "#3d3532",
  dividerLight: "#2f2825",

  // Links
  linkColor: "#e5b9ab",
  linkHover: "#d4a89a",

  // Shadows
  shadowColor: "rgba(0, 0, 0, 0.3)",
} as const;
