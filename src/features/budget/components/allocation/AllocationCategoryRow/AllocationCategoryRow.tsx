"use client";
import React, { useCallback } from "react";
import { Slider, InputNumber, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/shared/utils/formatters.utils";
import type { Category, Currency } from "../../../models/budget.models";
import styles from "./AllocationCategoryRow.module.css";

const { Text } = Typography;

interface AllocationCategoryRowProps {
  category: Category;
  totalBudget: number;
  currency: Currency;
  onSliderChange: (id: string, value: number) => void;
  onInputChange: (id: string, value: number | null) => void;
}

const formatAllocationInput = (value?: number | string) => `$ ${formatInputNumber(value)}`;
const parseAllocationInput = (value?: string) => Number(parseInputNumber(value));

export const AllocationCategoryRow = React.memo(function AllocationCategoryRow({
  category,
  totalBudget,
  currency,
  onSliderChange,
  onInputChange,
}: AllocationCategoryRowProps) {
  const { t } = useTranslation();

  const allocated = category.allocated ?? 0;
  const percentage =
    totalBudget > 0 ? Number.parseFloat(((allocated / totalBudget) * 100).toFixed(1)) : 0;
  const remainingValue = category.remaining ?? 0;
  const remainingLabel =
    (remainingValue >= 0 ? "+" : "–") + formatCurrency(Math.abs(remainingValue), currency);
  const categoryColor = category.color ?? "var(--status-in-progress)";

  const handleSliderChange = useCallback(
    (value: number) => onSliderChange(category.id, value),
    [category.id, onSliderChange],
  );

  const handleInputChange = useCallback(
    (value: number | null) => onInputChange(category.id, value),
    [category.id, onInputChange],
  );

  return (
    <div
      className={styles.rowCard}
      style={{ "--category-color": categoryColor } as React.CSSProperties}
    >
      <div className={styles.categoryRow}>
        <div className={styles.categoryLeft}>
          <span className={styles.categoryDot} style={{ backgroundColor: categoryColor }} />
          <Text strong>{category.name}</Text>
        </div>
        <div className={styles.categoryRight}>
          <span className={styles.pctBadge}>{percentage}%</span>
          <Text className={styles.remaining}>{t("budgetAllocation.remaining", { amount: remainingLabel })}</Text>
        </div>
      </div>

      <div className={styles.sliderRow}>
        <div className={styles.sliderWrap}>
          <Slider
            min={0}
            max={totalBudget}
            step={100}
            value={allocated}
            onChange={handleSliderChange}
            trackStyle={{ backgroundColor: categoryColor }}
            handleStyle={{ borderColor: categoryColor }}
          />
        </div>
        <div className={styles.inputWrap}>
          <InputNumber
            min={0}
            max={totalBudget * 2}
            step={100}
            value={allocated}
            onChange={handleInputChange}
            formatter={formatAllocationInput}
            parser={parseAllocationInput}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div className={styles.allocatedFooter}>
        {t("budgetAllocation.allocated", { amount: formatCurrency(allocated, currency) })}
      </div>
    </div>
  );
});
