"use client";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Empty,
  Modal,
  Result,
  Row,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileAddOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import { fetchMexicanTemplate } from "../../api/taskApi";
import { SECTION_EMOJIS } from "../../constants/task.constants";
import type {
  TemplateCardData,
  TemplateSelectorProps,
} from "../../models/taskComponent.models";
import type { WeddingTemplate } from "../../models/task.models";
import styles from "./TemplateSelector.module.css";

const { Paragraph, Text, Title } = Typography;

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ eventDate, onApply }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [mexicanTemplate, setMexicanTemplate] =
    useState<WeddingTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateCardData | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<TemplateCardData | null>(
    null,
  );
  const [weddingDate, setWeddingDate] = useState<dayjs.Dayjs | null>(null);
  const [includeOptional, setIncludeOptional] = useState(true);
  const [success, setSuccess] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

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
    setWeddingDate(eventDate ? dayjs(eventDate) : null);
    setIncludeOptional(true);
    setSuccess(false);
  };

  const handleApply = () => {
    if (!applyTemplate?.template || !weddingDate) {
      return;
    }

    const template = applyTemplate.template;
    const count = includeOptional
      ? template.template_metadata.total_tasks
      : template.template_metadata.required_tasks;

    onApply(template, weddingDate.toDate(), includeOptional);
    setGeneratedCount(count);
    setSuccess(true);
  };

  const handleCloseApply = () => {
    setApplyTemplate(null);
    setSuccess(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
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
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePreview(card);
                    }}
                  >
                    {t("tasks.template.preview")}
                  </Button>,
                  <Button
                    key="apply"
                    type="link"
                    icon={<ThunderboltOutlined />}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStartApply(card);
                    }}
                  >
                    {t("tasks.template.apply")}
                  </Button>,
                ]}
              >
                <Title level={5} className={styles.cardTitle}>
                  {card.flag} {card.name}
                </Title>
                <Text type="secondary" className={styles.cardDescription}>
                  {card.description}
                </Text>
                <div className={styles.cardMetaRow}>
                  <Text strong>
                    {card.total_tasks} {t("tasks.template.tasks")}
                  </Text>
                  <Text type="secondary" className={styles.cardMetaSecondary}>
                    • {card.sections} {t("tasks.template.sections")}
                  </Text>
                </div>
                <div className={styles.cardTagRow}>
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

          <Col xs={24} sm={12} lg={8}>
            <Card size="small" className={styles.comingSoonCard}>
              <div className={styles.comingSoonContent}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("tasks.template.comingSoon")}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          previewTemplate ? `${previewTemplate.flag} ${previewTemplate.name}` : ""
        }
        open={Boolean(previewTemplate)}
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
              if (!previewTemplate) {
                return;
              }

              setPreviewTemplate(null);
              handleStartApply(previewTemplate);
            }}
          >
            {t("tasks.template.apply")}
          </Button>,
        ]}
      >
        {previewTemplate?.template && (
          <Space orientation="vertical" className={styles.fullWidth} size="middle">
            <Paragraph>{previewTemplate.description}</Paragraph>

            <div>
              <Text strong>{t("tasks.template.totalTasks")}: </Text>
              <Text>{previewTemplate.total_tasks}</Text>
              <Text type="secondary" className={styles.previewTotalsMeta}>
                ({previewTemplate.required_tasks} {t("tasks.template.required")} +{" "}
                {previewTemplate.optional_tasks}{" "}
                {t("tasks.template.optionalLabel")})
              </Text>
            </div>

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
                      {SECTION_EMOJIS[section.section_order] || "📌"}{" "}
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

            <div className={styles.templateFeatures}>
              {previewTemplate.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className={styles.templateFeatureItem}
                >
                  <CheckCircleOutlined className={styles.completeIcon} />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            <Collapse
              ghost
              items={previewTemplate.template.sections.map((section) => ({
                key: section.section_id,
                label: `${SECTION_EMOJIS[section.section_order] || "📌"} ${section.section_name} (${section.task_count})`,
                children: (
                  <ul className={styles.previewTaskList}>
                    {section.tasks.slice(0, 8).map((task) => (
                      <li key={task.template_id} className={styles.previewTaskItem}>
                        {task.title}
                        {task.is_optional && (
                          <Tag
                            color="default"
                            className={styles.optionalTag}
                          >
                            {t("tasks.template.optional")}
                          </Tag>
                        )}
                      </li>
                    ))}
                    {section.tasks.length > 8 && (
                      <li className={styles.previewOverflowItem}>
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

      <Modal
        title={
          applyTemplate
            ? `${applyTemplate.flag} ${t("tasks.template.createTimeline")}`
            : ""
        }
        open={Boolean(applyTemplate)}
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
          <Space orientation="vertical" className={styles.fullWidth} size="middle">
            <Card size="small">
              <Space orientation="vertical" className={styles.fullWidth}>
                <Text strong>
                  <CalendarOutlined /> {t("tasks.template.weddingDate")} *
                </Text>
                <DatePicker
                  value={weddingDate}
                  onChange={setWeddingDate}
                  className={styles.fullWidth}
                  size="large"
                  placeholder={t("tasks.template.weddingDatePlaceholder")}
                />
                <Text type="secondary" className={styles.helperText}>
                  {t("tasks.template.weddingDateHelp")}
                </Text>
                {weddingDate && weddingDate.isBefore(dayjs(), "day") && (
                  <Alert
                    type="warning"
                    showIcon
                    message={t("tasks.template.pastDateWarning")}
                  />
                )}
              </Space>
            </Card>

            <Card size="small">
              <div className={styles.optionalToggleRow}>
                <div>
                  <Text strong>{t("tasks.template.includeOptional")}</Text>
                  <br />
                  <Text type="secondary" className={styles.helperText}>
                    {t("tasks.template.includeOptionalDesc")}
                  </Text>
                </div>
                <Switch
                  checked={includeOptional}
                  onChange={setIncludeOptional}
                />
              </div>
              {applyTemplate?.template && (
                <div className={styles.optionalSummary}>
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
