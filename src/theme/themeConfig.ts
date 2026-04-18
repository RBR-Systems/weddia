import type { ThemeConfig } from "antd";
import {
  FONT_FAMILY,
  FONT_SIZE_BASE,
  BORDER_RADIUS,
  light,
  dark,
} from "./tokens";

// Helper to build a theme from a token set
function buildTheme(t: typeof light | typeof dark): ThemeConfig {
  return {
    token: {
      // ---- Seed Tokens ----
      colorPrimary: t.primary,
      colorSuccess: t.completed,
      colorWarning: "#E8A838",
      colorError: t.canceled,
      colorInfo: t.inProgress,
      colorLink: t.linkColor,
      colorTextBase: t.text,
      colorBgBase: t.background,
      borderRadius: 10,
      borderRadiusLG: 14,
      borderRadiusSM: 6,
      borderRadiusXS: 4,

      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE_BASE,
      fontWeightStrong: 700,

      colorBgContainer: t.primaryBg,
      colorBgElevated: t.cardBg,
      colorBgLayout: t.background,
      colorBorder: t.cardBorder,
      colorBorderSecondary: t.dividerLight,
      colorSplit: t.divider,
      colorText: t.text,
      colorTextSecondary: t.textSecondary,
      colorTextTertiary: t.textTertiary,
      colorTextQuaternary: t.textMuted,

      // Shadows
      boxShadow: `0 4px 6px ${t.shadowColor}`,
      boxShadowSecondary: `0 2px 4px ${t.shadowColor}`,
    },

    components: {
      Button: {
        colorPrimary: t.primary,
        colorPrimaryHover: t.primaryHover,
        colorPrimaryActive: t.primaryActive,
        defaultBg: t.secondaryButtonBg,
        defaultBorderColor: t.secondaryButtonBorder,
        defaultColor: t.secondaryButtonText,
        fontWeight: 600,
        algorithm: true,
      },
      Input: {
        colorBgContainer: t.inputBg,
        colorBorder: t.inputBorder,
        activeBorderColor: t.inputBorderFocus,
        hoverBorderColor: t.inputBorderFocus,
        colorText: t.inputText,
        algorithm: true,
      },
      Select: {
        colorBgContainer: t.inputBg,
        colorBorder: t.inputBorder,
        algorithm: true,
      },
      Card: {
        colorBgContainer: t.cardBg,
        colorBorderSecondary: t.cardBorder,
        algorithm: true,
      },
      Modal: {
        colorBgContainer: t.cardBg,
        contentBg: t.cardBg,
        headerBg: t.cardBg,
        colorText: t.text,
        colorTextHeading: t.text,
        colorIcon: t.textSecondary,
        colorIconHover: t.text,
        algorithm: true,
      },
      Table: {
        colorBgContainer: t.cardBg,
        headerBg: t.secondaryBg,
        borderColor: t.cardBorder,
        algorithm: true,
      },
      Menu: {
        colorBgContainer: t.primaryBg,
        itemSelectedBg: t.primaryBgHover,
        itemSelectedColor: t.primary,
        algorithm: true,
      },
      Tag: { algorithm: true },
      Progress: {
        defaultColor: t.primary,
        algorithm: true,
      },
      Tabs: {
        inkBarColor: t.primary,
        itemActiveColor: t.primary,
        itemSelectedColor: t.primary,
        itemHoverColor: t.primaryHover,
        algorithm: true,
      },
      Badge: { colorError: t.badgeColor },
      Divider: { colorSplit: t.divider },
      Typography: { algorithm: true },
      Statistic: { algorithm: true },
      Form: { algorithm: true },
      DatePicker: {
        colorBgContainer: t.inputBg,
        colorBorder: t.inputBorder,
        algorithm: true,
      },
      Collapse: {
        colorBgContainer: t.cardBg,
        colorBorder: t.cardBorder,
        algorithm: true,
      },
      Drawer: { colorBgElevated: t.cardBg, algorithm: true },
      Dropdown: { colorBgElevated: t.cardBg, algorithm: true },
      List: { colorBorder: t.cardBorder, algorithm: true },
      Tooltip: { algorithm: true },
      Popover: { colorBgElevated: t.cardBg, algorithm: true },
      Popconfirm: { algorithm: true },
      Steps: { colorPrimary: t.primary, algorithm: true },
      Timeline: { algorithm: true },
      Pagination: { colorPrimary: t.primary, algorithm: true },
      Segmented: {
        colorBgLayout: t.progressBg,
        itemSelectedBg: t.cardBg,
        algorithm: true,
      },
      Slider: { colorPrimaryBorderHover: t.primaryHover, algorithm: true },
      Switch: { colorPrimary: t.primary, algorithm: true },
      Checkbox: { colorPrimary: t.primary, algorithm: true },
      Radio: { colorPrimary: t.primary, algorithm: true },
      Upload: { colorPrimaryHover: t.primaryHover, algorithm: true },
      Calendar: { colorPrimary: t.primary, algorithm: true },
      Notification: { colorBgElevated: t.cardBg, algorithm: true },
      Alert: { algorithm: true },
      Spin: { colorPrimary: t.primary },
      Result: { algorithm: true },
      Empty: { algorithm: true },
    },
  };
}

// ============================================
//  LIGHT THEME
// ============================================
export const lightTheme: ThemeConfig = buildTheme(light);

// ============================================
//  DARK THEME
// ============================================
export const darkTheme: ThemeConfig = buildTheme(dark);
