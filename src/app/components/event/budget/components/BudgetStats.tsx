"use client";
import React from "react";
import { Row, Col, Card, Statistic, Tooltip } from "antd";
import { useBudget } from "../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";

export default function BudgetStats() {
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
            title="Total Budget"
            value={formatCurrency(summary.total_budget, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Spent"
            value={formatCurrency(summary.total_spent, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Remaining"
            value={formatCurrency(summary.total_remaining, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic title="Spent %" value={`${summary.percentage_spent}%`} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic title="Expenses Count" value={expenseCount} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic
            title="Average Expense"
            value={formatCurrency(avgExpense, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Statistic
            title="Largest Expense"
            value={formatCurrency(largestExpense, currency)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6} style={{ marginTop: 16 }}>
        <Card>
          <Tooltip title={topCategory ? topCategory.name : "—"}>
            <Statistic
              title="Top Category"
              value={topCategory ? `${topCategory.name}` : "—"}
            />
          </Tooltip>
        </Card>
      </Col>
    </Row>
  );
}
