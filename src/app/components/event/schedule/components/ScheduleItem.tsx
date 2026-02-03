"use client";

import React from "react";
import { Card, Tag, Badge, Collapse, Space, Button, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { EnvironmentOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { TimelineItem, Status } from "../models/types";
import { calculateDuration, STATUS_OPTIONS } from "../utils/helpers";
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
  // Use the actual stored status for changes; only highlight as "in_progress" when current time
  const actualStatus: Status = (item.status ?? "pending") as Status;
  const displayStatus: Status =
    isNow && actualStatus === "pending" ? "in_progress" : actualStatus;
  const statusInfo = STATUS_OPTIONS[displayStatus];

  const now = Date.now();
  const isPast = new Date(item.end_time).getTime() < now;
  // Completed/cancelled state should reflect the stored status (actualStatus)
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

  // Define status order for cycling
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

    // Cycle based on the actual stored status so changes persist even when the item is "now"
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

  // edit handler provided via props (destructured above)

  return (
    <Card
      size="small"
      bordered={false}
      bodyStyle={{ padding: 12 }}
      onClick={() => onToggle(item.timeline_item_id)}
      style={{ width: "100%" }}
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
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* Header row */}
        <Space
          direction="horizontal"
          style={{
            justifyContent: "space-between",
            width: "100%",
            alignItems: "flex-start",
          }}
        >
          <Space align="start">
            <div>
              <Space size={4} wrap>
                {isNow && (
                  <Tag color="#ff4d4f" style={{ margin: 0 }}>
                    Now
                  </Tag>
                )}
                <Tag
                  color={typeColors[item.type] ?? "default"}
                  style={{ textTransform: "capitalize", margin: 0 }}
                >
                  {item.type.replace(/_/g, " ")}
                </Tag>
                <strong
                  style={{
                    textDecoration: isCancelled ? "line-through" : "none",
                    color: isCancelled ? "#999" : "inherit",
                  }}
                >
                  {item.title}
                </strong>
              </Space>
            </div>
          </Space>

          {/* Status controls + prominent time */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={styles.statusControls}
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
                text={<span style={{ fontSize: 13 }}>{statusInfo.label}</span>}
              />
              <Space size={2} direction="vertical" style={{ marginLeft: 4 }}>
                <Tooltip title="Previous status">
                  <Button
                    type="text"
                    size="small"
                    icon={<UpOutlined />}
                    onClick={handleStatusUp}
                    style={{
                      padding: "0 4px",
                      height: 18,
                      fontSize: 10,
                      lineHeight: 1,
                    }}
                  />
                </Tooltip>
                <Tooltip title="Next status">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownOutlined />}
                    onClick={handleStatusDown}
                    style={{
                      padding: "0 4px",
                      height: 18,
                      fontSize: 10,
                      lineHeight: 1,
                    }}
                  />
                </Tooltip>
              </Space>

              {/* Prominent time label placed after status controls */}
              <div className={styles.timeLabel} aria-hidden={false}>
                {timeLabel}
              </div>
            </Space>
          </div>
        </Space>

        {/* Meta row (time moved to header). Location left, actions on right. */}
        <div
          style={{
            color: "#666",
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {item.location_name && (
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <EnvironmentOutlined style={{ color: "#888" }} />
                <span>{item.location_name}</span>
              </span>
            )}

            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <FieldTimeOutlined style={{ color: "#888" }} />
              <span>{calculateDuration(item)}</span>
            </span>
          </div>

          <div className={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
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
              style={{ marginLeft: 8 }}
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
          <div style={{ width: "100%", marginTop: 8 }}>
            <Collapse activeKey={["1"]}>
              <Collapse.Panel key="1" header="Details">
                {item.description && (
                  <div style={{ marginBottom: 8 }}>{item.description}</div>
                )}
                {item.notes && (
                  <div style={{ color: "#444" }}>Notes: {item.notes}</div>
                )}
              </Collapse.Panel>
            </Collapse>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              {isPast && !isCancelled && !isCompleted && (
                <Tag color="default" style={{ marginRight: 8 }}>
                  Passed
                </Tag>
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
