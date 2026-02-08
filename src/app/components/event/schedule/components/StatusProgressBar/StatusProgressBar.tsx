"use client";

import React from "react";
import { Progress, Space, Tag, Row, Col } from "antd";
import Card from "@/app/common/Card/card";
import { useTranslation } from "react-i18next";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { calculateProgress, getStatusOptions } from "../../utils/helpers";
import { TimelineItem } from "../../models/types";
import styles from "./StatusProgressBar.module.css";

type Props = { items: TimelineItem[] };

const StatusProgressBar: React.FC<Props> = ({ items }) => {
  const { t } = useTranslation();
  const progress = calculateProgress(items);
  const statusOptions = getStatusOptions();

  const statusIcons = {
    completed: (
      <CheckCircleOutlined style={{ color: statusOptions.completed.color }} />
    ),
    in_progress: (
      <PlayCircleOutlined style={{ color: statusOptions.in_progress.color }} />
    ),
    pending: (
      <ClockCircleOutlined style={{ color: statusOptions.pending.color }} />
    ),
    delayed: (
      <WarningOutlined style={{ color: statusOptions.delayed.color }} />
    ),
    cancelled: (
      <CloseCircleOutlined style={{ color: statusOptions.cancelled.color }} />
    ),
  };

  return (
    <Card size="small" className={styles.card}>
      <Space orientation="vertical" className={styles.fullWidth} size="middle">
        <div className={styles.progressHeader}>
          <h3 className={styles.title}>{t("schedule.progressBar.eventProgress")}</h3>
          <span
            className={styles.percentage}
            style={{
              color:
                progress.completion_percentage === 100
                  ? statusOptions.completed.color
                    : "var(--status-in-progress)",
            }}
          >
            {progress.completion_percentage}%
          </span>
        </div>

        <Progress
          percent={progress.completion_percentage}
            strokeColor={{ from: "var(--status-in-progress)", to: statusOptions.completed.color }}
          status={progress.completion_percentage === 100 ? "success" : "active"}
          showInfo={false}
        />

        <Row gutter={[8, 8]}>
          <Col span={8}>
            <div className={styles.statCol}>
              <div
                className={styles.statNumber}
                style={{ color: statusOptions.completed.color }}
              >
                {progress.completed}
              </div>
              <div className={styles.statLabel}>
                <Space size={4}>
                  {statusIcons.completed}
                  <span>{t("schedule.progressBar.completed")}</span>
                </Space>
              </div>
            </div>
          </Col>

          <Col span={8}>
            <div className={styles.statCol}>
              <div
                className={styles.statNumber}
                style={{ color: statusOptions.in_progress.color }}
              >
                {progress.in_progress}
              </div>
              <div className={styles.statLabel}>
                <Space size={4}>
                  {statusIcons.in_progress}
                  <span>{t("schedule.progressBar.inProgress")}</span>
                </Space>
              </div>
            </div>
          </Col>

          <Col span={8}>
            <div className={styles.statCol}>
              <div
                className={styles.statNumber}
                style={{ color: statusOptions.pending.color }}
              >
                {progress.pending}
              </div>
              <div className={styles.statLabel}>
                <Space size={4}>
                  {statusIcons.pending}
                  <span>{t("schedule.progressBar.pending")}</span>
                </Space>
              </div>
            </div>
          </Col>
        </Row>

        {(progress.delayed > 0 || progress.cancelled > 0) && (
          <Space size="middle" className={styles.statusBreakdown}>
            {progress.delayed > 0 && (
              <Tag icon={statusIcons.delayed} color="warning">
                {progress.delayed} {t("schedule.progressBar.delayed")}
              </Tag>
            )}
            {progress.cancelled > 0 && (
              <Tag icon={statusIcons.cancelled} color="error">
                {progress.cancelled} {t("schedule.progressBar.cancelled")}
              </Tag>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default StatusProgressBar;
