"use client";

import React, { useMemo } from "react";
import { Dropdown, Button, Space, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import styles from "./nav-bar.module.css";
import type { EventCardProps } from "@/features/events-list/models/eventCardProps.models";

interface EventSelectorProps {
  selectedEvent: EventCardProps | null;
  allEvents: EventCardProps[];
  onMenuClick: MenuProps["onClick"];
  placeholder?: string;
}

const EventSelector: React.FC<EventSelectorProps> = ({
  selectedEvent,
  allEvents,
  onMenuClick,
  placeholder,
}) => {
  const items = useMemo(
    () => allEvents.map((item, index) => ({ label: item.eventName, key: index.toString() })),
    [allEvents],
  );

  return (
    <Dropdown menu={{ items, onClick: onMenuClick }}>
      <Button size="small" className={styles.eventBtn}>
        <Space size={4}>
          <span className={styles.eventName}>{selectedEvent?.eventName ?? placeholder}</span>
          <DownOutlined className={styles.downIcon} />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default React.memo(EventSelector);
