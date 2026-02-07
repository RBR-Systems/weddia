"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  InputNumber,
  Slider,
  Typography,
  Space,
  Select,
  Divider,
  List,
  Tag,
  Button,
  Statistic,
  Alert,
} from "antd";
import { BulbOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";

const { Title, Text, Paragraph } = Typography;

interface EstimateCategory {
  name: string;
  percentage: number;
  color: string;
  description: string;
}

const ESTIMATE_CATEGORIES: EstimateCategory[] = [
  {
    name: "Venue",
    percentage: 30,
    color: "#1890ff",
    description: "Reception hall, ceremony site, rentals",
  },
  {
    name: "Catering & Bar",
    percentage: 25,
    color: "#52c41a",
    description: "Food, drinks, cake, service staff",
  },
  {
    name: "Photography & Video",
    percentage: 12,
    color: "#722ed1",
    description: "Photographer, videographer, albums",
  },
  {
    name: "Flowers & Decor",
    percentage: 8,
    color: "#eb2f96",
    description: "Bouquets, centerpieces, decorations",
  },
  {
    name: "Music & Entertainment",
    percentage: 7,
    color: "#fa8c16",
    description: "DJ, band, lighting, games",
  },
  {
    name: "Attire & Beauty",
    percentage: 6,
    color: "#13c2c2",
    description: "Dress, suit, hair, makeup",
  },
  {
    name: "Stationery",
    percentage: 3,
    color: "#faad14",
    description: "Invitations, programs, signage",
  },
  {
    name: "Transportation",
    percentage: 3,
    color: "#2f54eb",
    description: "Limo, shuttle, valet",
  },
  {
    name: "Favors & Gifts",
    percentage: 2,
    color: "#a0d911",
    description: "Guest gifts, wedding party gifts",
  },
  {
    name: "Miscellaneous",
    percentage: 4,
    color: "#d9d9d9",
    description: "Tips, insurance, unexpected costs",
  },
];

type WeddingStyle = "budget" | "moderate" | "upscale" | "luxury";

const STYLE_MULTIPLIERS: Record<
  WeddingStyle,
  { label: string; multiplier: number; perGuest: number }
> = {
  budget: { label: "Budget-Friendly", multiplier: 0.7, perGuest: 100 },
  moderate: { label: "Moderate", multiplier: 1.0, perGuest: 200 },
  upscale: { label: "Upscale", multiplier: 1.5, perGuest: 350 },
  luxury: { label: "Luxury", multiplier: 2.5, perGuest: 500 },
};

export default function BudgetEstimator() {
  const { state, loadEstimate } = useBudget();
  const [guestCount, setGuestCount] = useState(100);
  const [weddingStyle, setWeddingStyle] = useState<WeddingStyle>("moderate");
  const [customBudget, setCustomBudget] = useState<number | null>(null);

  const estimatedBudget = useMemo(() => {
    if (customBudget) return customBudget;
    const styleConfig = STYLE_MULTIPLIERS[weddingStyle];
    return guestCount * styleConfig.perGuest;
  }, [guestCount, weddingStyle, customBudget]);

  const categoryEstimates = useMemo(() => {
    return ESTIMATE_CATEGORIES.map((cat) => ({
      ...cat,
      amount: Math.round((estimatedBudget * cat.percentage) / 100),
    }));
  }, [estimatedBudget]);

  const handleApplyEstimate = () => {
    loadEstimate?.({
      total_budget: estimatedBudget,
      categories: categoryEstimates.map((cat) => ({
        id: cat.name.toLowerCase().replace(/\s+/g, "_"),
        name: cat.name,
        allocated: cat.amount,
        spent: 0,
        remaining: cat.amount,
        color: cat.color,
      })),
    });
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        <Card
          title={
            <>
              <CalculatorOutlined /> Budget Estimator
            </>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text strong>Number of Guests</Text>
              <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                <Col flex="auto">
                  <Slider
                    min={20}
                    max={500}
                    value={guestCount}
                    onChange={setGuestCount}
                    marks={{
                      20: "20",
                      100: "100",
                      250: "250",
                      500: "500",
                    }}
                  />
                </Col>
                <Col flex="80px">
                  <InputNumber
                    min={1}
                    max={1000}
                    value={guestCount}
                    onChange={(v) => v && setGuestCount(v)}
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
            </div>

            <div>
              <Text strong>Wedding Style</Text>
              <Select
                value={weddingStyle}
                onChange={setWeddingStyle}
                style={{ width: "100%", marginTop: 8 }}
                options={Object.entries(STYLE_MULTIPLIERS).map(
                  ([key, config]) => ({
                    value: key,
                    label: (
                      <Space>
                        <span>{config.label}</span>
                        <Text type="secondary">
                          (~{formatCurrency(config.perGuest, state.currency)}
                          /guest)
                        </Text>
                      </Space>
                    ),
                  }),
                )}
              />
            </div>

            <Divider />

            <div>
              <Text strong>Or Enter Custom Budget</Text>
              <InputNumber
                style={{ width: "100%", marginTop: 8 }}
                min={0}
                value={customBudget}
                onChange={(v) => setCustomBudget(v)}
                placeholder="Enter custom amount"
                formatter={(value) =>
                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  Number(value?.replace(/\$\s?|(,*)/g, "") || 0)
                }
              />
              {customBudget && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setCustomBudget(null)}
                >
                  Use calculated estimate instead
                </Button>
              )}
            </div>

            <Card
              size="small"
              style={{ backgroundColor: "#f6ffed", borderColor: "#b7eb8f" }}
            >
              <Statistic
                title="Estimated Total Budget"
                value={estimatedBudget}
                formatter={(value) =>
                  formatCurrency(Number(value), state.currency)
                }
                valueStyle={{ color: "#52c41a", fontSize: 28 }}
              />
              <Text type="secondary">
                Based on {guestCount} guests ×{" "}
                {STYLE_MULTIPLIERS[weddingStyle].label} style
              </Text>
            </Card>

            <Button type="primary" block onClick={handleApplyEstimate}>
              Apply This Estimate to My Budget
            </Button>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card
          title={
            <>
              <BulbOutlined /> Suggested Category Breakdown
            </>
          }
        >
          <Alert
            message="Industry Standard Allocations"
            description="These percentages are based on average wedding spending patterns. Adjust based on your priorities."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <List
            dataSource={categoryEstimates}
            renderItem={(cat) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag
                      color={cat.color}
                      style={{ minWidth: 100, textAlign: "center" }}
                    >
                      {cat.percentage}%
                    </Tag>
                  }
                  title={cat.name}
                  description={cat.description}
                />
                <Text strong>{formatCurrency(cat.amount, state.currency)}</Text>
              </List.Item>
            )}
          />

          <Divider />

          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>Total</Text>
            </Col>
            <Col>
              <Text strong style={{ fontSize: 18 }}>
                {formatCurrency(estimatedBudget, state.currency)}
              </Text>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
