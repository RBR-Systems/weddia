"use client";

import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import { PAYMENT_STATUS_DISPLAY } from "../../../constants/budget.constants";
import type { PaymentStatus } from "../../../models/budget.models";

interface PaymentStatusTagProps {
  readonly status: PaymentStatus;
}

export function PaymentStatusTag({ status }: PaymentStatusTagProps) {
  const { t } = useTranslation();
  const config = PAYMENT_STATUS_DISPLAY[status] ?? PAYMENT_STATUS_DISPLAY["pending"];
  if (!config) return <Tag>{status}</Tag>;
  return <Tag color={config.color}>{t(config.labelKey)}</Tag>;
}
