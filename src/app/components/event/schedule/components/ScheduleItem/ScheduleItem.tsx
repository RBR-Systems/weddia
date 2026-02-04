"use client";

import React from "react";
import { Card, Tag, Badge, Collapse, Space, Button, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  EnvironmentOutlined,
  FieldTimeOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { TimelineItem, Status } from "../../models/types";
import {
  calculateDuration,
  calculateSetupDuration,
  formatTime,
  STATUS_OPTIONS,
} from "../../utils/helpers";
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
  ceremony: "#D4AF37",
  reception: "#4A90E2",
  photos: "#9B59B6",
  vendor_arrival: "#95A5A6",
  vendor_setup: "#BDC3C7",
  vendor_breakdown: "#7F8C8D",
  entertainment: "#E74C3C",
  meal_service: "#27AE60",
  speeches: "#F39C12",
  special_moment: "#E91E63",
  transition: "#34495E",
  setup: "#95A5A6",
  breakdown: "#7F8C8D",
  guest_activity: "#3498DB",
};

const statusMap: Record<
  string,
  {
    badge: "default" | "success" | "processing" | "warning" | "error";
    text: string;
  }
> = {
  pending: { badge: "default", text: "Pending" },
  in_progress: { badge: "processing", text: "In Progress" },
  completed: { badge: "success", text: "Completed" },
  delayed: { badge: "warning", text: "Delayed" },
  cancelled: { badge: "error", text: "Cancelled" },
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
  const actualStatus: Status = (item.status ?? "pending") as Status;
  const displayStatus: Status =
    isNow && actualStatus === "pending" ? "in_progress" : actualStatus;
  const statusInfo = STATUS_OPTIONS[displayStatus];

  const now = Date.now();
  const isPast = new Date(item.end_time).getTime() < now;
  const isCompleted = actualStatus === "completed";
  const isCancelled = actualStatus === "cancelled";

  const startTime = new Date(item.start_time).getTime();
  const endTime = new Date(item.end_time).getTime();
  const duration = Math.max(1, endTime - startTime);
  const progressPercent = isNow
    ? Math.max(
        0,
        Math.min(100, Math.round(((now - startTime) / duration) * 100)),
      )
    : 0;

  const statusOrder: Status[] = [
    "pending",
    "in_progress",
    "completed",
    "delayed",
    "cancelled",
  ];

  const handleStatusUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    const currentIndex = statusOrder.indexOf(actualStatus);
    const nextIndex =
      currentIndex > 0 ? currentIndex - 1 : statusOrder.length - 1;
    onStatusChange(item.timeline_item_id, statusOrder[nextIndex]);
  };

  const handleStatusDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    const currentIndex = statusOrder.indexOf(actualStatus);
    const nextIndex =
      currentIndex < statusOrder.length - 1 ? currentIndex + 1 : 0;
    onStatusChange(item.timeline_item_id, statusOrder[nextIndex]);
  };

  return (
    <Card
      size="small"
      bordered={false}
      onClick={() => onToggle(item.timeline_item_id)}
      className={[
        styles.scheduleItem,
        isNow ? styles.scheduleItemActive : "",
        isPast ? styles.scheduleItemPast : "",
        isCompleted ? styles.scheduleItemCompleted : "",
        isCancelled ? styles.scheduleItemCancelled : "",
        displayStatus === "delayed" ? styles.scheduleItemDelayed : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-current={isNow ? "true" : undefined}
      data-past={isPast ? "true" : undefined}
      data-status={displayStatus}
    >
      {isNow && (
        <div className={styles.nowProgressWrap} aria-hidden="false">
          <div
            className={styles.nowProgress}
            style={{ width: `${progressPercent}%` }}
            aria-label={`Event progress ${progressPercent}%`}
          />
        </div>
      )}

      <Space orientation="vertical" className={styles.fullWidth} size="small">
        {item.setup_time && (
          <div
            className={styles.setupTimeBlock}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={styles.setupTimeLabel}>
              {formatTime(item.setup_time)}
            </span>
            <ToolOutlined className={styles.setupIcon} />
            <span className={styles.setupLabel}>
              Setup: {calculateSetupDuration(item)}
            </span>
          </div>
        )}

        <div className={styles.headerRow}>
          <div className={styles.titleCenter}>
            <strong
              className={isCancelled ? styles.titleCancelled : styles.title}
            >
              {item.title}
            </strong>
          </div>

          <div className={styles.headerLeft}>
            <Space size={4} wrap>
              <Tag
                className={styles.typeTag}
                style={{
                  textTransform: "capitalize",
                  background: typeColors[item.type] ?? undefined,
                }}
              >
                {item.type.replace(/_/g, " ")}
              </Tag>
            </Space>
          </div>

          <div
            className={styles.headerRight}
            onClick={(e) => e.stopPropagation()}
          >
            <Space size={8} align="center">
              <Badge
                status={
                  displayStatus === "completed"
                    ? "success"
                    : displayStatus === "in_progress"
                      ? "processing"
                      : displayStatus === "delayed"
                        ? "warning"
                        : displayStatus === "cancelled"
                          ? "error"
                          : "default"
                }
                text={
                  <span className={styles.statusLabel}>{statusInfo.label}</span>
                }
              />

              <Space
                size={2}
                orientation="vertical"
                className={styles.statusButtonsWrap}
              >
                <Tooltip title="Previous status">
                  <Button
                    type="text"
                    size="small"
                    icon={<UpOutlined />}
                    onClick={handleStatusUp}
                    className={styles.smallIconBtn}
                  />
                </Tooltip>
                <Tooltip title="Next status">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownOutlined />}
                    onClick={handleStatusDown}
                    className={styles.smallIconBtn}
                  />
                </Tooltip>
              </Space>

              <div className={styles.timeLabel} aria-hidden={false}>
                {timeLabel}
              </div>
            </Space>
          </div>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaLeft}>
            {item.location_name && (
              <span className={styles.location}>
                <EnvironmentOutlined />
                <span>{item.location_name}</span>
              </span>
            )}

            <span className={styles.duration}>
              <FieldTimeOutlined />
              <span>{calculateDuration(item)}</span>
            </span>
          </div>

          <div
            className={styles.actionButtons}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(item);
              }}
            >
              Edit
            </Button>
            <Button
              type="default"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  onDelete(item.timeline_item_id);
                } else {
                  alert("Delete handler not available");
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        {expanded && (
          <div className={styles.expandedArea}>
            <Collapse activeKey={["1"]}>
              <Collapse.Panel key="1" header="Details">
                {item.description && (
                  <div className={styles.detailLine}>{item.description}</div>
                )}
                {item.notes && (
                  <div className={styles.detailNotes}>Notes: {item.notes}</div>
                )}
              </Collapse.Panel>
            </Collapse>
            <div className={styles.detailsFooter}>
              {isPast && !isCancelled && !isCompleted && (
                <Tag className={styles.passedTag}>Passed</Tag>
              )}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default React.memo(ScheduleItem, (prev, next) => {
  return (
    prev.item.timeline_item_id === next.item.timeline_item_id &&
    prev.item.updated_at === next.item.updated_at &&
    prev.item.status === next.item.status &&
    prev.expanded === next.expanded &&
    prev.isNow === next.isNow
  );
});
