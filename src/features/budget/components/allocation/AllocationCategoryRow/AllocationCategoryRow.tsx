"use client";
import React, { useCallback } from "react";
import { Row, Col, Slider, InputNumber, Typography, Space } from "antd";
import { useTranslation } from "react-i18next";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
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
    totalBudget > 0 ? Number.parseFloat(((allocated / totalBudget) * 100).toFixed(2)) : 0;
  // category.remaining is kept current by the reducer on every updateCategory call
  const remainingValue = category.remaining ?? 0;
  const remainingLabel =
    (remainingValue >= 0 ? "+" : "-") + formatCurrency(Math.abs(remainingValue), currency);
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
    <div>
      <div className={styles.categoryRow}>
        <Space>
          <span className={styles.categoryDot} style={{ backgroundColor: categoryColor }} />
          <Text strong>{category.name}</Text>
        </Space>
        <div>
          <Text type="secondary" className={styles.smallText}>
            <Statistic value={percentage} suffix={`% ${t("budgetAllocation.ofBudget")}`} />
            {t("budgetAllocation.remaining", { amount: remainingLabel })}
          </Text>
        </div>
      </div>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Slider
            min={0}
            max={totalBudget}
            step={100}
            value={allocated}
            onChange={handleSliderChange}
            trackStyle={{ backgroundColor: categoryColor }}
            handleStyle={{ borderColor: categoryColor }}
          />
        </Col>
        <Col flex="150px">
          <InputNumber
            min={0}
            max={totalBudget * 2}
            step={100}
            value={allocated}
            onChange={handleInputChange}
            formatter={formatAllocationInput}
            parser={parseAllocationInput}
            className="u-full-width"
          />
        </Col>
      </Row>
      <div className={styles.categoryFooter}>
        <Text type="secondary" className={styles.smallText}>
          {t("budgetAllocation.allocated", { amount: formatCurrency(allocated, currency) })}
        </Text>
      </div>
    </div>
  );
});
