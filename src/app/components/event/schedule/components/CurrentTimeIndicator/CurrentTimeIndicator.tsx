"use client";

import React, { useState, useEffect, forwardRef } from "react";
import styles from "./CurrentTimeIndicator.module.css";

type Props = {
  items: Array<{
    timeline_item_id: string;
    start_time: string;
    end_time: string;
  }>;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const CurrentTimeIndicator = forwardRef<HTMLDivElement, Props>(
  ({ items, containerRef }, ref) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [position, setPosition] = useState<number | null>(null);

    useEffect(() => {
      // Update every minute
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);

      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      calculatePosition();
    }, [currentTime, items, containerRef]);

    const calculatePosition = () => {
      if (!items || items.length === 0 || !containerRef.current) {
        setPosition(null);
        return;
      }

      const now = currentTime.getTime();
      const sortedItems = [...items].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );

      // Find all currently active items (where now is between start and end time)
      const activeItems = sortedItems.filter((item) => {
        const itemStart = new Date(item.start_time).getTime();
        const itemEnd = new Date(item.end_time).getTime();
        return now >= itemStart && now <= itemEnd;
      });

      if (activeItems.length === 0) {
        setPosition(null);
        return;
      }

      // Get DOM elements
      const container = containerRef.current;
      const timelineItems = container.querySelectorAll(".ant-timeline-item");

      if (timelineItems.length === 0) {
        setPosition(null);
        return;
      }

      // Find the indices of active items in the sorted array
      const activeIndices = activeItems.map((activeItem) =>
        sortedItems.findIndex(
          (item) => item.timeline_item_id === activeItem.timeline_item_id
        )
      );

      // Get the corresponding DOM elements
      const activeElements = activeIndices
        .map((idx) => timelineItems[idx] as HTMLElement)
        .filter((el) => el != null);

      if (activeElements.length === 0) {
        setPosition(null);
        return;
      }

      // Calculate the middle position of active elements
      if (activeElements.length === 1) {
        // Single active item: position in the middle of it
        const el = activeElements[0];
        const calculatedPosition = el.offsetTop + el.offsetHeight / 2;
        setPosition(calculatedPosition);
      } else {
        // Multiple active items: position between first and last
        const firstEl = activeElements[0];
        const lastEl = activeElements[activeElements.length - 1];
        const topPosition = firstEl.offsetTop;
        const bottomPosition = lastEl.offsetTop + lastEl.offsetHeight;
        const calculatedPosition = (topPosition + bottomPosition) / 2;
        setPosition(calculatedPosition);
      }
    };

    // Don't render if position is not calculated or invalid
    if (position === null) return null;

    const formattedTime = currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        ref={ref}
        className={styles.nowLine}
        style={{ top: `${position}px` }}
      >
        <div className={styles.nowLabel}>
          <span className={styles.nowText}>NOW</span>
          <span className={styles.nowTime}>{formattedTime}</span>
        </div>
        <div className={styles.nowDot} />
        <div className={styles.nowLineBar} />
      </div>
    );
  },
);

CurrentTimeIndicator.displayName = "CurrentTimeIndicator";

export default CurrentTimeIndicator;
