"use client";
import React from "react";
import { Row, Col, Typography, Empty } from "antd";
import Card from "@/app/common/Card/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import type { Category, Expense } from "../../types/budget.types";
import { CHART_COLORS, COMPARISON_COLORS, SEMANTIC_CHART_COLORS, resolveChartColor } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";

const { Title } = Typography;

export default function BudgetCharts() {
  const { state } = useBudget();
  const { mode } = useTheme();

  // Resolve palettes for current theme
  const colors = CHART_COLORS[mode];
  const comparison = COMPARISON_COLORS[mode];
  const semantic = SEMANTIC_CHART_COLORS[mode];

  // Pie chart data - Category spending breakdown
  const categoryPieData = state.categories
    .filter((c: Category) => c.spent > 0)
    .map((c: Category, index: number) => ({
      name: c.name,
      value: c.spent,
      color: resolveChartColor(c.color || colors[index % colors.length], mode),
    }));

  // Bar chart data - Budget vs Actual per category
  const budgetVsActualData = state.categories.map((c: Category) => ({
    name: c.name.length > 10 ? c.name.substring(0, 10) + "..." : c.name,
    fullName: c.name,
    allocated: c.allocated,
    spent: c.spent,
    remaining: c.allocated - c.spent,
  }));

  // Line chart data - Monthly spending trend (simulated from expenses)
  const monthlySpendingData = React.useMemo(() => {
    const months: Record<string, number> = {};

    state.expenses.forEach((e: Expense) => {
      const month = new Date(e.expense_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      months[month] = (months[month] || 0) + e.amount;
    });

    return Object.entries(months)
      .map(([month, amount]) => ({ month, amount }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
      );
  }, [state.expenses]);

  // Area chart data - Cumulative spending over time
  const cumulativeSpendingData = React.useMemo(() => {
    const sorted = [...state.expenses].sort(
      (a: Expense, b: Expense) =>
        new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    );

    let cumulative = 0;
    return sorted.map((e: Expense) => {
      cumulative += e.amount;
      return {
        date: new Date(e.expense_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        cumulative,
        budget: state.summary?.total_budget || 0,
      };
    });
  }, [state.expenses, state.summary?.total_budget]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "var(--card-background)",
            color: "var(--text-color)",
            padding: "10px",
            border: "1px solid var(--card-border)",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, state.currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (state.categories.length === 0 && state.expenses.length === 0) {
    return (
      <Card>
        <Empty description="Add expenses and categories to see charts" />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {/* Category Spending Breakdown */}
      <Col xs={24} lg={12}>
        <Card title="Spending by Category">
          {categoryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryPieData.map(
                    (
                      entry: { name: string; value: number; color: string },
                      index: number,
                    ) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ),
                  )}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    formatCurrency(Number(value ?? 0), state.currency)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No spending data yet" />
          )}
        </Card>
      </Col>

      {/* Budget vs Actual */}
      <Col xs={24} lg={12}>
        <Card title="Budget vs Actual">
          {budgetVsActualData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetVsActualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="allocated" fill={comparison.primary} name="Allocated" />
                <Bar dataKey="spent" fill={comparison.secondary} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No category data yet" />
          )}
        </Card>
      </Col>

      {/* Monthly Spending Trend */}
      <Col xs={24} lg={12}>
        <Card title="Monthly Spending Trend">
          {monthlySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    formatCurrency(Number(value ?? 0), state.currency)
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={comparison.primary}
                  strokeWidth={2}
                  name="Spending"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No spending data yet" />
          )}
        </Card>
      </Col>

      {/* Cumulative Spending */}
      <Col xs={24} lg={12}>
        <Card title="Cumulative Spending vs Budget">
          {cumulativeSpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cumulativeSpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    formatCurrency(Number(value ?? 0), state.currency)
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={semantic.success}
                  fill={semantic.success}
                  fillOpacity={0.3}
                  name="Cumulative Spent"
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke={semantic.error}
                  strokeDasharray="5 5"
                  name="Total Budget"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No expense data yet" />
          )}
        </Card>
      </Col>
    </Row>
  );
}
