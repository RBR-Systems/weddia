"use client";
import React, { useState } from "react";
import { Row, Col, Tooltip, InputNumber } from "antd";
import { EditOutlined, CheckOutlined, CloseOutlined, WalletOutlined, PieChartOutlined, ArrowDownOutlined, SafetyOutlined, PercentageOutlined, FileTextOutlined, BarChartOutlined, TrophyOutlined } from "@ant-design/icons";
import AnimatedStatistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import { useBudget } from "../contexts/BudgetContext";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/utils/formatters.utils";
import { useTranslation } from "react-i18next";
import getKeyboardActivationProps from "@/shared/utils/keyboardActivation";
import type { Category } from "../models/budget.models";
import styles from "./BudgetStats.module.css";

// ── Module-level pure helpers (keep complexity out of BudgetStats) ────────────

function pctOfBudget(amount: number, budget: number): number {
  return budget > 0 ? (amount / budget) * 100 : 0;
}

function getRemainingColor(remaining: number, budget: number): string {
  if (remaining < 0) return "var(--budget-danger)";
  if (remaining < budget * 0.2) return "var(--budget-warning)";
  return "var(--budget-success)";
}

function getSpentProgressColor(pct: number): string {
  if (pct >= 100) return "var(--budget-danger)";
  if (pct >= 80) return "var(--budget-warning)";
  return "var(--status-delayed)";
}

function getSpentTextColor(pct: number): string | undefined {
  if (pct >= 100) return "var(--budget-danger)";
  if (pct >= 80) return "var(--budget-warning)";
  return undefined;
}

function findTopCategory(categories: Category[]): Category | null {
  if (categories.length === 0) return null;
  return categories.reduce(
    (a, b) => (b.spent ?? 0) > (a.spent ?? 0) ? b : a,
    categories[0],
  );
}

// ── Sub-components (defined at module level — no inline components) ───────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  content: React.ReactNode;
  accentColor: string;
  subLabel?: string;
  progress?: number;
  progressColor?: string;
  onClick?: () => void;
  showEditHint?: boolean;
}

function StatCard({
  icon,
  label,
  content,
  accentColor,
  subLabel,
  progress,
  progressColor,
  onClick,
  showEditHint,
}: StatCardProps) {
  const kb = getKeyboardActivationProps(onClick);

  return (
    <div
      className={`${styles.primaryCard} ${onClick ? styles.clickable : ""}`}
      style={{ "--accent": accentColor } as React.CSSProperties}
      onClick={onClick}
      role={kb.role}
      tabIndex={kb.tabIndex}
      onKeyDown={kb.onKeyDown}
    >
      <div className={styles.accentBar} />
      <div className={styles.cardInner}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>{icon}</span>
          <span className={styles.cardLabel}>{label}</span>
          {showEditHint && <EditOutlined className={styles.editHint} />}
        </div>
        <div className={styles.cardValue}>{content}</div>
        {progress !== undefined && (
          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: progressColor ?? accentColor,
              }}
            />
          </div>
        )}
        {subLabel && <div className={styles.cardSub}>{subLabel}</div>}
      </div>
    </div>
  );
}

interface SecondaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accentColor: string;
}

