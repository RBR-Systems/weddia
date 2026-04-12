"use client";
import React, { useMemo, useState } from "react";
import { BellOutlined } from "@ant-design/icons";
import { Badge, Popover, List, Avatar, Button, Typography, Space } from "antd";
import styles from "./nav-bar.module.css";

type Notification = {
  id: string;
  title: string;
  description?: string;
  time?: string;
  read?: boolean;
};

const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "New RSVP received",
    description: "Alex confirmed attendance for Ceremony",
    time: "2h",
    read: false,
  },
  {
    id: "2",
    title: "Budget item updated",
    description: "Venue deposit status changed",
    time: "1d",
    read: true,
  },
  {
    id: "3",
    title: "Task overdue",
    description: "Send invitations - 3 days overdue",
    time: "3d",
    read: false,
  },
];

export default function NotificationBell() {
  const [notifications, setNotifications] =
    useState<Notification[]>(sampleNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const content = (
    <div style={{ width: 320 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Typography.Text strong>Notifications</Typography.Text>
          <Button type="link" onClick={markAllRead} size="small">
            Mark all read
          </Button>
        </div>
        <List
          dataSource={notifications}
          locale={{ emptyText: "No notifications" }}
          renderItem={(item) => (
            <List.Item
              onClick={() => markRead(item.id)}
              style={{
                cursor: "pointer",
                background: item.read ? "transparent" : "var(--ant-bg-base)",
              }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<BellOutlined />} />}
                title={
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{item.title}</span>
                    <Typography.Text type="secondary">
                      {item.time}
                    </Typography.Text>
                  </div>
                }
                description={item.description}
              />
            </List.Item>
          )}
        />
        <div style={{ textAlign: "center" }}>
          <Button type="link">View all</Button>
        </div>
      </Space>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Badge
        count={unreadCount}
        size="small"
        className={styles["badge-background"]}
      >
        <Button
          type="text"
          size="large"
          aria-label="Notifications"
          icon={<BellOutlined />}
        />
      </Badge>
    </Popover>
  );
}
