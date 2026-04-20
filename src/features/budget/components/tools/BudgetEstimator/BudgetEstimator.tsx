"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, Row, Col, InputNumber, Slider, Typography, Space, Select, Divider, Flex, Button, Alert, App } from "antd";
import { BulbOutlined, CalculatorOutlined } from "@ant-design/icons";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/shared/utils/formatters.utils";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import CategoryTag from "../../common/CategoryTag/CategoryTag";
import { SEMANTIC_CHART_COLORS, resolveChartColor } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";
import { ESTIMATE_CATEGORIES, STYLE_MULTIPLIERS } from "../../../constants/budget.constants";
import type { WeddingStyle } from "../../../models/budget.models";
import estimatorStyles from "./BudgetEstimator.module.css";

const { Text } = Typography;

const AMOUNT_FORMATTER = (value: string | number | undefined): string =>
  `$ ${formatInputNumber(value)}`;

const AMOUNT_PARSER = (value: string | undefined): number =>
  parseInputNumber(value);

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
      id: cat.name.toLowerCase().replaceAll(/\s+/g, "_"),
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
          <Space orientation="vertical" className={estimatorStyles.fullWidth} size="large">
            <div>
              <Text strong>{t("budgetEstimator.numberOfGuests")}</Text>
              <Row gutter={16} align="middle" className={estimatorStyles.marginTop}>
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
                    className={estimatorStyles.fullWidth}
                  />
                </Col>
              </Row>
            </div>

            <div>
              <Text strong>{t("budgetEstimator.weddingStyle")}</Text>
              <Select
                value={weddingStyle}
                onChange={setWeddingStyle}
                className={`${estimatorStyles.fullWidth} ${estimatorStyles.marginTop}`}
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
                className={`${estimatorStyles.fullWidth} ${estimatorStyles.marginTop}`}
                min={0}
                value={customBudget}
                onChange={(v) => setCustomBudget(v)}
                placeholder={t("budgetEstimator.enterCustomAmount")}
                formatter={AMOUNT_FORMATTER}
                parser={AMOUNT_PARSER}
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
              className={estimatorStyles.estimateCard}
            >
              <Statistic
                title={t("budgetEstimator.estimatedTotal")}
                value={estimatedBudget}
                formatter={(value: number | string) =>
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
            className={estimatorStyles.alertSpacing}
          />

          <Flex vertical>
            {categoryEstimates.map((cat) => (
              <Flex key={cat.name} align="center" justify="space-between" className={estimatorStyles.categoryRow}>
                <Flex align="center" gap={12}>
                  <CategoryTag color={cat.color} className={estimatorStyles.tagCentered}>
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
              <Text strong className={estimatorStyles.totalText}>
                {formatCurrency(estimatedBudget, state.currency)}
              </Text>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}


