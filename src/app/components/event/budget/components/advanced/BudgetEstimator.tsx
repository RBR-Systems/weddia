"use client";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  Flex,
  Tag,
  Button,
  Alert,
  App,
} from "antd";
import { BulbOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";
import CategoryTag from "../shared/CategoryTag";
import {
  CHART_COLORS,
  SEMANTIC_CHART_COLORS,
  resolveChartColor,
} from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";

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
    color: CHART_COLORS.light[0], // Blue
    description: "Reception hall, ceremony site, rentals",
  },
  {
    name: "Catering & Bar",
    percentage: 25,
    color: CHART_COLORS.light[1], // Green
    description: "Food, drinks, cake, service staff",
  },
  {
    name: "Photography & Video",
    percentage: 12,
    color: CHART_COLORS.light[4], // Purple
    description: "Photographer, videographer, albums",
  },
  {
    name: "Flowers & Decor",
    percentage: 8,
    color: CHART_COLORS.light[7], // Pink
    description: "Bouquets, centerpieces, decorations",
  },
  {
    name: "Music & Entertainment",
    percentage: 7,
    color: CHART_COLORS.light[6], // Orange
    description: "DJ, band, lighting, games",
  },
  {
    name: "Attire & Beauty",
    percentage: 6,
    color: CHART_COLORS.light[5], // Cyan
    description: "Dress, suit, hair, makeup",
  },
  {
    name: "Stationery",
    percentage: 3,
    color: CHART_COLORS.light[2], // Amber
    description: "Invitations, programs, signage",
  },
  {
    name: "Transportation",
    percentage: 3,
    color: CHART_COLORS.light[9], // Indigo
    description: "Limo, shuttle, valet",
  },
  {
    name: "Favors & Gifts",
    percentage: 2,
    color: CHART_COLORS.light[10], // Lime
    description: "Guest gifts, wedding party gifts",
  },
  {
    name: "Miscellaneous",
    percentage: 4,
    color: CHART_COLORS.light[11], // Violet
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
  const { mode } = useTheme();
  const { t } = useTranslation();
  const { modal, message } = App.useApp();
  const semantic = SEMANTIC_CHART_COLORS[mode];
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
      color: resolveChartColor(cat.color, mode),
      amount: Math.round((estimatedBudget * cat.percentage) / 100),
    }));
  }, [estimatedBudget, mode]);

  const handleApplyEstimate = () => {
    const categoriesPayload = categoryEstimates.map((cat) => ({
      id: cat.name.toLowerCase().replace(/\s+/g, "_"),
      name: cat.name,
      allocated: cat.amount,
      percentage: cat.percentage,
      spent: 0,
      remaining: cat.amount,
      color: cat.color,
    }));

    const applyAll = () => {
      loadEstimate?.({
        total_budget: estimatedBudget,
        categories: categoriesPayload,
      });
      message.success(
        t("budgetEstimator.estimateApplied", {
          amount: formatCurrency(estimatedBudget, state.currency),
        }),
      );
    };

    const applyBudgetOnly = () => {
      loadEstimate?.({ total_budget: estimatedBudget });
      message.success(
        t("budgetEstimator.estimateApplied", {
          amount: formatCurrency(estimatedBudget, state.currency),
        }),
      );
    };

    // If there are existing categories, ask the user whether to apply standard allocations
    if (state.categories && state.categories.length > 0) {
      modal.confirm({
        title: t("budgetEstimator.applyEstimateConfirmTitle"),
        content: t("budgetEstimator.applyEstimateConfirmDesc"),
        okText: t(
          "budgetEstimator.applyEstimateConfirmOk",
          "Apply Standard Values",
        ),
        cancelText: t(
          "budgetEstimator.applyEstimateConfirmCancel",
          "Keep Existing",
        ),
        onOk: applyAll,
        onCancel: applyBudgetOnly,
        centered: true,
      });
      return;
    }

    // No existing categories: apply everything
    applyAll();
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        <Card
          title={
            <>
              <CalculatorOutlined /> {t("budgetEstimator.title")}
            </>
          }
        >
          <Space orientation="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text strong>{t("budgetEstimator.numberOfGuests")}</Text>
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
              <Text strong>{t("budgetEstimator.weddingStyle")}</Text>
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
              <Text strong>{t("budgetEstimator.orEnterCustom")}</Text>
              <InputNumber
                style={{ width: "100%", marginTop: 8 }}
                min={0}
                value={customBudget}
                onChange={(v) => setCustomBudget(v)}
                placeholder={t("budgetEstimator.enterCustomAmount")}
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
                  {t("budgetEstimator.useCalculated")}
                </Button>
              )}
            </div>

            <Card
              size="small"
              style={{
                backgroundColor:
                  mode === "dark" ? "rgba(34, 197, 94, 0.08)" : "#F0FDF4",
                borderColor:
                  mode === "dark" ? "rgba(34, 197, 94, 0.25)" : "#BBF7D0",
              }}
            >
              <Statistic
                title={t("budgetEstimator.estimatedTotal")}
                value={estimatedBudget}
                formatter={(value) =>
                  formatCurrency(Number(value), state.currency)
                }
                styles={{ content: { color: semantic.success, fontSize: 28 } }}
              />
              <Text type="secondary">
                {t("budgetEstimator.basedOn", {
                  guests: guestCount,
                  style: STYLE_MULTIPLIERS[weddingStyle].label,
                })}
              </Text>
            </Card>

            <Button type="primary" block onClick={handleApplyEstimate}>
              {t("budgetEstimator.applyEstimate")}
            </Button>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card
          title={
            <>
              <BulbOutlined /> {t("budgetEstimator.suggestedBreakdown")}
            </>
          }
        >
          <Alert
            title={t("budgetEstimator.industryStandard")}
            description={t("budgetEstimator.industryStandardDesc")}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Flex vertical>
            {categoryEstimates.map((cat) => (
              <Flex key={cat.name} align="center" justify="space-between" style={{ padding: "8px 0" }}>
                <Flex align="center" gap={12}>
                  <CategoryTag color={cat.color} style={{ minWidth: 100, textAlign: "center" }}>
                    {cat.percentage}%
                  </CategoryTag>
                  <Flex vertical>
                    <Text>{cat.name}</Text>
                    {cat.description && <Text type="secondary">{cat.description}</Text>}
                  </Flex>
                </Flex>
                <Text strong>{formatCurrency(cat.amount, state.currency)}</Text>
              </Flex>
            ))}
          </Flex>

          <Divider />

          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>{t("common.total")}</Text>
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
