"use client";
import React from "react";
import { Progress, Tooltip } from "antd";
import { formatCurrency } from "@/utils/formatters";
import { SEMANTIC_CHART_COLORS } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";

interface BudgetProgressProps {
  spent: number;
  allocated: number;
  currency?: string;
  showInfo?: boolean;
  size?: "small" | "default";
}

export default function BudgetProgress({
  spent,
  allocated,
  currency = "USD",
  showInfo = true,
  size = "default",
}: BudgetProgressProps) {
  const { mode } = useTheme();
  const semantic = SEMANTIC_CHART_COLORS[mode];
  const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

  const getStatus = (): "success" | "normal" | "exception" | "active" => {
    if (percentage >= 100) return "exception";
    if (percentage >= 80) return "normal";
    return "success";
  };

  const getStrokeColor = () => {
    if (percentage >= 100) return semantic.error;
    if (percentage >= 80) return semantic.warning;
    return semantic.success;
  };

  return (
    <Tooltip
      title={`${formatCurrency(spent, currency)} of ${formatCurrency(allocated, currency)} (${percentage}%)`}
    >
      <Progress
        percent={Math.min(percentage, 100)}
        status={getStatus()}
        strokeColor={getStrokeColor()}
        showInfo={showInfo}
        size={size}
      />
    </Tooltip>
  );
}
