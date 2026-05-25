"use client";

import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, PercentageOutlined, AlertOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { CheckInStats, CheckInStatusFilter } from "../../models/checkIn.models";
import styles from "./CheckIn.module.css";

interface CheckInStatsBarProps {
  readonly stats: CheckInStats;
  readonly activeStatuses?: string[];
  readonly onStatusClick?: (status: CheckInStatusFilter) => void;
}

const CheckInStatsBar: React.FC<CheckInStatsBarProps> = ({
  stats,
  activeStatuses = [],
  onStatusClick,
}) => {
  const { t } = useTranslation();

  const isActive = (filter: string) => activeStatuses.includes(filter);

  return (
    <Row gutter={[12, 12]} className={styles.statsRow}>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          className={`${styles.statCard} ${styles.statCardTotal}`}
          size="small"
        >
          <Statistic
            title={t("checkIn.stats.totalGuests")}
            value={stats.totalGuests}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={5}>
        <Card
          className={`${styles.statCard} ${styles.statCardCheckedIn} ${isActive("checked_in") ? styles.statCardActive : ""}`}
          size="small"
          onClick={() => onStatusClick?.("checked_in")}
        >
          <Statistic
            title={t("checkIn.stats.checkedIn")}
            value={stats.checkedIn}
            prefix={<CheckCircleOutlined />}
            styles={{ content: { color: "var(--status-completed)" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={5}>
        <Card
          className={`${styles.statCard} ${styles.statCardNotArrived} ${isActive("not_arrived") ? styles.statCardActive : ""}`}
          size="small"
          onClick={() => onStatusClick?.("not_arrived")}
        >
          <Statistic
            title={t("checkIn.stats.notArrived")}
            value={stats.notArrived}
            prefix={<ClockCircleOutlined />}
            styles={{ content: { color: "#faad14" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={5}>
        <Card
          className={`${styles.statCard} ${styles.statCardRate}`}
          size="small"
        >
          <Statistic
            title={t("checkIn.stats.attendanceRate")}
            value={stats.attendanceRate}
            suffix="%"
            prefix={<PercentageOutlined />}
            styles={{ content: { color: "var(--status-in-progress)" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={5}>
        <Card
          className={`${styles.statCard} ${styles.statCardSpecial} ${isActive("special_needs") ? styles.statCardActive : ""}`}
          size="small"
          onClick={() => onStatusClick?.("special_needs")}
        >
          <Statistic
            title={t("checkIn.stats.specialNeeds")}
            value={stats.specialNeedsCount}
            prefix={<AlertOutlined />}
            styles={{ content: { color: "#722ed1" } }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default CheckInStatsBar;

