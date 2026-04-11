"use client";
import React from "react";
import { Progress, Typography, Space, Badge } from "antd";
import Card from "@/app/common/Card/card";
import {
  HomeOutlined,
  CoffeeOutlined,
  CameraOutlined,
  GiftOutlined,
  CarOutlined,
  SoundOutlined,
  ShopOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "@/utils/formatters";
import type { Category } from "../../types/budget.types";
import styles from "./CategoryCard.module.css";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

const ICON_MAP: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  CoffeeOutlined: <CoffeeOutlined />,
  CameraOutlined: <CameraOutlined />,
  GiftOutlined: <GiftOutlined />,
  CarOutlined: <CarOutlined />,
  SoundOutlined: <SoundOutlined />,
  ShopOutlined: <ShopOutlined />,
  HeartOutlined: <HeartOutlined />,
};

interface CategoryCardProps {
  category: Category;
  currency?: string;
  onClick?: (category: Category) => void;
}

export default function CategoryCard({
  category,
  currency = "USD",
  onClick,
}: CategoryCardProps) {
  const { t } = useTranslation();
  const { name, allocated, spent, expense_count, color } = category;
  const remaining = allocated - spent;
  const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

  const getProgressStatus = (): "success" | "normal" | "exception" => {
    if (remaining === 0 && allocated > 0) return "success";
    if (percentage >= 100) return "exception";
    if (percentage >= 80) return "normal";
    return "normal";
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "var(--status-canceled)";
    if (percentage >= 80) return "var(--status-delayed)";
    return color || "var(--status-completed)";
  };

  return (
    <Card
      hoverable
      onClick={() => onClick?.(category)}
      style={{
        borderLeft: `4px solid ${color || "var(--status-in-progress)"}`,
      }}
    >
      <Space orientation="vertical" className={styles.fullWidth} size="small">
        <div className={styles.cardHeader}>
          <Space>
            <span
              className={styles.categoryIcon}
              style={{ color: color || "var(--status-in-progress)" }}
            >
              {ICON_MAP[category.id] || <ShopOutlined />}
            </span>
            <Title level={5} className={styles.categoryName}>
              {name}
            </Title>
          </Space>
        </div>

        <Progress
          percent={Math.min(percentage, 100)}
          status={getProgressStatus()}
          strokeColor={getProgressColor()}
          size="small"
        />

        <div className={styles.statsRow}>
          <div>
            <span className={styles.statLabel}>
              {t("categoryCard.spent")}
            </span>
            <div>
              <Text strong>{formatCurrency(spent, currency)}</Text>
            </div>
          </div>
          <div className={styles.statCenter}>
            <span className={styles.statLabel}>
              {t("categoryCard.allocated")}
            </span>
            <div>
              <Text>{formatCurrency(allocated, currency)}</Text>
            </div>
          </div>
          <div className={styles.statRight}>
            <span className={styles.statLabel}>
              {t("categoryCard.remaining")}
            </span>
            <div>
              <Text
                style={{ color: remaining < 0 ? "var(--text-danger)" : "var(--text-success)" }}
              >
                {formatCurrency(remaining, currency)}
              </Text>
            </div>
          </div>
        </div>
      </Space>
    </Card>
  );
}
