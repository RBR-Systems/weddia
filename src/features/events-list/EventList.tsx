"use client";
import { useMemo } from "react";
import styles from "./event-list.module.css";
import Header from "@/shared/components/Header/Header";
import { useEvent } from "@/shared/contexts/EventContext";
import { Table, Button, Tag, Tooltip } from "antd";
import { EditOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { EventNameCell } from "./components/EventNameCell/EventNameCell";
import { EventBudgetCell } from "./components/EventBudgetCell/EventBudgetCell";
import { EventEditModal } from "./components/EventEditModal/EventEditModal";
import { useEventEdit } from "./hooks/useEventEdit";
import { STATUS_CONFIG, EVENTS_PAGE_SIZE } from "./constants/events-list.constants";
import { sortEventsByStatus, countEventsByStatus } from "./utils/events-list.utils";
import type { EventCardProps } from "./models/eventCardProps.models";
import type { EventStatus } from "./models/enums/eventList.models";

const EventList = () => {
  const { t } = useTranslation();
  const { state: { events: { allEvents } } } = useEvent();
  const { form, isModalOpen, saving, openEditModal, handleCancel, handleSave } = useEventEdit();

  const sortedEvents = useMemo(() => sortEventsByStatus(allEvents), [allEvents]);

  const statusSummary = useMemo(() => {
    const counts = countEventsByStatus(allEvents);
    return Object.entries(counts).map(
      ([status, count]) => `${count} ${t(`eventList.status.${status}`)}`,
    );
  }, [allEvents, t]);

  const columns = [
    {
      title: t("eventList.columns.event"),
      dataIndex: "eventName",
      key: "eventName",
      width: 240,
      render: (_: unknown, record: EventCardProps) => <EventNameCell record={record} />,
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
      render: (_: unknown, record: EventCardProps) =>
        record.budget ? (
          <EventBudgetCell budget={record.budget} spent={record.spent ?? 0} />
        ) : (
          <span className={styles.mutedText}>—</span>
        ),
    },
    {
      title: t("eventList.columns.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: EventStatus) => {
        const cfg = STATUS_CONFIG[status];
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
        items={statusSummary}
        subheader={t("eventList.subheader")}
      />
      <div className={styles["table-container"]}>
        <Table
          dataSource={sortedEvents.map((s, i) => ({ ...s, key: s.id ?? i }))}
          columns={columns}
          pagination={{ pageSize: EVENTS_PAGE_SIZE, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
          size="middle"
          className={styles.eventTable}
          rowClassName={styles.tableRow}
        />
      </div>
      <EventEditModal
        open={isModalOpen}
        form={form}
        saving={saving}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  );
};

export default EventList;

