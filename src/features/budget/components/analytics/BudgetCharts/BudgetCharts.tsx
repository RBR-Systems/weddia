"use client";
import { useMemo } from "react";
import type { FC } from "react";
import { Row, Col, Empty } from "antd";
import Card from "@/shared/components/Card/Card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { useTranslation } from "react-i18next";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import type { Category, Expense, ChartTooltipProps, ChartTooltipEntry } from "../../../models/budget.models";
import { CHART_COLORS, COMPARISON_COLORS, SEMANTIC_CHART_COLORS, resolveChartColor } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";
import { DATE_DISPLAY_LOCALE, CHART_LABEL_MAX_CHARS } from "../../../constants/budget.constants";
import styles from "./BudgetCharts.module.css";

export const CustomTooltip: FC<ChartTooltipProps> = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry: ChartTooltipEntry) => (
        <p key={entry.name} className={styles.tooltipEntry} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
};



export default function BudgetCharts() {
  const { state } = useBudget();
  const { t } = useTranslation();
  const { mode } = useTheme();

  // Resolve palettes for current theme
  const colors = CHART_COLORS[mode];
  const comparison = COMPARISON_COLORS[mode];
  const semantic = SEMANTIC_CHART_COLORS[mode];

  const categoryPieData = useMemo(
    () =>
      state.categories
        .filter((c: Category) => c.spent > 0)
        .map((c: Category, index: number) => ({
          name: c.name,
          value: c.spent,
          color: resolveChartColor(c.color || colors[index % colors.length], mode),
        })),
    [state.categories, colors, mode],
  );

  const budgetVsActualData = state.categories.map((c: Category) => ({
    name: c.name.length > CHART_LABEL_MAX_CHARS ? c.name.substring(0, CHART_LABEL_MAX_CHARS) + "..." : c.name,
    fullName: c.name,
    allocated: c.allocated,
    spent: c.spent,
    remaining: c.allocated - c.spent,
  }));

  const monthlySpendingData = useMemo(() => {
    const months: Record<string, number> = {};

    state.expenses.forEach((e: Expense) => {
      const month = new Date(e.expense_date).toLocaleDateString(DATE_DISPLAY_LOCALE, {
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

  const cumulativeSpendingData = useMemo(() => {
    const sorted = [...state.expenses].sort(
      (a: Expense, b: Expense) =>
        new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    );

    let cumulative = 0;
    return sorted.map((e: Expense) => {
      cumulative += e.amount;
      return {
        date: new Date(e.expense_date).toLocaleDateString(DATE_DISPLAY_LOCALE, {
          month: "short",
          day: "numeric",
        }),
        cumulative,
        budget: state.summary?.total_budget || 0,
      };
    });
  }, [state.expenses, state.summary?.total_budget]);



  if (state.categories.length === 0 && state.expenses.length === 0) {
    return (
      <Card>
        <Empty description={t("budgetCharts.noData")} />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {/* Category Spending Breakdown */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.spendingByCategory")}>
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
                  {categoryPieData.map((entry: ChartTooltipEntry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) =>
                    formatCurrency(Number(value ?? 0), state.currency)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t("budgetCharts.noSpendingData")} />
          )}
        </Card>
      </Col>

      {/* Budget vs Actual */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.budgetVsActual")}>
          {budgetVsActualData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetVsActualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip currency={state.currency} />} />
                <Legend />
                <Bar dataKey="allocated" fill={comparison.primary} name={t("budgetCharts.allocated")} />
                <Bar dataKey="spent" fill={comparison.secondary} name={t("budgetCharts.spent")} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t("budgetCharts.noCategoryData")} />
          )}
        </Card>
      </Col>

      {/* Monthly Spending Trend */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.monthlySpendingTrend")}>
          {monthlySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: unknown) =>
                    formatCurrency(Number(value ?? 0), state.currency)
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={comparison.primary}
                  strokeWidth={2}
                  name={t("budgetCharts.spending")}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t("budgetCharts.noSpendingData")} />
          )}
        </Card>
      </Col>

      {/* Cumulative Spending */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.cumulativeVsBudget")}>
          {cumulativeSpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cumulativeSpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: unknown) =>
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
                  name={t("budgetCharts.cumulativeSpent")}
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke={semantic.error}
                  strokeDasharray="5 5"
                  name={t("budgetCharts.totalBudget")}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t("budgetCharts.noExpenseData")} />
          )}
        </Card>
      </Col>
    </Row>
  );
}
