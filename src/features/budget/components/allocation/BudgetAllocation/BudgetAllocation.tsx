"use client";
import { useState, useCallback } from "react";
import { Card, Row, Col, InputNumber, Typography, Space, Button, Divider, Alert, Tooltip } from "antd";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import { useTranslation } from "react-i18next";
import { EditOutlined } from "@ant-design/icons";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/shared/utils/formatters.utils";
import { computeAllocatedTotal } from "../../../utils/budget.utils";
import { AllocationCategoryRow } from "../AllocationCategoryRow/AllocationCategoryRow";
import type { Category } from "../../../models/budget.models";
import styles from "./BudgetAllocation.module.css";

const { Title, Text } = Typography;

const CURSOR_POINTER_STYLE = { cursor: "pointer" } as const;
const EDIT_ICON_STYLE = { color: "var(--text-secondary)", fontSize: 14 } as const;
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
        <Space>
          <Button onClick={distributeEvenly}>{t("budgetAllocation.distributeEvenly")}</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card
            size="small"
            style={CURSOR_POINTER_STYLE}
            onClick={editingBudget ? undefined : handleEditBudget}
          >
            {editingBudget ? (
              <Space orientation="vertical" className={styles.fullWidth}>
                <Text type="secondary">{t("budgetAllocation.totalBudget")}</Text>
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
                  className={styles.fullWidth}
                  size="large"
                />
              </Space>
            ) : (
              <Tooltip title={t("budgetStats.clickToEdit")}>
                <Space>
                  <Statistic
                    title={t("budgetAllocation.totalBudget")}
                    value={formatCurrency(totalBudget, state.currency)}
                  />
                  <EditOutlined style={EDIT_ICON_STYLE} />
                </Space>
              </Tooltip>
            )}
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Title level={5}>{t("budgetAllocation.allocation")}</Title>
            <Statistic value={totalAllocated} formatter={formatAsCurrency} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Title level={5}>{t("budgetAllocation.unallocated")}</Title>
            <Statistic
              value={unallocated}
              formatter={formatAsCurrency}
              styles={{ content: { color: unallocated < 0 ? "var(--budget-danger)" : undefined } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Title level={5}>{t("budgetAllocation.allocationPercent")}</Title>
            <Statistic
              value={allocationPercentage}
              suffix="%"
              styles={{ content: { color: allocationPercentage > 100 ? "var(--budget-danger)" : undefined } }}
            />
          </Card>
        </Col>
      </Row>

      {unallocated < 0 && (
        <Alert
          title={t("budgetAllocation.overAllocatedTitle")}
          description={t("budgetAllocation.overAllocatedDesc", {
            amount: formatCurrency(Math.abs(unallocated), state.currency),
          })}
          type="error"
          showIcon
          className={styles.overAllocatedAlert}
        />
      )}

      <Divider />

      <Space orientation="vertical" className={styles.fullWidth} size="large">
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
      </Space>
    </Card>
  );
}

