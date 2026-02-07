"use client";
import React from "react";
import { Card, Progress, Typography, Space, Badge } from "antd";
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
    if (percentage >= 100) return "#ff4d4f";
    if (percentage >= 80) return "#fa8c16";
    return color || "#52c41a";
  };

  return (
    <Card
      hoverable
      onClick={() => onClick?.(category)}
      style={{ borderLeft: `4px solid ${color || "#1890ff"}` }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <span style={{ color: color || "#1890ff", fontSize: 18 }}>
              {ICON_MAP[category.id] || <ShopOutlined />}
            </span>
            <Title level={5} style={{ margin: 0 }}>
              {name}
            </Title>
          </Space>
          <Badge
            count={expense_count ?? 0}
            style={{ backgroundColor: color || "#1890ff" }}
          />
        </div>

        <Progress
          percent={Math.min(percentage, 100)}
          status={getProgressStatus()}
          strokeColor={getProgressColor()}
          size="small"
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Spent
            </Text>
            <div>
              <Text strong>{formatCurrency(spent, currency)}</Text>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Allocated
            </Text>
            <div>
              <Text>{formatCurrency(allocated, currency)}</Text>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Remaining
            </Text>
            <div>
              <Text type={remaining < 0 ? "danger" : "success"}>
                {formatCurrency(remaining, currency)}
              </Text>
            </div>
          </div>
        </div>
      </Space>
    </Card>
  );
}
