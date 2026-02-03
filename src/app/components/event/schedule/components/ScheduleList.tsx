"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Timeline, Divider, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { TimelineItem, Status } from "../models/types";
import ScheduleItem from "./ScheduleItem";

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
  useEffect(() => {
    // debug: ensure onDelete prop reaches this component
    // eslint-disable-next-line no-console
    console.log("ScheduleList onDelete set:", !!onDelete);
  }, [onDelete]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastScrolledId = useRef<string | null>(null);
  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  // Update every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Sort items by start_time
  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }, [items]);

  // Auto-scroll to the current event when `now` updates or items change
  useEffect(() => {
    const current = sortedItems.find((item) => {
      const start = new Date(item.start_time).getTime();
      const end = new Date(item.end_time).getTime();
      return start <= now && now <= end;
    });

    if (current && lastScrolledId.current !== current.timeline_item_id) {
      const el = itemRefs.current[current.timeline_item_id];
      if (el && typeof el.scrollIntoView === "function") {
        // Use smooth scroll and center the item in view
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        lastScrolledId.current = current.timeline_item_id;
      }
    }
    if (!current) lastScrolledId.current = null;
  }, [now, sortedItems]);

  // Build Ant Design Timeline `items` array (uses `content`, `color`, `icon`)
  const timelineItems = sortedItems.map((item) => {
    const start = new Date(item.start_time).getTime();
    const end = new Date(item.end_time).getTime();
    const isNow = start <= now && now <= end;

    // Use Ant Design Timeline's `icon` for the clock and `color` for colored dots
    const icon = isNow ? (
      <ClockCircleOutlined style={{ fontSize: "16px" }} />
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
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    />
  );
};

export default ScheduleList;
