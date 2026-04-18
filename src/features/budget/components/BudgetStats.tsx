"use client";
import React, { useState } from "react";
import { Row, Col, Tooltip, InputNumber } from "antd";
import {
  EditOutlined, CheckOutlined, CloseOutlined,
  WalletOutlined, PieChartOutlined, ArrowDownOutlined,
  SafetyOutlined, PercentageOutlined, FileTextOutlined,
  BarChartOutlined, TrophyOutlined,
} from "@ant-design/icons";
import AnimatedStatistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import { useBudget } from "../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters.utils";
import { useTranslation } from "react-i18next";
import styles from "./BudgetStats.module.css";

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
  icon, label, content, accentColor,
  subLabel, progress, progressColor, onClick, showEditHint,
}: StatCardProps) {
  return (
    <div
      className={`${styles.primaryCard} ${onClick ? styles.clickable : ""}`}
      style={{ "--accent": accentColor } as React.CSSProperties}
      onClick={onClick}
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

function SecondaryCard({ icon, label, value, accentColor }: SecondaryCardProps) {
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

  const totalAllocated = categories.reduce((sum: number, c: any) => sum + (c.allocated ?? 0), 0);
  const expenseCount = expenses?.length ?? 0;
  const avgExpense = expenseCount > 0 ? summary.total_spent / expenseCount : 0;
  const topCategory = categories?.length > 0
    ? categories.reduce((a: any, b: any) => (b.spent ?? 0) > (a.spent ?? 0) ? b : a)
    : null;

  const allocatedPct = summary.total_budget > 0 ? (totalAllocated / summary.total_budget) * 100 : 0;
  const spentPct = summary.total_budget > 0 ? (summary.total_spent / summary.total_budget) * 100 : 0;

  const remainingColor =
    summary.total_remaining < 0 ? "var(--budget-danger)" :
    summary.total_remaining < summary.total_budget * 0.2 ? "var(--budget-warning)" :
    "var(--budget-success)";

  const spentProgressColor =
    spentPct >= 100 ? "var(--budget-danger)" :
    spentPct >= 80  ? "var(--budget-warning)" :
    "var(--status-delayed)";

  const handleEditBudget = () => { setBudgetInput(summary.total_budget); setEditingBudget(true); };
  const handleSaveBudget  = () => { updateBudget(budgetInput); setEditingBudget(false); };
  const handleCancelEdit  = () => setEditingBudget(false);

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
                  <span className={styles.cardIcon}><WalletOutlined /></span>
                  <span className={styles.cardLabel}>{t("budgetStats.totalBudget")}</span>
                </div>
                <InputNumber
                  autoFocus
                  min={0}
                  step={1000}
                  value={budgetInput}
                  onChange={(v) => setBudgetInput(v ?? 0)}
                  onPressEnter={handleSaveBudget}
                  formatter={(v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                  style={{ width: "100%", marginTop: 4 }}
                  size="large"
                />
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={handleSaveBudget}>
                    <CheckOutlined />{t("common.save")}
                  </button>
                  <button className={styles.cancelBtn} onClick={handleCancelEdit}>
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
                    styles={{ content: { fontSize: 26, fontWeight: 700, lineHeight: 1.1 } }}
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
                    fontSize: 26, fontWeight: 700, lineHeight: 1.1,
                    color: totalAllocated > summary.total_budget ? "var(--budget-danger)" : undefined,
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
                    fontSize: 26, fontWeight: 700, lineHeight: 1.1,
                    color: spentPct >= 100 ? "var(--budget-danger)" : spentPct >= 80 ? "var(--budget-warning)" : undefined,
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
                styles={{ content: { fontSize: 26, fontWeight: 700, lineHeight: 1.1, color: remainingColor } }}
              />
            }
            accentColor={remainingColor}
            subLabel={
              summary.total_remaining < 0
                ? t("budgetStats.overBudget")
                : `${parseFloat((Math.abs(summary.total_remaining / (summary.total_budget || 1)) * 100).toFixed(2))}% ${t("budgetStats.remaining")}`
            }
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
          <Tooltip title={topCategory ? formatCurrency(topCategory.spent ?? 0, currency) : undefined}>
            <SecondaryCard
              icon={<TrophyOutlined />}
              label={t("budgetStats.topCategory")}
              value={topCategory ? (topCategory.budget_name || topCategory.name) : "—"}
              accentColor="var(--status-completed)"
            />
          </Tooltip>
        </Col>
      </Row>
    </>
  );
}
