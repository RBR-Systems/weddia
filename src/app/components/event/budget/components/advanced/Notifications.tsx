"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
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
  const { t } = useTranslation();

  // Generate notifications based on budget state
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const notifs: Notification[] = [];

    // Check for over-budget categories
    state.categories.forEach((cat: any) => {
      if (cat.spent > cat.allocated && cat.allocated > 0) {
        notifs.push({
          id: `over_${cat.id}`,
          type: "alert",
          title: t("notifications.categoryOverBudget"),
          message: t("notifications.categoryOverMsg", { name: cat.name, amount: formatCurrency(cat.spent - cat.allocated, state.currency) }),
          timestamp: dayjs().toISOString(),
          read: false,
        });
      } else if (cat.allocated > 0 && cat.spent / cat.allocated > 0.8) {
        notifs.push({
          id: `warn_${cat.id}`,
          type: "warning",
          title: t("notifications.categoryApproaching"),
          message: t("notifications.categoryApproachingMsg", { name: cat.name, percent: Math.round((cat.spent / cat.allocated) * 100) }),
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
        title: t("notifications.pendingPayments"),
        message: t("notifications.pendingPaymentsMsg", { count: pendingExpenses.length, amount: formatCurrency(
          pendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0),
          state.currency,
        ) }),
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
        title: t("notifications.budgetCritical"),
        message: t("notifications.budgetCriticalMsg", { percent: percentSpent, remaining: formatCurrency(
          state.summary?.total_remaining || 0,
          state.currency,
        ) }),
        timestamp: dayjs().toISOString(),
        read: false,
      });
    } else if (percentSpent > 75) {
      notifs.push({
        id: "budget_warning",
        type: "warning",
        title: t("notifications.budgetAlert"),
        message: t("notifications.budgetAlertMsg", { percent: percentSpent }),
        timestamp: dayjs().toISOString(),
        read: false,
      });
    }

    // Add some info notifications
    notifs.push({
      id: "welcome",
      type: "info",
      title: t("notifications.budgetTrackingActive"),
      message: t("notifications.budgetTrackingMsg"),
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
              {t("notifications.title")}
              {unreadCount > 0 && <Badge count={unreadCount} />}
            </Space>
          }
          extra={
            unreadCount > 0 && (
              <Button type="link" onClick={markAllAsRead}>
                {t("notifications.markAllRead")}
              </Button>
            )
          }
        >
          {notifications.length === 0 ? (
            <Empty description={t("notifications.noNotifications")} />
          ) : (
            <div>
              {notifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={notification.read ? notifStyles.notificationItemRead : notifStyles.notificationItemUnread}
                    style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color, #f0f0f0)" }}
                  >
                    <div style={{ display: "flex", gap: 12, flex: 1 }}>
                      <span className={notifStyles.notificationIcon} style={{ color: config.color, flexShrink: 0 }}>
                        {config.icon}
                      </span>
                      <div>
                        <Space>
                          <Text strong={!notification.read}>{notification.title}</Text>
                          <Tag color={config.color}>{notification.type}</Tag>
                        </Space>
                        <Space orientation="vertical" size={0} style={{ display: "flex", flexDirection: "column" }}>
                          <Text>{notification.message}</Text>
                          <Text type="secondary" className={notifStyles.notificationTimestamp}>
                            {dayjs(notification.timestamp).format("MMM D, h:mm A")}
                          </Text>
                        </Space>
                      </div>
                    </div>
                    <Space>
                      {!notification.read && (
                        <Button type="link" size="small" onClick={() => markAsRead(notification.id)}>
                          {t("notifications.markRead")}
                        </Button>
                      )}
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteNotification(notification.id)}
                      />
                    </Space>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title={t("notifications.settingsTitle")}>
            <Space orientation="vertical" className={notifStyles.fullWidth} size="middle">
            <div className={notifStyles.settingRow}>
              <div>
                <Text strong>{t("notifications.settings.budgetAlerts")}</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  {t("notifications.settings.budgetAlertsDesc")}
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
                <Text strong>{t("notifications.settings.paymentReminders")}</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  {t("notifications.settings.paymentRemindersDesc")}
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
                <Text strong>{t("notifications.settings.categoryWarnings")}</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  {t("notifications.settings.categoryWarningsDesc")}
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
                <Text strong>{t("notifications.settings.weeklyDigest")}</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  {t("notifications.settings.weeklyDigestDesc")}
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
                <Text strong>{t("notifications.settings.emailNotifications")}</Text>
                <br />
                <Text type="secondary" className={notifStyles.settingDescription}>
                  {t("notifications.settings.emailNotificationsDesc")}
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
