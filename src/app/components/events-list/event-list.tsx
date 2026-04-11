"use client";

import React, { useMemo, useState } from "react";
import styles from "./event-list.module.css";
import Header from "@/app/common/Header/header";
import { EventStatus } from "./models/enums/event-list-enums";
import { EventCardProps } from "./models/event-card-props-model";
import { useEvent } from "@/app/contexts/EventContext";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Progress,
  Tag,
  Tooltip,
} from "antd";
import { EditOutlined, DollarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const EventList = () => {
  const { t } = useTranslation();
  const { state: { events: { allEvents } }, dispatch } = useEvent();

  const [editingEvent, setEditingEvent] = useState<EventCardProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const sortedEvents = useMemo(() => {
    const statusOrder: Record<string, number> = {
      [EventStatus.IN_PROGRESS]: 1,
      [EventStatus.NOT_STARTED]: 2,
      [EventStatus.CANCELED]: 3,
      [EventStatus.COMPLETED]: 4,
    };
    return [...allEvents].sort(
      (a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5),
    );
  }, [allEvents]);

  const getStatusCounts = () => {
    const counts = allEvents.reduce(
      (acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; },
      {} as Record<string, number>,
    );
    return Object.entries(counts).map(
      ([status, count]) => `${count} ${t(`eventList.status.${status}`)}`,
    );
  };

  const openEditModal = (record: EventCardProps) => {
    setEditingEvent(record);
    form.setFieldsValue(record as any);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const handleSave = (values: any) => {
    // Local-only edit for now; API update can be wired here
    handleCancel();
  };

  const statusTagColor: Record<string, string> = {
    [EventStatus.IN_PROGRESS]: "processing",
    [EventStatus.NOT_STARTED]: "default",
    [EventStatus.COMPLETED]: "success",
    [EventStatus.CANCELED]: "error",
  };

  const columns = [
    {
      title: t("eventList.columns.event"),
      dataIndex: "eventName",
      key: "eventName",
      width: 200,
      ellipsis: true,
      render: (_: any, record: EventCardProps) => (
        <div>
          <div className={styles["event-name"]}>{record.eventName}</div>
          {record.description && (
            <div className={styles.description}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: t("eventList.columns.date"),
      dataIndex: "date",
      key: "date",
      width: 130,
      ellipsis: true,
    },
    {
      title: t("eventList.columns.clients"),
      dataIndex: "clients",
      key: "clients",
      width: 160,
      ellipsis: true,
      render: (v: string) => v || <span className={styles.mutedText}>—</span>,
    },
    {
      title: t("eventList.columns.location"),
      dataIndex: "location",
      key: "location",
      width: 160,
      ellipsis: true,
      render: (v: string) => v || <span className={styles.mutedText}>—</span>,
    },
    {
      title: t("eventList.columns.invites"),
      dataIndex: "invites",
      key: "invites",
      width: 80,
      align: "right" as const,
      render: (v: number) => v || <span className={styles.mutedText}>—</span>,
    },
    {
      title: t("eventList.columns.rsvp"),
      dataIndex: "rsvp",
      key: "rsvp",
      width: 80,
      align: "right" as const,
      render: (v: number) => v || <span className={styles.mutedText}>—</span>,
    },
    {
      title: t("eventList.columns.budget"),
      key: "budget",
      width: 210,
      render: (_: unknown, record: EventCardProps) => {
        if (!record.budget) return <span className={styles.mutedText}>—</span>;
        const spent = record.spent ?? 0;
        const remaining = record.budget - spent;
        const percentage = Math.round((spent / record.budget) * 100);
        const isOverBudget = spent > record.budget;
        return (
          <div className={styles.budgetContainer}>
            <div className={styles.budgetRow}>
              <Tooltip title={t("eventList.totalBudget")}>
                <span className={styles.budgetTotal}>
                  <DollarOutlined /> {formatCurrency(record.budget)}
                </span>
              </Tooltip>
              <Tag
                color={isOverBudget ? "red" : remaining < record.budget * 0.2 ? "orange" : "green"}
                className={styles.tagNoMargin}
              >
                {isOverBudget ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
              </Tag>
            </div>
            <Progress
              percent={Math.min(percentage, 100)}
              size="small"
              status={isOverBudget ? "exception" : percentage >= 90 ? "active" : "normal"}
              strokeColor={
                isOverBudget ? "var(--status-canceled)" :
                percentage >= 90 ? "var(--status-delayed)" : "var(--status-completed)"
              }
              format={() => `${percentage}%`}
            />
          </div>
        );
      },
    },
    {
      title: t("eventList.columns.status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={statusTagColor[status] ?? "default"}>
          {t(`eventList.status.${status}`, status)}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      fixed: "right" as const,
      render: (_: any, record: EventCardProps) => (
        <Tooltip title={t("common.edit")}>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="text"
            onClick={() => openEditModal(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className={styles["page-container"]}>
      <Header
        name={t("eventList.title")}
        items={getStatusCounts()}
        subheader={t("eventList.subheader")}
      />
      <div className={styles["table-container"]}>
        <Table
          dataSource={sortedEvents.map((s, i) => ({ ...s, key: s.id ?? i }))}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
          size="middle"
        />
      </div>

      <Modal
        title={t("eventList.editEvent")}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="eventName" label={t("eventList.form.eventName")} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date" label={t("eventList.form.date")}>
            <Input />
          </Form.Item>
          <Form.Item name="clients" label={t("eventList.form.clients")}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label={t("eventList.form.location")}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t("eventList.form.status")}>
            <Select>
              <Option value={EventStatus.NOT_STARTED}>{t("eventList.status.Not Started")}</Option>
              <Option value={EventStatus.IN_PROGRESS}>{t("eventList.status.In Progress")}</Option>
              <Option value={EventStatus.COMPLETED}>{t("eventList.status.Completed")}</Option>
              <Option value={EventStatus.CANCELED}>{t("eventList.status.Canceled")}</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <div className={styles.formActions}>
              <Button onClick={handleCancel}>{t("common.cancel")}</Button>
              <Button type="primary" htmlType="submit">{t("common.save")}</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventList;
