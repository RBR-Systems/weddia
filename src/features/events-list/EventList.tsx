"use client";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import styles from "./event-list.module.css";
import Header from "@/shared/components/Header/Header";
import { formatInputNumber, parseInputNumber } from "@/utils/formatters.utils";
import { EventStatus } from "./models/enums/eventList.models";
import { EventCardProps } from "./models/eventCardProps.models";
import { useEvent } from "@/shared/contexts/EventContext";
import { EventActions } from "@/shared/contexts/eventActions";
import { apiPut } from "@/shared/api/apiClient";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Progress, Tag, Tooltip, DatePicker, message } from "antd";
import { EditOutlined, DollarOutlined, EnvironmentOutlined, CalendarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { TextArea } = Input;

const statusToApiStatus: Record<EventStatus, string> = {
  [EventStatus.IN_PROGRESS]: "in_progress",
  [EventStatus.NOT_STARTED]: "not_started",
  [EventStatus.COMPLETED]: "completed",
  [EventStatus.CANCELED]: "canceled",
};

const statusConfig: Record<EventStatus, { color: string; label: string }> = {
  [EventStatus.IN_PROGRESS]:  { color: "processing", label: "In Progress" },
  [EventStatus.NOT_STARTED]:  { color: "default",    label: "Not Started" },
  [EventStatus.COMPLETED]:    { color: "success",    label: "Completed" },
  [EventStatus.CANCELED]:     { color: "error",      label: "Canceled" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function EventInitial({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  return <div className={styles.eventInitial}>{initial}</div>;
}

const EventList = () => {
  const { t } = useTranslation();
  const { state: { events: { allEvents } }, dispatch } = useEvent();

  const [editingEvent, setEditingEvent] = useState<EventCardProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
    form.setFieldsValue({
      eventName: record.eventName,
      eventDate: record.rawDate ? dayjs(record.rawDate) : null,
      location: record.location,
      description: record.description,
      budget: record.budget,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const handleSave = async (values: {
    eventName: string;
    eventDate: dayjs.Dayjs | null;
    location: string;
    description: string;
    budget: number;
    status: EventStatus;
  }) => {
    if (!editingEvent?.id) return;
    setSaving(true);
    try {
      const isoDate = values.eventDate?.toISOString() ?? editingEvent.rawDate ?? new Date().toISOString();
      const body = {
        eventName: values.eventName,
        title: values.eventName,
        description: values.description ?? "",
        eventDate: isoDate,
        eventAddress: values.location ?? "",
        budget: values.budget ?? 0,
        status: statusToApiStatus[values.status],
      };
      await apiPut(`/api/events/${editingEvent.id}?adminId=1`, body);

      const d = new Date(isoDate);
      const formattedDate = d.toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric",
      });
      dispatch({
        type: EventActions.UPDATE_EVENT,
        payload: {
          ...editingEvent,
          eventName: values.eventName,
          date: formattedDate,
          rawDate: isoDate,
          description: values.description ?? "",
          location: values.location ?? "",
          budget: values.budget,
          status: values.status,
        },
      });
      message.success(t("common.save") + " ✓");
      handleCancel();
    } catch {
      message.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: t("eventList.columns.event"),
      dataIndex: "eventName",
      key: "eventName",
      width: 240,
      render: (_: unknown, record: EventCardProps) => (
        <div className={styles.eventCell}>
          <EventInitial name={record.eventName} />
          <div className={styles.eventCellText}>
            <div className={styles.eventName}>{record.eventName}</div>
            {record.description && (
              <div className={styles.description}>{record.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("eventList.columns.date"),
      dataIndex: "date",
      key: "date",
      width: 150,
      render: (v: string) => (
        <div className={styles.dateCell}>
          <CalendarOutlined className={styles.cellIcon} />
          <span>{v || <span className={styles.mutedText}>—</span>}</span>
        </div>
      ),
    },
    {
      title: t("eventList.columns.location"),
      dataIndex: "location",
      key: "location",
      width: 180,
      ellipsis: true,
      render: (v: string) =>
        v ? (
          <div className={styles.locationCell}>
            <EnvironmentOutlined className={styles.cellIcon} />
            <span>{v}</span>
          </div>
        ) : (
          <span className={styles.mutedText}>—</span>
        ),
    },
    {
      title: t("eventList.columns.budget"),
      key: "budget",
      width: 200,
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
      width: 130,
      render: (status: EventStatus) => {
        const cfg = statusConfig[status];
        return (
          <Tag color={cfg?.color ?? "default"} className={styles.statusTag}>
            {t(`eventList.status.${status}`, status)}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 56,
      fixed: "right" as const,
      render: (_: unknown, record: EventCardProps) => (
        <Tooltip title={t("common.edit")}>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="text"
            className={styles.editBtn}
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
          className={styles.eventTable}
          rowClassName={styles.tableRow}
        />
      </div>

      <Modal
        title={
          <div className={styles.modalHeader}>
            <EditOutlined className={styles.modalIcon} />
            <span>{t("eventList.editEvent")}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        forceRender
        style={{ width: 560 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className={styles.editForm}>
          <Form.Item
            name="eventName"
            label={t("eventList.form.eventName")}
            rules={[{ required: true, message: "Event name is required" }]}
          >
            <Input placeholder="e.g. Sarah & John's Wedding" />
          </Form.Item>

          <div className={styles.formRow}>
            <Form.Item
              name="eventDate"
              label={t("eventList.form.date")}
              className={styles.formRowItem}
            >
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="MMM D, YYYY HH:mm"
                placeholder="Select date & time"
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={t("eventList.form.status")}
              className={styles.formRowItem}
            >
              <Select>
                <Option value={EventStatus.NOT_STARTED}>{t("eventList.status.Not Started")}</Option>
                <Option value={EventStatus.IN_PROGRESS}>{t("eventList.status.In Progress")}</Option>
                <Option value={EventStatus.COMPLETED}>{t("eventList.status.Completed")}</Option>
                <Option value={EventStatus.CANCELED}>{t("eventList.status.Canceled")}</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="location" label={t("eventList.form.location")}>
            <Input
              placeholder="Venue or address"
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              placeholder="Short description of the event"
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={250}
              showCount
            />
          </Form.Item>

          <Form.Item name="budget" label={t("eventList.form.budget")}>
            <InputNumber
              style={{ width: "100%" }}
              prefix={<DollarOutlined />}
              formatter={(v) => formatInputNumber(v)}
              parser={(v) => parseInputNumber(v) as 0}
              min={0}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item className={styles.formActionsItem}>
            <div className={styles.formActions}>
              <Button onClick={handleCancel}>{t("common.cancel")}</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
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

