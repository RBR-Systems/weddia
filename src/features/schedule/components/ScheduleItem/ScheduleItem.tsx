"use client";

import React from "react";
import { Tag, Badge, Button, Tooltip } from "antd";
import Card from "@/shared/components/Card/Card";
import {
  EditOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { TimelineItem, Status } from "../../models/schedule.models";
import { useTranslation } from "react-i18next";
import {
  calculateDuration,
  calculateSetupDuration,
  formatTime,
  getStatusOptions,
} from "../../utils/schedule.utils";
import styles from "./schedule-item.module.css";

type Props = {
  item: TimelineItem;
  expanded: boolean;
  onToggle: (id: string) => void;
  isNow?: boolean;
  onEdit?: (item: TimelineItem) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (itemId: string, newStatus: Status) => void;
  timeLabel?: string;
};

const typeColors: Record<string, string> = {
  ceremony: "#c9845a",
  reception: "#5b6bc1",
  photos: "#9b59b6",
  vendor_arrival: "#95a5a6",
  vendor_setup: "#7f8c8d",
  vendor_breakdown: "#636e72",
  entertainment: "#e17055",
  meal_service: "#27ae60",
  speeches: "#e8a838",
  special_moment: "#e84393",
  transition: "#74b9ff",
  setup: "#95a5a6",
  breakdown: "#7f8c8d",
  guest_activity: "#3498db",
  party: "#a29bfe",
};

const statusOrder: Status[] = [
  "pending",
  "in_progress",
  "completed",
  "delayed",
  "cancelled",
];

const badgeStatus: Record<string, "default" | "success" | "processing" | "warning" | "error"> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
  delayed: "warning",
  cancelled: "error",
};

export const ScheduleItem: React.FC<Props> = ({
  item,
  expanded,
  onToggle,
  isNow,
  onEdit,
  onDelete,
  onStatusChange,
  timeLabel,
}) => {
  const { t } = useTranslation();
  const actualStatus: Status = (item.status ?? "pending") as Status;
  const displayStatus: Status =
    isNow && actualStatus === "pending" ? "in_progress" : actualStatus;
  const statusInfo = getStatusOptions()[displayStatus];

  const now = Date.now();
  const isPast = new Date(item.end_time).getTime() < now;
  const isCompleted = actualStatus === "completed";
  const isCancelled = actualStatus === "cancelled";

  const startTime = new Date(item.start_time).getTime();
  const endTime = new Date(item.end_time).getTime();
  const duration = Math.max(1, endTime - startTime);
  const progressPercent = isNow
    ? Math.max(0, Math.min(100, Math.round(((now - startTime) / duration) * 100)))
    : 0;

  const handleStatusUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    const i = statusOrder.indexOf(actualStatus);
    onStatusChange(item.timeline_item_id, statusOrder[i > 0 ? i - 1 : statusOrder.length - 1]);
  };

  const handleStatusDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    const i = statusOrder.indexOf(actualStatus);
    onStatusChange(item.timeline_item_id, statusOrder[i < statusOrder.length - 1 ? i + 1 : 0]);
  };

  return (
    <Card
      size="small"
      variant="borderless"
      onClick={() => onToggle(item.timeline_item_id)}
      className={[
        styles.scheduleItem,
        isNow ? styles.scheduleItemActive : "",
        isPast ? styles.scheduleItemPast : "",
        isCompleted ? styles.scheduleItemCompleted : "",
        isCancelled ? styles.scheduleItemCancelled : "",
        displayStatus === "delayed" ? styles.scheduleItemDelayed : "",
      ].filter(Boolean).join(" ")}
      aria-current={isNow ? "true" : undefined}
      data-past={isPast ? "true" : undefined}
      data-status={displayStatus}
    >
      {/* Now progress bar */}
      {isNow && (
        <div className={styles.nowProgressWrap}>
          <div className={styles.nowProgress} style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {/* Setup time */}
      {item.setup_time && (
        <div className={styles.setupTimeBlock} onClick={(e) => e.stopPropagation()}>
          <ToolOutlined className={styles.setupIcon} />
          <span className={styles.setupTimeLabel}>{formatTime(item.setup_time)}</span>
          <span className={styles.setupLabel}>Setup · {calculateSetupDuration(item)}</span>
        </div>
      )}

      {/* Main row */}
      <div className={styles.row}>

        {/* Time */}
        <div className={styles.timeCol}>{timeLabel}</div>

        {/* Title + meta */}
        <div className={styles.titleCol}>
          <span className={isCancelled ? styles.titleCancelled : styles.title}>
            {item.title}
          </span>
          <div className={styles.meta}>
            {item.location_name && (
              <span className={styles.metaItem}>
                <EnvironmentOutlined />
                {item.location_name}
              </span>
            )}
            <span className={styles.metaItem}>
              <FieldTimeOutlined />
              {calculateDuration(item)}
            </span>
          </div>
        </div>

        {/* Type tag */}
        <div className={styles.tagsCol}>
          <Tag
            className={styles.typeTag}
            style={{ background: typeColors[item.type] ?? "#aaa" }}
          >
            {item.type.replace(/_/g, " ")}
          </Tag>
        </div>

        {/* Status */}
        <div className={styles.statusCol} onClick={(e) => e.stopPropagation()}>
          <Badge
            status={badgeStatus[displayStatus] ?? "default"}
            text={<span className={styles.statusLabel}>{statusInfo?.label ?? displayStatus}</span>}
          />
        </div>

        {/* Status cycle + actions */}
        <div className={styles.actionsCol} onClick={(e) => e.stopPropagation()}>
          <div className={styles.statusButtons}>
            <Tooltip title="Previous status">
              <Button type="text" size="small" icon={<UpOutlined />} onClick={handleStatusUp} className={styles.smallIconBtn} />
            </Tooltip>
            <Tooltip title="Next status">
              <Button type="text" size="small" icon={<DownOutlined />} onClick={handleStatusDown} className={styles.smallIconBtn} />
            </Tooltip>
          </div>
          <Tooltip title={t("schedule.item.editItem")}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); onEdit?.(item); }} />
          </Tooltip>
          <Tooltip title={t("schedule.item.deleteItem")}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); onDelete?.(item.timeline_item_id); }} />
          </Tooltip>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (item.description || item.notes) && (
        <div className={styles.expandedArea}>
          {item.description && <div className={styles.detailLine}>{item.description}</div>}
          {item.notes && <div className={styles.detailNotes}>{t("schedule.item.notes")}: {item.notes}</div>}
        </div>
      )}
    </Card>
  );
};

export default React.memo(ScheduleItem, (prev, next) =>
  prev.item.timeline_item_id === next.item.timeline_item_id &&
  prev.item.updated_at === next.item.updated_at &&
  prev.item.status === next.item.status &&
  prev.expanded === next.expanded &&
  prev.isNow === next.isNow,
);
