"use client";
import React from "react";
import { Tag } from "antd";
import type { TagProps } from "antd";
import { useTheme } from "@/theme/ThemeProvider";

interface CategoryTagProps extends Omit<TagProps, "color"> {
  color?: string;
  children: React.ReactNode;
}

/**
 * Parses a hex color string to RGB components.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace("#", "");
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(sanitized);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/**
 * A theme-aware Tag that handles raw hex category colors with proper
 * light/dark mode support.
 *
 * - Hex colors (e.g. "#1890ff") → renders a soft tinted background with
 *   the hex as text color (light mode) or a lightened version (dark mode).
 * - Ant Design preset names ("blue", "success", etc.) → passed through
 *   to <Tag color=…> unchanged — these are already theme-aware.
 */
export default function CategoryTag({
  color,
  children,
  style,
  ...rest
}: CategoryTagProps) {
  const { mode } = useTheme();

  // No color, or an Ant Design preset/status name (no '#') → pass through
  if (!color || !color.startsWith("#")) {
    return (
      <Tag color={color} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  const rgb = hexToRgb(color);
  if (!rgb) {
    return (
      <Tag color={color} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  const isDark = mode === "dark";
  const { r, g, b } = rgb;

  const lighten = (v: number, amount: number) => Math.min(v + amount, 255);
  const darken = (v: number, amount: number) => Math.max(v - amount, 0);

  // Matches Ant Design preset-color Tag look & feel:
  //  • light mode – soft tinted bg, subtle border, saturated text
  //  • dark  mode – dark tinted bg, muted border, bright text that pops
  const tagStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: `rgba(${darken(r, 40)}, ${darken(g, 40)}, ${darken(b, 40)}, 0.35)`,
        borderColor: `rgba(${r}, ${g}, ${b}, 0.30)`,
        color: `rgb(${lighten(r, 80)}, ${lighten(g, 80)}, ${lighten(b, 80)})`,
        ...style,
      }
    : {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
        borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
        color: color,
        ...style,
      };

  return (
    <Tag style={tagStyle} {...rest}>
      {children}
    </Tag>
  );
}
