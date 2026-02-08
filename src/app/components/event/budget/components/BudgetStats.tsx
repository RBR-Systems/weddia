"use client";
import React from "react";
import { Row, Col, Tooltip } from "antd";
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";
import Card from "@/app/common/Card/card";
import { useBudget } from "../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import { useTranslation } from "react-i18next";

export default function BudgetStats() {
  const { t } = useTranslation();
  const { state } = useBudget();
  if (state.isLoading || !state.summary) return null;

  const { summary, expenses, categories, currency } = state;
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

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t("budgetStats.totalBudget")}
            value={formatCurrency(summary.total_budget, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t("budgetStats.totalSpent")}
            value={formatCurrency(summary.total_spent, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title={t("budgetStats.remaining")}
            value={formatCurrency(summary.total_remaining, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title={t("budgetStats.spentPercent")} value={summary.percentage_spent} suffix="%" />
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
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic
            title={t("budgetStats.largestExpense")}
            value={formatCurrency(largestExpense, currency)}
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
