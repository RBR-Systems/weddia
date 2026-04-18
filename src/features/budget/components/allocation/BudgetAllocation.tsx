"use client";
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Slider,
  InputNumber,
  Typography,
  Space,
  Button,
  Progress,
  Divider,
  Alert,
  Tooltip,
} from "antd";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import { useTranslation } from "react-i18next";
import { EditOutlined } from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/utils/formatters.utils";
import type { Category } from "../../models/budget.models";
import styles from "./BudgetAllocation.module.css";

const { Title, Text } = Typography;

export default function BudgetAllocation() {
  const { state, updateCategory, updateBudget } = useBudget();
  const { t } = useTranslation();

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(0);

  const totalBudget = state.summary?.total_budget ?? 0;
  const totalAllocated = state.categories.reduce(
    (sum: number, c: any) => sum + (c.allocated ?? 0),
    0,
  );
  const unallocated = totalBudget - totalAllocated;
  const allocationPercentage =
    totalBudget > 0 ? parseFloat(((totalAllocated / totalBudget) * 100).toFixed(2)) : 0;

  const handleEditBudget = () => {
    setBudgetInput(totalBudget);
    setEditingBudget(true);
  };

  const handleSaveBudget = () => {
    updateBudget(budgetInput);
    setEditingBudget(false);
  };

  const handleSliderChange = (categoryId: string, value: number) => {
    updateCategory?.(categoryId, { allocated: value });
  };

  const handleInputChange = (categoryId: string, value: number | null) => {
    if (value !== null) {
      updateCategory?.(categoryId, { allocated: value });
    }
  };

  const distributeEvenly = () => {
    const perCategory = Math.floor(totalBudget / state.categories.length);
    state.categories.forEach((c: Category) => {
      updateCategory?.(c.id, { allocated: perCategory });
    });
  };

  return (
    <Card
      title={t("budgetAllocation.title")}
      extra={
        <Space>
          <Button onClick={distributeEvenly}>
            {t("budgetAllocation.distributeEvenly")}
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card
            size="small"
            style={{ cursor: "pointer" }}
            onClick={!editingBudget ? handleEditBudget : undefined}
          >
            {editingBudget ? (
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Text type="secondary">{t("budgetAllocation.totalBudget")}</Text>
                <InputNumber
                  autoFocus
                  min={0}
                  step={1000}
                  value={budgetInput}
                  onChange={(v) => setBudgetInput(v ?? 0)}
                  onPressEnter={handleSaveBudget}
                  onBlur={handleSaveBudget}
                  formatter={(value) =>
                    `$ ${formatInputNumber(value)}`
                  }
                  parser={(value) => Number(parseInputNumber(value))}
                  style={{ width: "100%" }}
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
                  <EditOutlined style={{ color: "var(--text-secondary)", fontSize: 14 }} />
                </Space>
              </Tooltip>
            )}
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Title level={5}>{t("budgetAllocation.allocation")}</Title>
            <Statistic
              value={totalAllocated}
              formatter={(v) => formatCurrency(Number(v), state.currency)}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
              <Card size="small">
            <Title level={5}>{t("budgetAllocation.unallocated")}</Title>
            <Statistic
              value={unallocated}
              formatter={(v) => formatCurrency(Number(v), state.currency)}
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
        {state.categories.map((category: Category) => {
          const allocated = category.allocated ?? 0;
          const percentage =
            totalBudget > 0 ? parseFloat(((allocated / totalBudget) * 100).toFixed(2)) : 0;

          const remainingValue = allocated - (category.spent ?? 0);
          const remainingLabel =
            (remainingValue >= 0 ? "+" : "-") +
            formatCurrency(Math.abs(remainingValue), state.currency);

          return (
            <div key={category.id}>
              <div className={styles.categoryRow}>
                <Space>
                  <span
                    className={styles.categoryDot}
                    style={{
                      backgroundColor:
                        category.color || "var(--status-in-progress)",
                    }}
                  />
                  <Text strong>{category.name}</Text>
                </Space>
                <div style={{ textAlign: "right" }}>
                  <Text type="secondary" className={styles.smallText}>
                    <Statistic
                      value={percentage}
                      suffix={`% ${t("budgetAllocation.ofBudget")}`}
                    />
                    {t("budgetAllocation.remaining", {
                      amount: remainingLabel,
                    })}
                  </Text>
                  <div></div>
                </div>
              </div>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Slider
                    min={0}
                    max={totalBudget}
                    step={100}
                    value={allocated}
                    onChange={(value) => handleSliderChange(category.id, value)}
                    trackStyle={{
                      backgroundColor:
                        category.color || "var(--status-in-progress)",
                    }}
                    handleStyle={{
                      borderColor:
                        category.color || "var(--status-in-progress)",
                    }}
                  />
                </Col>
                <Col flex="150px">
                  <InputNumber
                    min={0}
                    max={totalBudget * 2}
                    step={100}
                    value={allocated}
                    onChange={(value) => handleInputChange(category.id, value)}
                    formatter={(value) =>
                      `$ ${formatInputNumber(value)}`
                    }
                    parser={(value) =>
                      Number(parseInputNumber(value))
                    }
                    className="u-full-width"
                  />
                </Col>
              </Row>
              <div className={styles.categoryFooter}>
                <Text type="secondary" className={styles.smallText}>
                  {t("budgetAllocation.allocated", {
                    amount: formatCurrency(allocated, state.currency),
                  })}
                </Text>
              </div>
            </div>
          );
        })}
      </Space>
    </Card>
  );
}
