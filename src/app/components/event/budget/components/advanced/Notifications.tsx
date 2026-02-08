"use client";
import React, { useState } from "react";
import {
  Card,
  List,
  Switch,
  Typography,
  Space,
  Tag,
  Badge,
  Button,
  Empty,
  Divider,
  Alert,
  Row,
  Col,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import notifStyles from "./Notifications.module.css";

const { Title, Text, Paragraph } = Typography;

type NotificationType = "warning" | "alert" | "reminder" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationSettings {
  budgetAlerts: boolean;
  paymentReminders: boolean;
  categoryWarnings: boolean;
  weeklyDigest: boolean;
  emailNotifications: boolean;
}

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; color: string }
> = {
  warning: { icon: <WarningOutlined />, color: "orange" },
  alert: { icon: <ExclamationCircleOutlined />, color: "red" },
  reminder: { icon: <ClockCircleOutlined />, color: "blue" },
  info: { icon: <BellOutlined />, color: "green" },
};

export default function NotificationsPanel() {
  const { state } = useBudget();

  // Generate notifications based on budget state
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const notifs: Notification[] = [];

    // Check for over-budget categories
    state.categories.forEach((cat: any) => {
      if (cat.spent > cat.allocated && cat.allocated > 0) {
        notifs.push({
          id: `over_${cat.id}`,
          type: "alert",
          title: "Category Over Budget",
          message: `${cat.name} has exceeded its budget by ${formatCurrency(cat.spent - cat.allocated, state.currency)}`,
          timestamp: dayjs().toISOString(),
          read: false,
        });
      } else if (cat.allocated > 0 && cat.spent / cat.allocated > 0.8) {
        notifs.push({
          id: `warn_${cat.id}`,
          type: "warning",
          title: "Category Approaching Limit",
          message: `${cat.name} is at ${Math.round((cat.spent / cat.allocated) * 100)}% of allocated budget`,
          timestamp: dayjs().toISOString(),
          read: false,
        });
      }
    });

    // Check for pending payments
    const pendingExpenses = state.expenses.filter(
      (e: any) => e.payment_status === "pending",
    );
    if (pendingExpenses.length > 0) {
      notifs.push({
        id: "pending_payments",
        type: "reminder",
        title: "Pending Payments",
        message: `You have ${pendingExpenses.length} payment(s) pending totaling ${formatCurrency(
          pendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0),
          state.currency,
        )}`,
        timestamp: dayjs().toISOString(),
        read: false,
      });
    }

    // Overall budget check
    const percentSpent = state.summary?.percentage_spent || 0;
    if (percentSpent > 90) {
      notifs.push({
        id: "budget_critical",
        type: "alert",
        title: "Budget Critical",
        message: `You've spent ${percentSpent}% of your total budget. Only ${formatCurrency(
          state.summary?.total_remaining || 0,
          state.currency,
        )} remaining.`,
        timestamp: dayjs().toISOString(),
        read: false,
      });
    } else if (percentSpent > 75) {
      notifs.push({
        id: "budget_warning",
        type: "warning",
        title: "Budget Alert",
        message: `You've spent ${percentSpent}% of your total budget.`,
        timestamp: dayjs().toISOString(),
        read: false,
      });
    }

    // Add some info notifications
    notifs.push({
      id: "welcome",
      type: "info",
      title: "Budget Tracking Active",
      message:
        "Your wedding budget is being tracked. Keep adding expenses to stay on top of your spending.",
      timestamp: dayjs().subtract(1, "day").toISOString(),
      read: true,
    });

    return notifs;
  });

  const [settings, setSettings] = useState<NotificationSettings>({
    budgetAlerts: true,
    paymentReminders: true,
    categoryWarnings: true,
    weeklyDigest: false,
    emailNotifications: false,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card
          title={
            <Space>
              <BellOutlined />
              Notifications
              {unreadCount > 0 && <Badge count={unreadCount} />}
            </Space>
          }
          extra={
            unreadCount > 0 && (
              <Button type="link" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )
          }
        >
          {notifications.length === 0 ? (
            <Empty description="No notifications" />
          ) : (
            <List
              dataSource={notifications}
              renderItem={(notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                return (
                  <List.Item
                    className={notification.read ? notifStyles.notificationItemRead : notifStyles.notificationItemUnread}
                    actions={[
                      !notification.read && (
                        <Button
                          key="read"
                          type="link"
                          size="small"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark read
                        </Button>
                      ),
                      <Button
                        key="delete"
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteNotification(notification.id)}
                      />,
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={
                        <span className={notifStyles.notificationIcon} style={{ color: config.color }}>
                          {config.icon}
                        </span>
                      }
                      title={
                        <Space>
                          <Text strong={!notification.read}>
                            {notification.title}
                          </Text>
                          <Tag color={config.color}>{notification.type}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text>{notification.message}</Text>
                            <Text type="secondary" className={notifStyles.notificationTimestamp}>
                            {dayjs(notification.timestamp).format(
                              "MMM D, h:mm A",
                            )}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title="Notification Settings">
            <Space direction="vertical" className={notifStyles.fullWidth} size="middle">
            <div className={notifStyles.settingRow}>
              <div>
                <Text strong>Budget Alerts</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  When overall budget exceeds limits
                </Text>
              </div>
              <Switch
                checked={settings.budgetAlerts}
                onChange={(v) => updateSetting("budgetAlerts", v)}
              />
            </div>

            <Divider className={notifStyles.settingDivider} />

            <div className={notifStyles.settingRow}>
              <div>
                <Text strong>Payment Reminders</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  Upcoming and overdue payments
                </Text>
              </div>
              <Switch
                checked={settings.paymentReminders}
                onChange={(v) => updateSetting("paymentReminders", v)}
              />
            </div>

            <Divider className={notifStyles.settingDivider} />

            <div className={notifStyles.settingRow}>
              <div>
                <Text strong>Category Warnings</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  When categories approach/exceed limits
                </Text>
              </div>
              <Switch
                checked={settings.categoryWarnings}
                onChange={(v) => updateSetting("categoryWarnings", v)}
              />
            </div>

            <Divider className={notifStyles.settingDivider} />

            <div className={notifStyles.settingRow}>
              <div>
                <Text strong>Weekly Digest</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  Summary of weekly spending
                </Text>
              </div>
              <Switch
                checked={settings.weeklyDigest}
                onChange={(v) => updateSetting("weeklyDigest", v)}
              />
            </div>

            <Divider className={notifStyles.settingDivider} />

            <div className={notifStyles.settingRow}>
              <div>
                <Text strong>Email Notifications</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  Receive alerts via email
                </Text>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onChange={(v) => updateSetting("emailNotifications", v)}
              />
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
