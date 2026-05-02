"use client";
import { useState, useCallback } from "react";
import { Card, Row, Col, InputNumber, Typography, Space, Button, Divider, Alert } from "antd";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import { useTranslation } from "react-i18next";
import { EditOutlined, CheckOutlined } from "@ant-design/icons";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/shared/utils/formatters.utils";
import { computeAllocatedTotal } from "../../../utils/budget.utils";
import { AllocationCategoryRow } from "../AllocationCategoryRow/AllocationCategoryRow";
import type { Category } from "../../../models/budget.models";
import styles from "./BudgetAllocation.module.css";

const { Text } = Typography;

const formatBudgetInput = (value?: number | string) => `$ ${formatInputNumber(value)}`;
const parseBudgetInput = (value?: string) => Number(parseInputNumber(value));

export function BudgetAllocation() {
  const { state, updateCategory, updateBudget } = useBudget();
  const { t } = useTranslation();

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(0);

  const totalBudget = state.summary?.total_budget ?? 0;
  const totalAllocated = computeAllocatedTotal(state.categories);
  const unallocated = totalBudget - totalAllocated;
  const allocationPercentage =
    totalBudget > 0 ? Number.parseFloat(((totalAllocated / totalBudget) * 100).toFixed(2)) : 0;

  const handleEditBudget = () => {
    setBudgetInput(totalBudget);
    setEditingBudget(true);
  };

  const handleSaveBudget = () => {
    updateBudget(budgetInput);
    setEditingBudget(false);
  };

  const handleSliderChange = useCallback(
    (categoryId: string, value: number) => updateCategory?.(categoryId, { allocated: value }),
    [updateCategory],
  );

  const handleInputChange = useCallback(
    (categoryId: string, value: number | null) => {
      if (value !== null) updateCategory?.(categoryId, { allocated: value });
    },
    [updateCategory],
  );

  const distributeEvenly = () => {
    const perCategory = Math.floor(totalBudget / state.categories.length);
    state.categories.forEach((c: Category) => updateCategory?.(c.id, { allocated: perCategory }));
  };

  const formatAsCurrency = useCallback(
    (v: number | string) => formatCurrency(Number(v), state.currency),
    [state.currency],
  );

  return (
    <Card
      title={t("budgetAllocation.title")}
      extra={
        <Button size="small" onClick={distributeEvenly}>
          {t("budgetAllocation.distributeEvenly")}
        </Button>
      }
    >
      <Row gutter={[12, 12]}>
        {/* Total Budget — editable */}
        <Col xs={12} sm={12} md={6}>
          <Card
            size="small"
            className={styles.statCard}
            style={{ "--accent-color": "var(--primary)" } as React.CSSProperties}
            styles={{ body: { cursor: editingBudget ? "default" : "pointer" } }}
            onClick={editingBudget ? undefined : handleEditBudget}
          >
            {editingBudget ? (
              <Space.Compact style={{ width: "100%" }}>
                <InputNumber
                  autoFocus
                  min={0}
                  step={1000}
                  value={budgetInput}
                  onChange={(v) => setBudgetInput(v ?? 0)}
                  onPressEnter={handleSaveBudget}
                  onBlur={handleSaveBudget}
                  formatter={formatBudgetInput}
                  parser={parseBudgetInput}
                  style={{ width: "100%" }}
                />
                <Button icon={<CheckOutlined />} onClick={handleSaveBudget} type="primary" />
              </Space.Compact>
            ) : (
              <Statistic
                title={
                  <span>
                    {t("budgetAllocation.totalBudget")}{" "}
                    <EditOutlined style={{ fontSize: 11, opacity: 0.4 }} />
                  </span>
                }
                value={formatCurrency(totalBudget, state.currency)}
              />
            )}
          </Card>
        </Col>

        {/* Total Allocated */}
        <Col xs={12} sm={12} md={6}>
          <Card
            size="small"
            className={styles.statCard}
            style={{ "--accent-color": "var(--status-in-progress)" } as React.CSSProperties}
          >
            <Statistic
              title={t("budgetAllocation.allocation")}
              value={totalAllocated}
              formatter={formatAsCurrency}
            />
          </Card>
        </Col>

        {/* Unallocated */}
        <Col xs={12} sm={12} md={6}>
          <Card
            size="small"
            className={styles.statCard}
            style={{ "--accent-color": unallocated < 0 ? "var(--budget-danger)" : "var(--status-completed)" } as React.CSSProperties}
          >
            <Statistic
              title={t("budgetAllocation.unallocated")}
              value={unallocated}
              formatter={formatAsCurrency}
              styles={{ content: { color: unallocated < 0 ? "var(--budget-danger)" : undefined } }}
            />
          </Card>
        </Col>

        {/* Allocation % */}
        <Col xs={12} sm={12} md={6}>
          <Card
            size="small"
            className={styles.statCard}
            style={{ "--accent-color": allocationPercentage > 100 ? "var(--budget-danger)" : "var(--primary)" } as React.CSSProperties}
          >
            <Statistic
              title={t("budgetAllocation.allocationPercent")}
              value={allocationPercentage}
              suffix="%"
              styles={{ content: { color: allocationPercentage > 100 ? "var(--budget-danger)" : undefined } }}
            />
          </Card>
        </Col>
      </Row>

      {unallocated < 0 && (
        <Alert
          message={t("budgetAllocation.overAllocatedTitle")}
          description={t("budgetAllocation.overAllocatedDesc", {
            amount: formatCurrency(Math.abs(unallocated), state.currency),
          })}
          type="error"
          showIcon
          className={styles.overAllocatedAlert}
        />
      )}

      <Divider />

      {state.categories.length === 0 ? (
        <Text type="secondary">{t("budgetAllocation.noCategories")}</Text>
      ) : (
        <div className={styles.categoryList}>
          {state.categories.map((category: Category) => (
            <AllocationCategoryRow
              key={category.id}
              category={category}
              totalBudget={totalBudget}
              currency={state.currency}
              onSliderChange={handleSliderChange}
              onInputChange={handleInputChange}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
