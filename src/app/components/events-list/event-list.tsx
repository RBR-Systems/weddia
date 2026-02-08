"use client";

import React, { useMemo, useState } from "react";
import styles from "./event-list.module.css";
import Header from "@/app/common/Header/header";
import { EventStatus } from "./models/enums/event-list-enums";
import { eventList } from "@/app/data/EventList";
import { EventCardProps } from "./models/event-card-props-model";
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const EventList = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventCardProps[]>(() => [...eventList]);
  const [editingEvent, setEditingEvent] = useState<EventCardProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const statusOrder = {
        [EventStatus.IN_PROGRESS]: 1,
        [EventStatus.NOT_STARTED]: 2,
        [EventStatus.CANCELED]: 3,
        [EventStatus.COMPLETED]: 4,
      };

      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [events]);

  const getStatusCounts = (events: EventCardProps[]) => {
    const counts = events.reduce(
      (acc, event) => {
        acc[event.status] = (acc[event.status] || 0) + 1;
        return acc;
      },
      {} as Record<EventStatus, number>,
    );

    return Object.entries(counts).map(([status, count]) => {
      return `${count} ${t(`eventList.status.${status}`)}`;
    });
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
    setEvents((prev) =>
      prev.map((ev) =>
        ev.eventName === (editingEvent?.eventName ?? "")
          ? { ...ev, ...(values as EventCardProps) }
          : ev,
      ),
    );
    handleCancel();
  };

  const columns = [
    {
      title: t("eventList.columns.event"),
      dataIndex: "eventName",
      key: "eventName",
      render: (_: any, record: EventCardProps) => (
        <div>
          <div className={styles["event-name"]}>{record.eventName}</div>
          <div className={styles.description}>{record.description}</div>
        </div>
      ),
    },
    { title: t("eventList.columns.date"), dataIndex: "date", key: "date" },
    { title: t("eventList.columns.clients"), dataIndex: "clients", key: "clients" },
    { title: t("eventList.columns.location"), dataIndex: "location", key: "location" },
    { title: t("eventList.columns.invites"), dataIndex: "invites", key: "invites" },
    { title: t("eventList.columns.rsvp"), dataIndex: "rsvp", key: "rsvp" },
    { title: t("eventList.columns.tasks"), dataIndex: "tasks", key: "tasks" },
    {
      title: t("eventList.columns.budget"),
      key: "budget",
      width: 220,
      render: (_: unknown, record: EventCardProps) => {
        if (!record.budget)
          return <span className={styles["mutedText"]}>—</span>;
        const spent = record.spent ?? 0;
        const remaining = record.budget - spent;
        const percentage = Math.round((spent / record.budget) * 100);
        const isOverBudget = spent > record.budget;

        return (
          <div className={styles["budgetContainer"]}>
            <div className={styles["budgetRow"]}>
              <Tooltip title={t("eventList.totalBudget")}>
                <span>
                  <DollarOutlined /> {formatCurrency(record.budget)}
                </span>
              </Tooltip>
              <Tooltip title={isOverBudget ? t("eventList.overBudget") : t("eventList.remaining")}>
                <Tag
                  color={
                    isOverBudget
                      ? "red"
                      : remaining < record.budget * 0.2
                        ? "orange"
                        : "green"
                  }
                  className={styles["tagNoMargin"]}
                >
                  {isOverBudget
                    ? `-${formatCurrency(Math.abs(remaining))}`
                    : formatCurrency(remaining)}
                </Tag>
              </Tooltip>
            </div>
            <Progress
              percent={Math.min(percentage, 100)}
              size="small"
              status={
                isOverBudget
                  ? "exception"
                  : percentage >= 90
                    ? "active"
                    : "normal"
              }
              strokeColor={
                isOverBudget
                  ? "var(--status-canceled)"
                  : percentage >= 90
                    ? "var(--status-delayed)"
                    : "var(--status-completed)"
              }
              format={() => `${percentage}%`}
            />
            <div className={styles["spentText"]}>
              {t("eventList.spent", { amount: formatCurrency(spent) })}
            </div>
          </div>
        );
      },
    },
    {
      title: t("eventList.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => t(`eventList.status.${status}`),
    },
    {
      title: t("eventList.columns.actions"),
      key: "actions",
      render: (_: any, record: EventCardProps) => (
        <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
          {t("common.edit")}
        </Button>
      ),
    },
  ];

  return (
    <div className={styles["page-container"]}>
      <Header
        name={t("eventList.title")}
        items={getStatusCounts(events)}
        subheader={t("eventList.subheader")}
      ></Header>
      <div className={styles["table-container"]}>
        <Table
          dataSource={sortedEvents.map((s, i) => ({ ...s, key: i }))}
          columns={columns}
          pagination={{ pageSize: 8 }}
        />
      </div>

      <Modal
        title={t("eventList.editEvent")}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={editingEvent ?? {}}
        >
          <Form.Item
            name="eventName"
            label={t("eventList.form.eventName")}
            rules={[{ required: true }]}
          >
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
          <Form.Item name="invites" label={t("eventList.form.invites")}>
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="rsvp" label={t("eventList.form.rsvp")}>
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="tasks" label={t("eventList.form.tasks")}>
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="sits" label={t("eventList.form.sits")}>
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="budget" label={t("eventList.form.budget")}>
            <InputNumber
              className="u-full-width"
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as unknown as 0
              }
            />
          </Form.Item>
          <Form.Item name="spent" label={t("eventList.form.spent")}>
            <InputNumber
              className="u-full-width"
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as unknown as 0
              }
            />
          </Form.Item>
          <Form.Item name="status" label={t("eventList.form.status")}>
            <Select>
              <Option value={EventStatus.NOT_STARTED}>
                {t("eventList.status.Not Started")}
              </Option>
              <Option value={EventStatus.IN_PROGRESS}>
                {t("eventList.status.In Progress")}
              </Option>
              <Option value={EventStatus.COMPLETED}>
                {t("eventList.status.Completed")}
              </Option>
              <Option value={EventStatus.CANCELED}>
                {t("eventList.status.Canceled")}
              </Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className={styles["formActions"]}>
              <Button onClick={handleCancel}>{t("common.cancel")}</Button>
              <Button type="primary" htmlType="submit">
                {t("common.save")}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventList;
