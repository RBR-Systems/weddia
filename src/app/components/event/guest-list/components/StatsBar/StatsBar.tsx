"use client";
import React from "react";
import { Row, Col, Statistic, Card } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  CloseCircleOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import { Guest, formatStatusLabel, statusColor } from "../../models/types";
import { useTranslation } from "react-i18next";
import styles from "../../GuestList.module.css";

export default function StatsBar({
  guests,
  activeStatuses = [],
  onStatusClick,
}: {
  guests: Guest[];
  activeStatuses?: string[];
  onStatusClick?: (
    status: "all" | "pending" | "attending" | "maybe" | "not_attending",
  ) => void;
}) {
  const { t } = useTranslation();

  const attending = guests.length
    ? guests.filter((g) => g.rsvp_status === "attending").length
    : 0;
  const pending = guests.length
    ? guests.filter((g) => g.rsvp_status === "pending").length
    : 0;
  const maybe = guests.length
    ? guests.filter((g) => g.rsvp_status === "maybe").length
    : 0;
  const declined = guests.length
    ? guests.filter((g) => g.rsvp_status === "not_attending").length
    : 0;
  const total = guests.length;
  const confirmedSeats = guests
    .filter((g) => g.rsvp_status === "attending")
    .reduce((s, g) => s + (g.party_size || 0), 0);

  const isActive = (status: string) => activeStatuses.includes(status);

  return (
    <Row gutter={[12, 12]} className={styles.statsRow}>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          size="small"
          className={`${styles.statCard} ${styles.statCardAttending} ${isActive("attending") ? styles.statCardActive : ""}`}
          style={isActive("attending") ? { outlineColor: "green" } : undefined}
          onClick={() => onStatusClick?.("attending")}
        >
          <Statistic
            title={formatStatusLabel("attending")}
            value={attending}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "green" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          size="small"
          className={`${styles.statCard} ${styles.statCardPending} ${isActive("pending") ? styles.statCardActive : ""}`}
          style={isActive("pending") ? { outlineColor: "#faad14" } : undefined}
          onClick={() => onStatusClick?.("pending")}
        >
          <Statistic
            title={formatStatusLabel("pending")}
            value={pending}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          size="small"
          className={`${styles.statCard} ${styles.statCardMaybe} ${isActive("maybe") ? styles.statCardActive : ""}`}
          style={isActive("maybe") ? { outlineColor: "#1890ff" } : undefined}
          onClick={() => onStatusClick?.("maybe")}
        >
          <Statistic
            title={formatStatusLabel("maybe")}
            value={maybe}
            prefix={<QuestionCircleOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card
          size="small"
          className={`${styles.statCard} ${styles.statCardNotAttending} ${isActive("not_attending") ? styles.statCardActive : ""}`}
          style={isActive("not_attending") ? { outlineColor: "#d9d9d9" } : undefined}
          onClick={() => onStatusClick?.("not_attending")}
        >
          <Statistic
            title={formatStatusLabel("not_attending")}
            value={declined}
            prefix={<CloseCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8}>
        <Card size="small" className={`${styles.statCard} ${styles.statCardTotal}`}>
          <Row gutter={8} align="middle">
            <Col span={12}>
              <Statistic
                title={t("guestList.stats.total", "Total Guests")}
                value={total}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title={t("guestList.stats.confirmedSeats", "Confirmed Seats")}
                value={confirmedSeats}
                prefix={<NumberOutlined />}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
