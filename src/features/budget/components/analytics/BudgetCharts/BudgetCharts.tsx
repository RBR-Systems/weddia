"use client";
import { useMemo } from "react";
import type { FC } from "react";
import { Row, Col, Empty } from "antd";
import Card from "@/shared/components/Card/Card";
import {
  PieChart, Pie, Cell, Sector,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  AreaChart, Area,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import type { Category, Expense, ChartTooltipProps, ChartTooltipEntry } from "../../../models/budget.models";
import { CHART_COLORS, COMPARISON_COLORS, SEMANTIC_CHART_COLORS, resolveChartColor } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";
import { DATE_DISPLAY_LOCALE, CHART_LABEL_MAX_CHARS } from "../../../constants/budget.constants";
import styles from "./BudgetCharts.module.css";

const CHART_HEIGHT = 300;

// ── Tooltip ────────────────────────────────────────────────────────────────

export const CustomTooltip: FC<ChartTooltipProps> = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry: ChartTooltipEntry) => (
        <p key={entry.name} className={styles.tooltipEntry}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className={styles.tooltipValue}>{formatCurrency(entry.value, currency)}</span>
        </p>
      ))}
    </div>
  );
};

const CumulativeTooltip: FC<ChartTooltipProps & { totalBudget: number }> = ({ active, payload, label, currency, totalBudget }) => {
  if (!active || !payload?.length) return null;
  const cumulative = payload.find((p: ChartTooltipEntry) => p.name !== "Presupuesto")?.value ?? 0;
  const pct = totalBudget > 0 ? ((cumulative / totalBudget) * 100).toFixed(1) : "—";
  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload
        .filter((e: ChartTooltipEntry) => e.name !== "Presupuesto")
        .map((entry: ChartTooltipEntry) => (
          <p key={entry.name} className={styles.tooltipEntry}>
            <span className={styles.tooltipDot} style={{ background: entry.color }} />
            <span>{entry.name}</span>
            <span className={styles.tooltipValue}>{formatCurrency(entry.value, currency)}</span>
          </p>
        ))}
      <div className={styles.tooltipDivider} />
      <p className={styles.tooltipTotal}>
        <span>% del presupuesto</span>
        <span>{pct}%</span>
      </p>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

