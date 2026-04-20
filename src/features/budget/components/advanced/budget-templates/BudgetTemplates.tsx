"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { App, Card, Row, Col, Button, Modal, Form, Input, Flex, Typography, Tag, Space, Popconfirm } from "antd";
import { SaveOutlined, DownloadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import type { Category } from "../../../models/budget.models";
import type { BudgetTemplate } from "../../../models/budget.models";
import CategoryTag from "../../shared/CategoryTag";
import { CHART_COLORS, resolveChartColor } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";
import { DEFAULT_TEMPLATES } from "../../../constants/budget.constants";
import templateStyles from "./BudgetTemplates.module.css";

const { Title, Text, Paragraph } = Typography;

export default function BudgetTemplates() {
  const { message } = App.useApp();
  const { state, loadTemplate } = useBudget();
  const { mode } = useTheme();
  const { t } = useTranslation();
  const [templates, setTemplates] =
    useState<BudgetTemplate[]>(DEFAULT_TEMPLATES);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<BudgetTemplate | null>(
    null,
  );
  const [form] = Form.useForm();

  const handleSaveAsTemplate = async () => {
    try {
      const values = await form.validateFields();
      const newTemplate: BudgetTemplate = {
        id: `template_${Date.now()}`,
        name: values.name,
        description: values.description,
        total_budget: state.summary?.total_budget || 0,
        categories: state.categories.map((c: Category) => ({
          name: c.name,
          percentage:
            state.summary?.total_budget && state.summary.total_budget > 0
              ? Math.round((c.allocated / state.summary.total_budget) * 100)
              : 0,
          color: c.color || CHART_COLORS[mode][0],
        })),
        created_at: new Date().toISOString(),
      };

      setTemplates([...templates, newTemplate]);
      message.success(t("budgetTemplates.templateSaved"));
      setSaveModalOpen(false);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  const handleApplyTemplate = (template: BudgetTemplate) => {
    loadTemplate?.(template);
    message.success(t("budgetTemplates.templateApplied", { name: template.name }));
    setPreviewTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (DEFAULT_TEMPLATES.some((tmpl) => tmpl.id === templateId)) {
      message.error(t("budgetTemplates.cannotDeleteDefault"));
      return;
    }
    setTemplates(templates.filter((tmpl) => tmpl.id !== templateId));
    message.success(t("budgetTemplates.templateDeleted"));
  };

  return (
    <>
      <Card
        title={t("budgetTemplates.title")}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setSaveModalOpen(true)}
          >
            {t("budgetTemplates.saveAsCurrent")}
          </Button>
        }
      >
        <Paragraph type="secondary">
          {t("budgetTemplates.description")}
        </Paragraph>

        <Row gutter={[16, 16]}>
          {templates.map((template) => (
            <Col xs={24} sm={12} lg={8} key={template.id}>
              <Card
                hoverable
                size="small"
                onClick={() => setPreviewTemplate(template)}
                actions={[
                  <Button
                    key="apply"
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTemplate(template);
                    }}
                  >
                    {t("common.apply")}
                  </Button>,
                  !DEFAULT_TEMPLATES.some((tmpl) => tmpl.id === template.id) && (
                    <Popconfirm
                      key="delete"
                      title={t("budgetTemplates.deleteConfirm")}
                      onConfirm={() => handleDeleteTemplate(template.id)}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("common.delete")}
                      </Button>
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <Title level={5} className={templateStyles.templateName}>
                  {template.name}
                </Title>
                <Text type="secondary" className={templateStyles.templateDescription}>
                  {template.description}
                </Text>
                <div className={templateStyles.templateBudgetRow}>
                  <Text strong>
                    {formatCurrency(template.total_budget, state.currency)}
                  </Text>
                  <Text type="secondary" className={templateStyles.categoryCount}>
                    • {t("budgetTemplates.categories", { count: template.categories.length })}
                  </Text>
                </div>
                <div className={templateStyles.templateTags}>
                  {template.categories.slice(0, 3).map((cat) => (
                    <CategoryTag
                      key={cat.name}
                      color={resolveChartColor(cat.color, mode)}
                      className={templateStyles.tagSpacing}
                    >
                      {cat.name} ({cat.percentage}%)
                    </CategoryTag>
                  ))}
                  {template.categories.length > 3 && (
                    <Tag>{t("common.nMore", { count: template.categories.length - 3 })}</Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Save Template Modal */}
      <Modal
        title={t("budgetTemplates.saveAsTemplate")}
        open={saveModalOpen}
        onOk={handleSaveAsTemplate}
        onCancel={() => setSaveModalOpen(false)}
        okText={t("budgetTemplates.saveTemplate")}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t("budgetTemplates.templateName")}
            rules={[{ required: true, message: t("budgetTemplates.templateNameRequired") }]}
          >
            <Input placeholder={t("budgetTemplates.templateNamePlaceholder")} />
          </Form.Item>
          <Form.Item name="description" label={t("common.description")}>
            <Input.TextArea
              placeholder={t("budgetTemplates.templateDescription")}
              rows={2}
            />
          </Form.Item>
        </Form>

        <div className={templateStyles.templateIncludesSection}>
          <Text type="secondary">{t("budgetTemplates.willInclude")}</Text>
          <Flex vertical gap={4}>
            {state.categories.map((cat: Category) => (
              <Flex key={cat.id} justify="space-between" align="center">
                <CategoryTag color={cat.color}>{cat.name}</CategoryTag>
                <Text>
                  {state.summary?.total_budget && state.summary.total_budget > 0
                    ? Math.round((cat.allocated / state.summary.total_budget) * 100)
                    : 0}
                  %
                </Text>
              </Flex>
            ))}
          </Flex>
        </div>
      </Modal>

      {/* Preview Template Modal */}
      <Modal
        title={previewTemplate?.name}
        open={!!previewTemplate}
        onOk={() => previewTemplate && handleApplyTemplate(previewTemplate)}
        onCancel={() => setPreviewTemplate(null)}
        okText={t("budgetTemplates.applyTemplate")}
        width={500}
      >
        {previewTemplate && (
          <Space orientation="vertical" className={templateStyles.fullWidth}>
            <Paragraph>{previewTemplate.description}</Paragraph>
            <div>
              <Text strong>{t("budgetTemplates.suggestedBudget")}</Text>
              <Text>
                {formatCurrency(previewTemplate.total_budget, state.currency)}
              </Text>
            </div>
            <Title level={5}>{t("budgetTemplates.categoryBreakdown")}</Title>
            <Flex vertical gap={4}>
              {previewTemplate.categories.map((cat) => (
                <Flex key={cat.name} justify="space-between" align="center">
                  <CategoryTag color={resolveChartColor(cat.color, mode)}>{cat.name}</CategoryTag>
                  <span>
                    <Text>{cat.percentage}%</Text>
                    <Text type="secondary" className={templateStyles.previewCategoryAmount}>
                      ({formatCurrency((previewTemplate.total_budget * cat.percentage) / 100, state.currency)})
                    </Text>
                  </span>
                </Flex>
              ))}
            </Flex>
          </Space>
        )}
      </Modal>
    </>
  );
}


