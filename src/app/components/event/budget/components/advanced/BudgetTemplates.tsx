"use client";
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  List,
  Typography,
  Tag,
  Space,
  message,
  Empty,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import type { Category } from "../../types/budget.types";
import CategoryTag from "../shared/CategoryTag";
import { CHART_COLORS, resolveChartColor } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";

const { Title, Text, Paragraph } = Typography;

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  total_budget: number;
  categories: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  created_at: string;
}

const DEFAULT_TEMPLATES: BudgetTemplate[] = [
  {
    id: "classic",
    name: "Classic Wedding",
    description: "Traditional wedding budget allocation",
    total_budget: 30000,
    categories: [
      { name: "Venue", percentage: 40, color: CHART_COLORS.light[0] },
      { name: "Catering", percentage: 25, color: CHART_COLORS.light[1] },
      { name: "Photography", percentage: 10, color: CHART_COLORS.light[4] },
      { name: "Flowers", percentage: 8, color: CHART_COLORS.light[7] },
      { name: "Music", percentage: 7, color: CHART_COLORS.light[6] },
      { name: "Attire", percentage: 5, color: CHART_COLORS.light[5] },
      { name: "Other", percentage: 5, color: CHART_COLORS.light[11] },
    ],
    created_at: "2026-01-01",
  },
  {
    id: "intimate",
    name: "Intimate Celebration",
    description: "Smaller guest list, higher quality focus",
    total_budget: 15000,
    categories: [
      { name: "Venue & Catering", percentage: 50, color: CHART_COLORS.light[0] },
      { name: "Photography", percentage: 15, color: CHART_COLORS.light[4] },
      { name: "Flowers & Decor", percentage: 15, color: CHART_COLORS.light[7] },
      { name: "Attire", percentage: 10, color: CHART_COLORS.light[5] },
      { name: "Music", percentage: 10, color: CHART_COLORS.light[6] },
    ],
    created_at: "2026-01-01",
  },
  {
    id: "luxury",
    name: "Luxury Wedding",
    description: "Premium vendors and full-service planning",
    total_budget: 100000,
    categories: [
      { name: "Venue", percentage: 30, color: CHART_COLORS.light[0] },
      { name: "Catering & Bar", percentage: 20, color: CHART_COLORS.light[1] },
      { name: "Photography & Video", percentage: 12, color: CHART_COLORS.light[4] },
      { name: "Flowers & Decor", percentage: 12, color: CHART_COLORS.light[7] },
      { name: "Entertainment", percentage: 10, color: CHART_COLORS.light[6] },
      { name: "Attire & Beauty", percentage: 8, color: CHART_COLORS.light[5] },
      { name: "Stationery", percentage: 3, color: CHART_COLORS.light[2] },
      { name: "Transportation", percentage: 3, color: CHART_COLORS.light[9] },
      { name: "Miscellaneous", percentage: 2, color: CHART_COLORS.light[11] },
    ],
    created_at: "2026-01-01",
  },
];

export default function BudgetTemplates() {
  const { state, loadTemplate } = useBudget();
  const { mode } = useTheme();
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
      message.success("Template saved successfully");
      setSaveModalOpen(false);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  const handleApplyTemplate = (template: BudgetTemplate) => {
    loadTemplate?.(template);
    message.success(`Template "${template.name}" applied`);
    setPreviewTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (DEFAULT_TEMPLATES.find((t) => t.id === templateId)) {
      message.error("Cannot delete default templates");
      return;
    }
    setTemplates(templates.filter((t) => t.id !== templateId));
    message.success("Template deleted");
  };

  return (
    <>
      <Card
        title="Budget Templates"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setSaveModalOpen(true)}
          >
            Save Current as Template
          </Button>
        }
      >
        <Paragraph type="secondary">
          Use templates to quickly set up your budget with recommended
          allocations, or save your current budget configuration as a reusable
          template.
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
                    Apply
                  </Button>,
                  !DEFAULT_TEMPLATES.find((t) => t.id === template.id) && (
                    <Popconfirm
                      key="delete"
                      title="Delete this template?"
                      onConfirm={() => handleDeleteTemplate(template.id)}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <Title level={5} style={{ marginBottom: 4 }}>
                  {template.name}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {template.description}
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Text strong>
                    {formatCurrency(template.total_budget, state.currency)}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    • {template.categories.length} categories
                  </Text>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    gap: 6,
                    display: "flex",
                    flexWrap: "wrap",
                  }}
                >
                  {template.categories.slice(0, 3).map((cat, idx) => (
                    <CategoryTag
                      key={idx}
                      color={resolveChartColor(cat.color, mode)}
                      style={{ marginBottom: 4 }}
                    >
                      {cat.name} ({cat.percentage}%)
                    </CategoryTag>
                  ))}
                  {template.categories.length > 3 && (
                    <Tag>+{template.categories.length - 3} more</Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Save Template Modal */}
      <Modal
        title="Save as Template"
        open={saveModalOpen}
        onOk={handleSaveAsTemplate}
        onCancel={() => setSaveModalOpen(false)}
        okText="Save Template"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g., My Wedding Budget" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Brief description of this budget template"
              rows={2}
            />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">This template will include:</Text>
          <List
            size="small"
            dataSource={state.categories}
            renderItem={(cat: Category) => (
              <List.Item>
                <CategoryTag color={cat.color}>{cat.name}</CategoryTag>
                <Text>
                  {state.summary?.total_budget && state.summary.total_budget > 0
                    ? Math.round(
                        (cat.allocated / state.summary.total_budget) * 100,
                      )
                    : 0}
                  %
                </Text>
              </List.Item>
            )}
          />
        </div>
      </Modal>

      {/* Preview Template Modal */}
      <Modal
        title={previewTemplate?.name}
        open={!!previewTemplate}
        onOk={() => previewTemplate && handleApplyTemplate(previewTemplate)}
        onCancel={() => setPreviewTemplate(null)}
        okText="Apply Template"
        width={500}
      >
        {previewTemplate && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>{previewTemplate.description}</Paragraph>
            <div>
              <Text strong>Suggested Budget: </Text>
              <Text>
                {formatCurrency(previewTemplate.total_budget, state.currency)}
              </Text>
            </div>
            <Title level={5}>Category Breakdown</Title>
            <List
              dataSource={previewTemplate.categories}
              renderItem={(cat) => (
                <List.Item>
                  <CategoryTag color={resolveChartColor(cat.color, mode)}>{cat.name}</CategoryTag>
                  <Text>{cat.percentage}%</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    (
                    {formatCurrency(
                      (previewTemplate.total_budget * cat.percentage) / 100,
                      state.currency,
                    )}
                    )
                  </Text>
                </List.Item>
              )}
            />
          </Space>
        )}
      </Modal>
    </>
  );
}
