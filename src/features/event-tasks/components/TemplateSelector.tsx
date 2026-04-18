"use client";
import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Modal, DatePicker, Switch, Tag, Space, Typography, Collapse, Spin, Result, Empty } from "antd";
import { CalendarOutlined, CheckCircleOutlined, EyeOutlined, ThunderboltOutlined, UnorderedListOutlined, FileAddOutlined } from "@ant-design/icons";
import type { WeddingTemplate } from "../models/task.models";
import { fetchMexicanTemplate } from "../api/taskApi";
import styles from "../EventTasks.module.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface TemplateSelectorProps {
  onApply: (
    template: WeddingTemplate,
    weddingDate: Date,
    includeOptional: boolean,
  ) => void;
}

const sectionEmojis: Record<number, string> = {
  1: "📋",
  2: "🏢",
  3: "🎉",
  4: "💄",
  5: "💑",
  6: "📸",
  7: "⚖️",
  8: "⛪",
  9: "💃",
  10: "🍽️",
  11: "🎊",
};

interface TemplateCardData {
  id: string;
  name: string;
  flag: string;
  description: string;
  total_tasks: number;
  required_tasks: number;
  optional_tasks: number;
  sections: number;
  highlights: string[];
  template: WeddingTemplate | null;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onApply }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [mexicanTemplate, setMexicanTemplate] =
    useState<WeddingTemplate | null>(null);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateCardData | null>(null);

  // Apply modal
  const [applyTemplate, setApplyTemplate] = useState<TemplateCardData | null>(
    null,
  );
  const [weddingDate, setWeddingDate] = useState<dayjs.Dayjs | null>(null);
  const [includeOptional, setIncludeOptional] = useState(true);
  const [success, setSuccess] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  // Load the mexican template on mount
  useEffect(() => {
    setLoading(true);
    fetchMexicanTemplate()
      .then(setMexicanTemplate)
      .catch(() => {
        // Template data not available
      })
      .finally(() => setLoading(false));
  }, []);

  const templateCards: TemplateCardData[] = [
    {
      id: "mexican-wedding",
      name: "Plantilla de Boda Mexicana",
      flag: "🇲🇽",
      description: t("tasks.template.mexicanDesc"),
      total_tasks: mexicanTemplate?.template_metadata.total_tasks ?? 201,
      required_tasks: mexicanTemplate?.template_metadata.required_tasks ?? 171,
      optional_tasks: mexicanTemplate?.template_metadata.optional_tasks ?? 30,
      sections: mexicanTemplate?.sections.length ?? 11,
      highlights: [
        t("tasks.template.feature1"),
        t("tasks.template.feature2"),
        t("tasks.template.feature3"),
        t("tasks.template.feature5"),
      ],
      template: mexicanTemplate,
    },
  ];

  const handlePreview = (card: TemplateCardData) => {
    setPreviewTemplate(card);
  };

  const handleStartApply = (card: TemplateCardData) => {
    setApplyTemplate(card);
    setWeddingDate(null);
    setIncludeOptional(true);
    setSuccess(false);
  };

  const handleApply = () => {
    if (!applyTemplate?.template || !weddingDate) return;
    const tpl = applyTemplate.template;
    const count = includeOptional
      ? tpl.template_metadata.total_tasks
      : tpl.template_metadata.required_tasks;
    onApply(tpl, weddingDate.toDate(), includeOptional);
    setGeneratedCount(count);
    setSuccess(true);
  };

  const handleCloseApply = () => {
    setApplyTemplate(null);
    setSuccess(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Card
        title={
          <Space>
            <FileAddOutlined />
            {t("tasks.template.title")}
          </Space>
        }
      >
        <Paragraph type="secondary">
          {t("tasks.template.description")}
        </Paragraph>

        <Row gutter={[16, 16]}>
          {templateCards.map((card) => (
            <Col xs={24} sm={12} lg={8} key={card.id}>
              <Card
                hoverable
                size="small"
                onClick={() => handlePreview(card)}
                actions={[
                  <Button
                    key="preview"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(card);
                    }}
                  >
                    {t("tasks.template.preview")}
                  </Button>,
                  <Button
                    key="apply"
                    type="link"
                    icon={<ThunderboltOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartApply(card);
                    }}
                  >
                    {t("tasks.template.apply")}
                  </Button>,
                ]}
              >
                <Title level={5} style={{ marginBottom: 4 }}>
                  {card.flag} {card.name}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {card.description}
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Text strong>
                    {card.total_tasks} {t("tasks.template.tasks")}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    • {card.sections} {t("tasks.template.sections")}
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
                  <Tag color="blue">
                    {card.required_tasks} {t("tasks.template.required")}
                  </Tag>
                  <Tag color="default">
                    {card.optional_tasks} {t("tasks.template.optionalLabel")}
                  </Tag>
                </div>
              </Card>
            </Col>
          ))}

          {/* Placeholder for future templates */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              size="small"
              style={{
                height: "100%",
                borderStyle: "dashed",
                opacity: 0.5,
              }}
              styles={{
                body: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 180,
                },
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("tasks.template.comingSoon")}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ── Preview Modal ── */}
      <Modal
        title={
          previewTemplate
            ? `${previewTemplate.flag} ${previewTemplate.name}`
            : ""
        }
        open={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        width={640}
        footer={[
          <Button key="close" onClick={() => setPreviewTemplate(null)}>
            {t("common.close")}
          </Button>,
          <Button
            key="apply"
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => {
              if (previewTemplate) {
                setPreviewTemplate(null);
                handleStartApply(previewTemplate);
              }
            }}
          >
            {t("tasks.template.apply")}
          </Button>,
        ]}
      >
        {previewTemplate?.template && (
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <Paragraph>{previewTemplate.description}</Paragraph>

            <div>
              <Text strong>{t("tasks.template.totalTasks")}: </Text>
              <Text>{previewTemplate.total_tasks}</Text>
              <Text type="secondary" style={{ marginLeft: 12 }}>
                ({previewTemplate.required_tasks} {t("tasks.template.required")}{" "}
                + {previewTemplate.optional_tasks}{" "}
                {t("tasks.template.optionalLabel")})
              </Text>
            </div>

            {/* Section breakdown */}
            <div>
              <Title level={5}>
                <UnorderedListOutlined /> {t("tasks.template.whatIncluded")}
              </Title>
              <div className={styles.templateSections}>
                {previewTemplate.template.sections.map((section) => (
                  <Card
                    key={section.section_id}
                    size="small"
                    className={styles.templateSectionCard}
                  >
                    <div>
                      {sectionEmojis[section.section_order] || "📌"}{" "}
                      <span className={styles.templateSectionName}>
                        {section.section_name}
                      </span>
                    </div>
                    <div className={styles.templateSectionCount}>
                      {section.task_count} {t("tasks.template.tasks")}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className={styles.templateFeatures}>
              {previewTemplate.highlights.map((h, idx) => (
                <div key={idx} className={styles.templateFeatureItem}>
                  <CheckCircleOutlined style={{ color: "#22C55E" }} />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Expandable task preview */}
            <Collapse
              ghost
              items={previewTemplate.template.sections.map((section) => ({
                key: section.section_id,
                label: `${sectionEmojis[section.section_order] || "📌"} ${section.section_name} (${section.task_count})`,
                children: (
                  <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                    {section.tasks.slice(0, 8).map((task) => (
                      <li key={task.template_id}>
                        {task.title}
                        {task.is_optional && (
                          <Tag
                            color="default"
                            style={{ marginLeft: 4, fontSize: 10 }}
                          >
                            {t("tasks.template.optional")}
                          </Tag>
                        )}
                      </li>
                    ))}
                    {section.tasks.length > 8 && (
                      <li style={{ opacity: 0.5 }}>
                        {t("common.nMore", {
                          count: section.tasks.length - 8,
                        })}
                      </li>
                    )}
                  </ul>
                ),
              }))}
            />
          </Space>
        )}
      </Modal>

      {/* ── Apply Modal ── */}
      <Modal
        title={
          applyTemplate
            ? `${applyTemplate.flag} ${t("tasks.template.createTimeline")}`
            : ""
        }
        open={!!applyTemplate}
        onCancel={handleCloseApply}
        footer={
          success
            ? null
            : [
                <Button key="cancel" onClick={handleCloseApply}>
                  {t("common.cancel")}
                </Button>,
                <Button
                  key="apply"
                  type="primary"
                  disabled={!weddingDate}
                  onClick={handleApply}
                >
                  {t("tasks.template.createTimeline")}
                </Button>,
              ]
        }
        width={520}
      >
        {success ? (
          <Result
            status="success"
            title={t("tasks.template.successTitle")}
            subTitle={t("tasks.template.successSubtitle", {
              count: generatedCount,
            })}
            extra={
              <Button type="primary" onClick={handleCloseApply}>
                {t("tasks.template.viewTasks")}
              </Button>
            }
          />
        ) : (
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            {/* Wedding date */}
            <Card size="small">
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Text strong>
                  <CalendarOutlined /> {t("tasks.template.weddingDate")} *
                </Text>
                <DatePicker
                  value={weddingDate}
                  onChange={setWeddingDate}
                  style={{ width: "100%" }}
                  size="large"
                  disabledDate={(d) => d.isBefore(dayjs(), "day")}
                  placeholder={t("tasks.template.weddingDatePlaceholder")}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("tasks.template.weddingDateHelp")}
                </Text>
              </Space>
            </Card>

            {/* Optional toggle */}
            <Card size="small">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Text strong>{t("tasks.template.includeOptional")}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t("tasks.template.includeOptionalDesc")}
                  </Text>
                </div>
                <Switch
                  checked={includeOptional}
                  onChange={setIncludeOptional}
                />
              </div>
              {applyTemplate?.template && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">
                    {includeOptional
                      ? `${applyTemplate.template.template_metadata.required_tasks} + ${applyTemplate.template.template_metadata.optional_tasks} = ${applyTemplate.template.template_metadata.total_tasks} ${t("tasks.template.tasks")}`
                      : `${applyTemplate.template.template_metadata.required_tasks} ${t("tasks.template.tasks")}`}
                  </Tag>
                </div>
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default TemplateSelector;

