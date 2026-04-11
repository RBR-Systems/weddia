"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Timeline, Divider, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { TimelineItem, Status } from "../../models/types";
import ScheduleItem from "../ScheduleItem/ScheduleItem";
import styles from "./ScheduleList.module.css";

type Props = {
  items: TimelineItem[];
  onEdit?: (item: TimelineItem) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (itemId: string, newStatus: Status) => void;
};

const { Text } = Typography;

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

const ScheduleList: React.FC<Props> = ({
  items,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const nowItemRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledId = useRef<string | null>(null);
  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }, [items]);

  useEffect(() => {
    const current = sortedItems.find((item) => {
      const start = new Date(item.start_time).getTime();
      const end = new Date(item.end_time).getTime();
      return start <= now && now <= end;
    });

    if (current && lastScrolledId.current !== current.timeline_item_id) {
      const el = itemRefs.current[current.timeline_item_id];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        lastScrolledId.current = current.timeline_item_id;
      }
    }
    if (!current) lastScrolledId.current = null;
  }, [now, sortedItems]);

  const timelineItems = sortedItems.map((item) => {
    const start = new Date(item.start_time).getTime();
    const end = new Date(item.end_time).getTime();
    const isNow = start <= now && now <= end;

    const icon = isNow ? (
      <span className={styles.iconClock}>
        <ClockCircleOutlined />
      </span>
    ) : undefined;
    const color = isNow ? "red" : (typeColors[item.type] ?? undefined);

    const formattedLabel = new Date(item.start_time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      key: item.timeline_item_id,
      content: (
        <div
          ref={(el) => {
            itemRefs.current[item.timeline_item_id] = el;
          }}
        >
          <ScheduleItem
            item={item}
            expanded={expandedId === item.timeline_item_id}
            onToggle={toggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            isNow={isNow}
            timeLabel={formattedLabel}
          />
        </div>
      ),
      color,
      icon,
    } as any;
  });

  // Insert NOW indicator at the correct position
  const nowTime = new Date();
  const nowItemIndex = sortedItems.findIndex((item, index) => {
    const itemStart = new Date(item.start_time).getTime();
    const itemEnd = new Date(item.end_time).getTime();
    const currentTime = nowTime.getTime();

    // If current time is within this item
    if (currentTime >= itemStart && currentTime <= itemEnd) {
      return true;
    }

    // If current time is between this item and the next
    if (index < sortedItems.length - 1) {
      const nextItemStart = new Date(
        sortedItems[index + 1].start_time,
      ).getTime();
      if (currentTime > itemEnd && currentTime < nextItemStart) {
        return true;
      }
    }

    return false;
  });

  // Only show NOW indicator if current time is within the timeline range
  if (
    nowItemIndex !== -1 ||
    (sortedItems.length > 0 &&
      nowTime.getTime() < new Date(sortedItems[0].start_time).getTime())
  ) {
    const insertIndex = nowItemIndex === -1 ? 0 : nowItemIndex + 1;
    const currentTimeFormatted = nowTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    timelineItems.splice(insertIndex, 0, {
      key: "now-indicator",
      dot: (
        <div className={styles.nowDot}>
          <ClockCircleOutlined style={{ fontSize: 16, color: "#ff4d4f" }} />
        </div>
      ),
      color: "red",
      content: (
        <div ref={nowItemRef} className={styles.nowIndicator}>
          <div className={styles.nowLabel}>
            <strong>{t("common.now")}</strong>
            <span className={styles.nowTime}>{currentTimeFormatted}</span>
          </div>
        </div>
      ),
    });
  }

  // Expose the nowItemRef to parent via a data attribute for scrolling
  useEffect(() => {
    if (nowItemRef.current) {
      (window as any).__timelineNowRef = nowItemRef;
    }
  }, [nowItemRef.current]);

  return (
    <Timeline
      mode="start"
      items={timelineItems}
      className={styles.timelineWrap}
    />
  );
};

export default ScheduleList;