function SecondaryCard({
  icon,
  label,
  value,
  accentColor,
}: SecondaryCardProps) {
  return (
    <div
      className={styles.secondaryCard}
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <span className={styles.secondaryIcon}>{icon}</span>
      <div className={styles.secondaryValue}>{value}</div>
      <div className={styles.secondaryLabel}>{label}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BudgetStats() {
  const { t } = useTranslation();
  const { state, updateBudget } = useBudget();
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(0);

  if (state.isLoading || !state.summary) return null;

  const { summary, expenses, categories, currency } = state;

  const totalAllocated = categories.reduce(
    (sum: number, c: Category) => sum + (c.allocated ?? 0),
    0,
  );
  const expenseCount = expenses?.length ?? 0;
  const avgExpense = expenseCount > 0 ? summary.total_spent / expenseCount : 0;
  const topCategory = findTopCategory(categories ?? []);

  const allocatedPct = pctOfBudget(totalAllocated, summary.total_budget);
  const spentPct = pctOfBudget(summary.total_spent, summary.total_budget);

  const remainingColor = getRemainingColor(summary.total_remaining, summary.total_budget);
  const spentProgressColor = getSpentProgressColor(spentPct);
  const spentTextColor = getSpentTextColor(spentPct);
  const allocatedColor = totalAllocated > summary.total_budget ? "var(--budget-danger)" : undefined;

  const remainingSubLabel =
    summary.total_remaining < 0
      ? t("budgetStats.overBudget")
      : `${parseFloat((Math.abs(summary.total_remaining / (summary.total_budget || 1)) * 100).toFixed(2))}% ${t("budgetStats.remaining")}`;
  const topCategoryName = topCategory?.budget_name || topCategory?.name || "—";
  const topCategoryTooltip =
    topCategory != null ? formatCurrency(topCategory.spent ?? 0, currency) : undefined;

  const handleEditBudget = () => {
    setBudgetInput(summary.total_budget);
    setEditingBudget(true);
  };
  const handleSaveBudget = () => {
    updateBudget(budgetInput);
    setEditingBudget(false);
  };
  const handleCancelEdit = () => setEditingBudget(false);

  return (
    <>
      <Row gutter={[16, 16]}>
        {/* ── Total Budget (editable) ── */}
        <Col xs={24} sm={12} lg={6}>
          {editingBudget ? (
            <div
              className={styles.primaryCard}
              style={{ "--accent": "var(--primary)" } as React.CSSProperties}
            >
              <div className={styles.accentBar} />
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>
                    <WalletOutlined />
                  </span>
                  <span className={styles.cardLabel}>
                    {t("budgetStats.totalBudget")}
                  </span>
                </div>
                <InputNumber
                  autoFocus
                  min={0}
                  step={1000}
                  value={budgetInput}
                  onChange={(v) => setBudgetInput(v ?? 0)}
                  onPressEnter={handleSaveBudget}
                  formatter={(v) => `$ ${formatInputNumber(v)}`}
                  parser={(v) => Number(parseInputNumber(v))}
                  style={{ width: "100%", marginTop: 4 }}
                  size="large"
                />
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={handleSaveBudget}>
                    <CheckOutlined />
                    {t("common.save")}
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={handleCancelEdit}
                  >
                    <CloseOutlined />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Tooltip title={t("budgetStats.clickToEdit")}>
              <StatCard
                icon={<WalletOutlined />}
                label={t("budgetStats.totalBudget")}
                content={
                  <AnimatedStatistic
                    value={formatCurrency(summary.total_budget, currency)}
                    styles={{
                      content: {
                        fontSize: 26,
                        fontWeight: 700,
                        lineHeight: 1.1,
                      },
                    }}
                  />
                }
                accentColor="var(--primary)"
                onClick={handleEditBudget}
                showEditHint
              />
            </Tooltip>
          )}
        </Col>

        {/* ── Total Allocated ── */}
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<PieChartOutlined />}
            label={t("budgetStats.totalAllocated")}
            content={
              <AnimatedStatistic
                value={formatCurrency(totalAllocated, currency)}
                styles={{
                  content: {
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: allocatedColor,
                  },
                }}
              />
            }
            accentColor="var(--status-in-progress)"
            progress={allocatedPct}
            progressColor="var(--status-in-progress)"
            subLabel={`${parseFloat(allocatedPct.toFixed(2))}% ${t("budgetStats.ofBudget")}`}
          />
        </Col>

        {/* ── Total Spent ── */}
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<ArrowDownOutlined />}
            label={t("budgetStats.totalSpent")}
            content={
              <AnimatedStatistic
                value={formatCurrency(summary.total_spent, currency)}
                styles={{
                  content: {
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: spentTextColor,
                  },
                }}
              />
            }
            accentColor="var(--status-delayed)"
            progress={spentPct}
            progressColor={spentProgressColor}
            subLabel={`${parseFloat(spentPct.toFixed(2))}% ${t("budgetStats.ofBudget")}`}
          />
        </Col>

        {/* ── Remaining ── */}
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<SafetyOutlined />}
            label={t("budgetStats.remaining")}
            content={
              <AnimatedStatistic
                value={formatCurrency(summary.total_remaining, currency)}
                styles={{
                  content: {
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: remainingColor,
                  },
                }}
              />
            }
            accentColor={remainingColor}
            subLabel={remainingSubLabel}
          />
        </Col>
      </Row>

      {/* ── Secondary stats ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <SecondaryCard
            icon={<PercentageOutlined />}
            label={t("budgetStats.spentPercent")}
            value={`${parseFloat(summary.percentage_spent.toFixed(2))}%`}
            accentColor="var(--primary)"
          />
        </Col>
        <Col xs={12} sm={6}>
          <SecondaryCard
            icon={<FileTextOutlined />}
            label={t("budgetStats.expensesCount")}
            value={expenseCount}
            accentColor="var(--status-in-progress)"
          />
        </Col>
        <Col xs={12} sm={6}>
          <SecondaryCard
            icon={<BarChartOutlined />}
            label={t("budgetStats.averageExpense")}
            value={formatCurrency(avgExpense, currency)}
            accentColor="var(--status-delayed)"
          />
        </Col>
        <Col xs={12} sm={6}>
          <Tooltip title={topCategoryTooltip}>
            <SecondaryCard
              icon={<TrophyOutlined />}
              label={t("budgetStats.topCategory")}
              value={topCategoryName}
              accentColor="var(--status-completed)"
            />
          </Tooltip>
        </Col>
      </Row>
    </>
  );
}

