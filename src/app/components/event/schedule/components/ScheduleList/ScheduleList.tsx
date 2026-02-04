"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  // When false, disable the initial auto-scroll (used to prevent scrolling after remounts)
  allowAutoScroll?: boolean;
  // Callback to notify parent that auto-scroll happened
  onAutoScrolled?: () => void;
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
  allowAutoScroll = true,
  onAutoScrolled,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastScrolledId = useRef<string | null>(null);
  const hasAutoScrolledRef = useRef(false);
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

    // Auto-scroll only once on initial mount (do not re-scroll after filters/updates)
    if (
      current &&
      allowAutoScroll &&
      !hasAutoScrolledRef.current &&
      lastScrolledId.current !== current.timeline_item_id
    ) {
      const el = itemRefs.current[current.timeline_item_id];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        lastScrolledId.current = current.timeline_item_id;
        hasAutoScrolledRef.current = true;
        onAutoScrolled?.();
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
      children: (
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

  return (
    <Timeline
      mode="end"
      items={timelineItems}
      className={styles.timelineWrap}
    />
  );
};

export default ScheduleList;
