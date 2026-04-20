"use client";

import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import type { BudgetStatus, PaymentStatus } from "../../models/budget.models";

const BUDGET_STATUS_CONFIG: Record<
  BudgetStatus,
  { label: string; color: string }
> = {
  on_track: { label: "statusBadge.onTrack", color: "success" },
  at_risk: { label: "statusBadge.atRisk", color: "warning" },
  over_budget: { label: "statusBadge.overBudget", color: "error" },
  not_started: { label: "statusBadge.notStarted", color: "default" },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  paid: { label: "statusBadge.paid", color: "success" },
  pending: { label: "statusBadge.pending", color: "warning" },
  overdue: { label: "statusBadge.overdue", color: "error" },
  partial: { label: "statusBadge.partial", color: "processing" },
  cancelled: { label: "statusBadge.cancelled", color: "default" },
};

interface StatusBadgeProps {
  readonly status: BudgetStatus | PaymentStatus;
  readonly type?: "budget" | "payment";
}

export default function StatusBadge({
  status,
  type = "budget",
}: StatusBadgeProps) {
  const { t } = useTranslation();
  const config =
    type === "budget"
      ? BUDGET_STATUS_CONFIG[status as BudgetStatus]
      : PAYMENT_STATUS_CONFIG[status as PaymentStatus];

  if (!config) return null;

  return <Tag color={config.color}>{t(config.label)}</Tag>;
}

