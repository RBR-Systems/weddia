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
      const statusText = status.replace(/([A-Z])/g, " $1").trim();
      return `${count} ${statusText}`;
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
      title: "Event",
      dataIndex: "eventName",
      key: "eventName",
      render: (_: any, record: EventCardProps) => (
        <div>
          <div className={styles["event-name"]}>{record.eventName}</div>
          <div className={styles.description}>{record.description}</div>
        </div>
      ),
    },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Clients", dataIndex: "clients", key: "clients" },
    { title: "Location", dataIndex: "location", key: "location" },
    { title: "Invites", dataIndex: "invites", key: "invites" },
    { title: "RSVP", dataIndex: "rsvp", key: "rsvp" },
    { title: "Tasks", dataIndex: "tasks", key: "tasks" },
    {
      title: "Budget",
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
              <Tooltip title="Total Budget">
                <span>
                  <DollarOutlined /> {formatCurrency(record.budget)}
                </span>
              </Tooltip>
              <Tooltip title={isOverBudget ? "Over Budget!" : "Remaining"}>
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
              Spent: {formatCurrency(spent)}
            </div>
          </div>
        );
      },
    },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: EventCardProps) => (
        <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className={styles["page-container"]}>
      <Header
        name="Events"
        items={getStatusCounts(events)}
        subheader="Planning Center"
      ></Header>
      <div className={styles["table-container"]}>
        <Table
          dataSource={sortedEvents.map((s, i) => ({ ...s, key: i }))}
          columns={columns}
          pagination={{ pageSize: 8 }}
        />
      </div>

      <Modal
        title="Edit Event"
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
            label="Event name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="date" label="Date">
            <Input />
          </Form.Item>
          <Form.Item name="clients" label="Clients">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input />
          </Form.Item>
          <Form.Item name="invites" label="Invites">
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="rsvp" label="RSVP">
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="tasks" label="Tasks">
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="sits" label="Sits">
            <InputNumber className={styles["formFullWidth"]} />
          </Form.Item>
          <Form.Item name="budget" label="Budget ($)">
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
          <Form.Item name="spent" label="Spent ($)">
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
          <Form.Item name="status" label="Status">
            <Select>
              <Option value={EventStatus.NOT_STARTED}>
                {EventStatus.NOT_STARTED}
              </Option>
              <Option value={EventStatus.IN_PROGRESS}>
                {EventStatus.IN_PROGRESS}
              </Option>
              <Option value={EventStatus.COMPLETED}>
                {EventStatus.COMPLETED}
              </Option>
              <Option value={EventStatus.CANCELED}>
                {EventStatus.CANCELED}
              </Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className={styles["formActions"]}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventList;
