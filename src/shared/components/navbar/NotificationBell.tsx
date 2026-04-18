"use client";
import React, { useMemo, useState, useCallback } from "react";
import { BellOutlined } from "@ant-design/icons";
import { Badge, Popover, Avatar, Button, Typography, Space, Flex } from "antd";
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

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const content = useMemo(
    () => (
      <div className={styles.popoverContent}>
        <Space orientation="vertical" className={styles.popoverFullWidth}>
          <div className={styles.popoverHeader}>
            <Typography.Text strong>Notifications</Typography.Text>
            <Button type="link" onClick={markAllRead} size="small">
              Mark all read
            </Button>
          </div>
          {notifications.length === 0 ? (
            <Typography.Text type="secondary">No notifications</Typography.Text>
          ) : (
            <Flex vertical>
              {notifications.map((item) => (
                <Flex
                  key={item.id}
                  align="flex-start"
                  gap={12}
                  onClick={() => markRead(item.id)}
                  className={`${styles.notificationItem} ${item.read ? '' : styles.unread}`}
                >
                  <Avatar icon={<BellOutlined />} />
                  <Flex vertical className={styles.notificationBody}>
                    <Flex justify="space-between">
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <Typography.Text type="secondary">
                        {item.time}
                      </Typography.Text>
                    </Flex>
                    {item.description && (
                      <Typography.Text type="secondary">
                        {item.description}
                      </Typography.Text>
                    )}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          )}
          <div className={styles.viewAll}>
            <Button type="link">View all</Button>
          </div>
        </Space>
      </div>
    ),
    [notifications, markAllRead, markRead],
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
