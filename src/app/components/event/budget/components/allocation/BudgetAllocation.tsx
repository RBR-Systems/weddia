"use client";
import React from "react";
import {
  Card,
  Row,
  Col,
  Slider,
  InputNumber,
  Typography,
  Space,
  Button,
  Progress,
  Divider,
  Alert,
} from "antd";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import type { Category } from "../../types/budget.types";

const { Title, Text } = Typography;

export default function BudgetAllocation() {
  const { state, updateCategory } = useBudget();

  const totalBudget = state.summary?.total_budget ?? 0;
  const totalAllocated = state.categories.reduce(
    (sum, c) => sum + (c.allocated ?? 0),
    0,
  );
  const unallocated = totalBudget - totalAllocated;
  const allocationPercentage =
    totalBudget > 0 ? Math.round((totalAllocated / totalBudget) * 100) : 0;

  const handleSliderChange = (categoryId: string, value: number) => {
    updateCategory?.(categoryId, { allocated: value });
  };

  const handleInputChange = (categoryId: string, value: number | null) => {
    if (value !== null) {
      updateCategory?.(categoryId, { allocated: value });
    }
  };

  const distributeEvenly = () => {
    const perCategory = Math.floor(totalBudget / state.categories.length);
    state.categories.forEach((c: Category) => {
      updateCategory?.(c.id, { allocated: perCategory });
    });
  };

  return (
    <Card
      title="Budget Allocation"
      extra={
        <Space>
          <Button onClick={distributeEvenly}>Distribute Evenly</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Title level={5}>Total Budget</Title>
            <Title level={3} style={{ margin: 0 }}>
              {formatCurrency(totalBudget, state.currency)}
            </Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Title level={5}>Allocated</Title>
            <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
              {formatCurrency(totalAllocated, state.currency)}
            </Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Title level={5}>Unallocated</Title>
            <Title
              level={3}
              style={{
                margin: 0,
                color: unallocated < 0 ? "#ff4d4f" : "#52c41a",
              }}
            >
              {formatCurrency(unallocated, state.currency)}
            </Title>
          </Card>
        </Col>
      </Row>

      {unallocated < 0 && (
        <Alert
          message="Over-allocated"
          description={`You've allocated ${formatCurrency(Math.abs(unallocated), state.currency)} more than your total budget.`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      <Divider />

      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {state.categories.map((category: Category) => {
          const allocated = category.allocated ?? 0;
          const percentage =
            totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0;

          return (
            <div key={category.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Space>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: category.color || "#1890ff",
                      display: "inline-block",
                    }}
                  />
                  <Text strong>{category.name}</Text>
                </Space>
                <Text type="secondary">{percentage}% of budget</Text>
              </div>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Slider
                    min={0}
                    max={totalBudget}
                    step={100}
                    value={allocated}
                    onChange={(value) => handleSliderChange(category.id, value)}
                    trackStyle={{
                      backgroundColor: category.color || "#1890ff",
                    }}
                    handleStyle={{ borderColor: category.color || "#1890ff" }}
                  />
                </Col>
                <Col flex="150px">
                  <InputNumber
                    min={0}
                    max={totalBudget * 2}
                    step={100}
                    value={allocated}
                    onChange={(value) => handleInputChange(category.id, value)}
                    formatter={(value) =>
                      `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      Number(value?.replace(/\$\s?|(,*)/g, "") || 0)
                    }
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Spent: {formatCurrency(category.spent, state.currency)}
                </Text>
                <Text
                  type={allocated - category.spent < 0 ? "danger" : "secondary"}
                  style={{ fontSize: 12 }}
                >
                  Remaining:{" "}
                  {formatCurrency(allocated - category.spent, state.currency)}
                </Text>
              </div>
            </div>
          );
        })}
      </Space>
    </Card>
  );
}
