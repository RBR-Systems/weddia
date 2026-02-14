"use client";
import React, { useState } from "react";
import { Row, Col, Tooltip, InputNumber, Space, Typography } from "antd";
import { EditOutlined, CheckOutlined } from "@ant-design/icons";
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";
import Card from "@/app/common/Card/card";
import { useBudget } from "../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function BudgetStats() {
  const { t } = useTranslation();
  const { state, updateBudget } = useBudget();
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(0);

  if (state.isLoading || !state.summary) return null;

  const { summary, expenses, categories, currency } = state;
  const totalAllocated = categories.reduce(
    (sum: number, c: any) => sum + (c.allocated ?? 0),
    0,
  );
  const expenseCount = expenses?.length ?? 0;
  const avgExpense = expenseCount > 0 ? summary.total_spent / expenseCount : 0;
  const largestExpense =
    expenseCount > 0 ? Math.max(...expenses.map((e: any) => e.amount)) : 0;
  const topCategory =
    categories && categories.length > 0
      ? categories.reduce((a: any, b: any) =>
          (b.spent ?? 0) > (a.spent ?? 0) ? b : a,
        )
      : null;

  const handleEditBudget = () => {
    setBudgetInput(summary.total_budget);
    setEditingBudget(true);
  };

  const handleSaveBudget = () => {
    updateBudget(budgetInput);
    setEditingBudget(false);
  };

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{ cursor: "pointer" }}
          onClick={!editingBudget ? handleEditBudget : undefined}
        >
          {editingBudget ? (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text type="secondary">{t("budgetStats.totalBudget")}</Text>
              <InputNumber
                autoFocus
                min={0}
                step={1000}
                value={budgetInput}
                onChange={(v) => setBudgetInput(v ?? 0)}
                onPressEnter={handleSaveBudget}
                onBlur={handleSaveBudget}
                formatter={(value) =>
                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  Number(value?.replace(/\$\s?|(,*)/g, "") || 0)
                }
                style={{ width: "100%" }}
                size="large"
              />
            </Space>
          ) : (
            <Tooltip title={t("budgetStats.clickToEdit")}>
              <Space>
                <Statistic
                  title={t("budgetStats.totalBudget")}
                  value={formatCurrency(summary.total_budget, currency)}
                />
                <EditOutlined style={{ color: "var(--text-secondary)", fontSize: 14 }} />
              </Space>
            </Tooltip>
          )}
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t("budgetStats.totalAllocated")}
            value={formatCurrency(totalAllocated, currency)}
            valueStyle={
              totalAllocated > summary.total_budget || totalAllocated < 0
                ? { color: "var(--budget-danger)" }
                : undefined
            }
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t("budgetStats.totalSpent")}
            value={formatCurrency(summary.total_spent, currency)}
            valueStyle={summary.total_spent < 0 ? { color: "var(--budget-danger)" } : undefined}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t("budgetStats.remaining")}
            value={formatCurrency(summary.total_remaining, currency)}
            valueStyle={summary.total_remaining < 0 ? { color: "var(--budget-danger)" } : undefined}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic
            title={t("budgetStats.spentPercent")}
            value={summary.percentage_spent}
            suffix="%"
            valueStyle={summary.percentage_spent >= 100 ? { color: "var(--budget-danger)" } : undefined}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic title={t("budgetStats.expensesCount")} value={expenseCount} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic
            title={t("budgetStats.averageExpense")}
            value={formatCurrency(avgExpense, currency)}
            valueStyle={avgExpense < 0 ? { color: "var(--budget-danger)" } : undefined}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Tooltip title={topCategory ? topCategory.name : "—"}>
            <Statistic
              title={t("budgetStats.topCategory")}
              value={topCategory ? `${topCategory.name}` : "—"}
            />
          </Tooltip>
        </Card>
      </Col>
    </Row>
  );
}
