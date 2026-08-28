"use client";

import { Progress, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import type { Category } from "../../../models/budget.models";
import {
  BUDGET_STATUS_AT_RISK_PERCENT,
  BUDGET_STATUS_OVER_PERCENT,
} from "../../../constants/budget.constants";
import styles from "./CategoryCard.module.css";
import { useTranslation } from "react-i18next";

interface CategoryCardProps {
  readonly category: Category;
  readonly currency?: string;
  readonly onClick?: (category: Category) => void;
}

export default function CategoryCard({
  category,
  currency = "USD",
  onClick,
}: CategoryCardProps) {
  const { t } = useTranslation();
  const { name, budget_name, budget_notes, allocated, spent, expense_count, color } = category;
  const remaining = allocated - spent;
  const percentage = allocated > 0 ? Number.parseFloat(((spent / allocated) * 100).toFixed(2)) : 0;
  const accent = color || "var(--primary)";

  const displayName = budget_name || name;
  const subtitle = budget_notes || null;

  const progressColor =
    percentage >= BUDGET_STATUS_OVER_PERCENT ? "var(--status-canceled)" :
    percentage >= BUDGET_STATUS_AT_RISK_PERCENT ? "var(--status-delayed)" :
    accent;

  const badgeClass =
    percentage >= BUDGET_STATUS_OVER_PERCENT ? styles.danger :
    percentage >= BUDGET_STATUS_AT_RISK_PERCENT ? styles.warning :
    "";

  return (
    <button type="button" className={styles.card} onClick={() => onClick?.(category)}>
      {/* Color accent strip */}
      <div className={styles.accent} style={{ background: accent }} />

      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.nameBlock}>
            <div className={styles.categoryName}>{displayName}</div>
            <div className={styles.catalogLabel}>{name}</div>
            {subtitle ? (
              <div className={styles.categoryDescription}>{subtitle}</div>
            ) : (
              <div className={`${styles.categoryDescription} ${styles.descriptionItalic}`}>
                {expense_count ?? 0} {t("categoryCard.expenses", { count: expense_count ?? 0 })}
              </div>
            )}
          </div>
          <span className={`${styles.percentBadge} ${badgeClass}`}>
            {percentage}%
          </span>
        </div>

        {/* Progress */}
        <div className={styles.progressWrap}>
          <Progress
            percent={Math.min(percentage, 100)}
            showInfo={false}
            strokeColor={progressColor}
            size="small"
            style={{ margin: 0 }}
          />
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              {t("categoryCard.spent")}
              <Tooltip title={t("categoryCard.spentTooltip")}>
                <InfoCircleOutlined className={styles.infoHint} />
              </Tooltip>
            </span>
            <span className={styles.statValue}>
              {formatCurrency(spent, currency)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t("categoryCard.allocated")}</span>
            <span className={styles.statValue}>
              {formatCurrency(allocated, currency)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t("categoryCard.remaining")}</span>
            <span
              className={`${styles.statValue} ${
                remaining < 0 ? styles.negative : styles.positive
              }`}
            >
              {formatCurrency(remaining, currency)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