function yAxisFormatter(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

const GRID_PROPS = { strokeDasharray: "3 3", strokeOpacity: 0.35 };

// ── Active shape for donut hover ───────────────────────────────────────────

interface ActiveShapeProps {
  cx: number; cy: number;
  innerRadius: number; outerRadius: number;
  startAngle: number; endAngle: number;
  fill: string;
  payload: { name: string };
  percent: number;
  value: number;
}

function ActiveDonutShape(props: object) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as ActiveShapeProps;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function BudgetCharts() {
  const { state } = useBudget();
  const { t } = useTranslation();
  const { mode } = useTheme();
  const colors = CHART_COLORS[mode];
  const comparison = COMPARISON_COLORS[mode];
  const semantic = SEMANTIC_CHART_COLORS[mode];

  const categoryPieData = useMemo(
    () =>
      state.categories
        .filter((c: Category) => c.spent > 0)
        .map((c: Category, i: number) => ({
          name: c.name,
          value: c.spent,
          color: resolveChartColor(c.color || colors[i % colors.length], mode),
        })),
    [state.categories, colors, mode],
  );

  const totalPieSpent = useMemo(
    () => categoryPieData.reduce((sum, d) => sum + d.value, 0),
    [categoryPieData],
  );

  const budgetVsActualData = state.categories.map((c: Category) => ({
    name: c.name.length > CHART_LABEL_MAX_CHARS ? c.name.substring(0, CHART_LABEL_MAX_CHARS) + "…" : c.name,
    fullName: c.name,
    allocated: c.allocated,
    spent: c.spent,
  }));

  const monthlySpendingData = useMemo(() => {
    const months: Record<string, number> = {};
    state.expenses.forEach((e: Expense) => {
      const month = new Date(e.expense_date).toLocaleDateString(DATE_DISPLAY_LOCALE, {
        year: "numeric", month: "short",
      });
      months[month] = (months[month] || 0) + e.amount;
    });
    return Object.entries(months)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [state.expenses]);

  const cumulativeSpendingData = useMemo(() => {
    const sorted = [...state.expenses].sort(
      (a: Expense, b: Expense) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    );
    let cumulative = 0;
    return sorted.map((e: Expense) => {
      cumulative += e.amount;
      return {
        date: new Date(e.expense_date).toLocaleDateString(DATE_DISPLAY_LOCALE, { month: "short", day: "numeric" }),
        cumulative,
        budget: state.summary?.total_budget || 0,
      };
    });
  }, [state.expenses, state.summary?.total_budget]);

  const totalBudget = state.summary?.total_budget || 0;

  // gradient ids — unique per chart
  const gradientLineId = "gradientLine";
  const gradientCumId = "gradientCum";

  if (state.categories.length === 0 && state.expenses.length === 0) {
    return (
      <Card>
        <Empty description={t("budgetCharts.noData")} />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>

      {/* ── 1. Donut: Spending by Category ── */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.spendingByCategory")}>
          {categoryPieData.length > 0 ? (
            <div className={styles.donutWrapper}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="47%"
                    innerRadius={68}
                    outerRadius={100}
                    dataKey="value"
                    labelLine={false}
                    activeShape={ActiveDonutShape}
                  >
                    {categoryPieData.map((entry: ChartTooltipEntry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => formatCurrency(Number(value ?? 0), state.currency)}
                    contentStyle={{
                      background: "var(--card-background)",
                      border: "1px solid var(--card-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* center label overlay */}
              <div className={styles.donutCenter}>
                <span className={styles.donutCenterLabel}>{t("budgetCharts.spent", "Gastado")}</span>
                <span className={styles.donutCenterValue}>
                  {formatCurrency(totalPieSpent, state.currency)}
                </span>
                {totalBudget > 0 && (
                  <span className={styles.donutCenterSub}>
                    {((totalPieSpent / totalBudget) * 100).toFixed(0)}% del total
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Empty description={t("budgetCharts.noSpendingData")} />
          )}
        </Card>
      </Col>

      {/* ── 2. Bar: Budget vs Actual ── */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.budgetVsActual")}>
          {budgetVsActualData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={budgetVsActualData} barGap={4} barCategoryGap="30%">
                <CartesianGrid vertical={false} {...GRID_PROPS} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 12 }} width={48} />
                <Tooltip content={<CustomTooltip currency={state.currency} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="allocated"
                  fill={comparison.primary}
                  name={t("budgetCharts.allocated")}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="spent"
                  fill={comparison.secondary}
                  name={t("budgetCharts.spent")}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t("budgetCharts.noCategoryData")} />
          )}
        </Card>
      </Col>

      {/* ── 3. Area: Monthly Spending Trend ── */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.monthlySpendingTrend")}>
          {monthlySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={monthlySpendingData}>
                <defs>
                  <linearGradient id={gradientLineId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={comparison.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={comparison.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} {...GRID_PROPS} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 12 }} width={48} />
                <Tooltip
                  formatter={(value: unknown) => formatCurrency(Number(value ?? 0), state.currency)}
                  contentStyle={{
                    background: "var(--card-background)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 8,
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={comparison.primary}
                  strokeWidth={2.5}
                  fill={`url(#${gradientLineId})`}
                  dot={{ r: 4, fill: comparison.primary, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: comparison.primary, stroke: "white", strokeWidth: 2 }}
                  name={t("budgetCharts.spending")}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t("budgetCharts.noSpendingData")} />
          )}
        </Card>
      </Col>

      {/* ── 4. Area: Cumulative vs Budget ── */}
      <Col xs={24} lg={12}>
        <Card title={t("budgetCharts.cumulativeVsBudget")}>
          {cumulativeSpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={cumulativeSpendingData}>
                <defs>
                  <linearGradient id={gradientCumId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={semantic.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={semantic.success} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} {...GRID_PROPS} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 12 }} width={48} />
                <Tooltip
                  content={
                    <CumulativeTooltip
                      currency={state.currency}
                      totalBudget={totalBudget}
                    />
                  }
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                {totalBudget > 0 && (
                  <ReferenceLine
                    y={totalBudget}
                    stroke={semantic.error}
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{
                      value: t("budgetCharts.totalBudget", "Presupuesto"),
                      position: "insideTopRight",
                      fontSize: 11,
                      fill: semantic.error,
                      dy: -6,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={semantic.success}
                  strokeWidth={2.5}
                  fill={`url(#${gradientCumId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: semantic.success, stroke: "white", strokeWidth: 2 }}
                  name={t("budgetCharts.cumulativeSpent")}
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
