"use client";

import { Typography } from "antd";
import { formatCurrency } from "@/utils/formatters.utils";

const { Text } = Typography;

interface CurrencyDisplayProps {
  readonly amount: number;
  readonly currency?: string;
  readonly size?: "small" | "default" | "large";
  readonly type?: "success" | "warning" | "danger" | "secondary";
  readonly strong?: boolean;
}

export default function CurrencyDisplay({
  amount,
  currency = "USD",
  size = "default",
  type,
  strong = false,
}: CurrencyDisplayProps) {
  const fontSize = size === "small" ? 12 : size === "large" ? 24 : 14;

  return (
    <Text style={{ fontSize }} type={type} strong={strong}>
      {formatCurrency(amount, currency)}
    </Text>
  );
}

