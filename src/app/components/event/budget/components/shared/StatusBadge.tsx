"use client";
import React from "react";
import { Tag } from "antd";
import type { BudgetStatus, PaymentStatus } from "../../types/budget.types";

const BUDGET_STATUS_CONFIG: Record<
  BudgetStatus,
  { label: string; color: string }
> = {
  on_track: { label: "On Track", color: "success" },
  at_risk: { label: "At Risk", color: "warning" },
  over_budget: { label: "Over Budget", color: "error" },
  not_started: { label: "Not Started", color: "default" },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  paid: { label: "Paid", color: "success" },
  pending: { label: "Pending", color: "warning" },
  overdue: { label: "Overdue", color: "error" },
  partial: { label: "Partial", color: "processing" },
  cancelled: { label: "Cancelled", color: "default" },
};

interface StatusBadgeProps {
  status: BudgetStatus | PaymentStatus;
  type?: "budget" | "payment";
}

export default function StatusBadge({
  status,
  type = "budget",
}: StatusBadgeProps) {
  const config =
    type === "budget"
      ? BUDGET_STATUS_CONFIG[status as BudgetStatus]
      : PAYMENT_STATUS_CONFIG[status as PaymentStatus];

  if (!config) return null;

  return <Tag color={config.color}>{config.label}</Tag>;
}
