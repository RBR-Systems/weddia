"use client";

import React from "react";
import { Progress, Space, Tag, Row, Col, Card } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { calculateProgress, STATUS_OPTIONS } from "../../utils/helpers";
import { TimelineItem } from "../../models/types";
import styles from "./StatusProgressBar.module.css";

type Props = { items: TimelineItem[] };

const StatusProgressBar: React.FC<Props> = ({ items }) => {
  const progress = calculateProgress(items);

  const statusIcons = {
    completed: (
      <CheckCircleOutlined style={{ color: STATUS_OPTIONS.completed.color }} />
    ),
    in_progress: (
      <PlayCircleOutlined style={{ color: STATUS_OPTIONS.in_progress.color }} />
    ),
    pending: (
      <ClockCircleOutlined style={{ color: STATUS_OPTIONS.pending.color }} />
    ),
    delayed: (
      <WarningOutlined style={{ color: STATUS_OPTIONS.delayed.color }} />
    ),
    cancelled: (
      <CloseCircleOutlined style={{ color: STATUS_OPTIONS.cancelled.color }} />
    ),
  };

  return (
    <Card size="small" className={styles.card}>
      <Space orientation="vertical" className={styles.fullWidth} size="middle">
        <div className={styles.progressHeader}>
          <h3 className={styles.title}>Event Progress</h3>
          <span
            className={styles.percentage}
            style={{
              color:
                progress.completion_percentage === 100
                  ? STATUS_OPTIONS.completed.color
                  : "#1890ff",
            }}
          >
            {progress.completion_percentage}%
          </span>
        </div>

        <Progress
          percent={progress.completion_percentage}
          strokeColor={{ from: "#1890ff", to: STATUS_OPTIONS.completed.color }}
          status={progress.completion_percentage === 100 ? "success" : "active"}
          showInfo={false}
        />

        <Row gutter={[8, 8]}>
          <Col span={8}>
            <div className={styles.statCol}>
              <div
                className={styles.statNumber}
                style={{ color: STATUS_OPTIONS.completed.color }}
              >
                {progress.completed}
              </div>
              <div className={styles.statLabel}>
                <Space size={4}>
                  {statusIcons.completed}
                  <span>Completed</span>
                </Space>
              </div>
            </div>
          </Col>

          <Col span={8}>
            <div className={styles.statCol}>
              <div
                className={styles.statNumber}
                style={{ color: STATUS_OPTIONS.in_progress.color }}
              >
                {progress.in_progress}
              </div>
              <div className={styles.statLabel}>
                <Space size={4}>
                  {statusIcons.in_progress}
                  <span>In Progress</span>
                </Space>
              </div>
            </div>
          </Col>

          <Col span={8}>
            <div className={styles.statCol}>
              <div
                className={styles.statNumber}
                style={{ color: STATUS_OPTIONS.pending.color }}
              >
                {progress.pending}
              </div>
              <div className={styles.statLabel}>
                <Space size={4}>
                  {statusIcons.pending}
                  <span>Pending</span>
                </Space>
              </div>
            </div>
          </Col>
        </Row>

        {(progress.delayed > 0 || progress.cancelled > 0) && (
          <Space size="middle" className={styles.statusBreakdown}>
            {progress.delayed > 0 && (
              <Tag icon={statusIcons.delayed} color="warning">
                {progress.delayed} Delayed
              </Tag>
            )}
            {progress.cancelled > 0 && (
              <Tag icon={statusIcons.cancelled} color="error">
                {progress.cancelled} Cancelled
              </Tag>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default StatusProgressBar;
