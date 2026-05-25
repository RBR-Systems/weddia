"use client";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Switch, Typography, Space, Tag, Badge, Button, Empty, Divider, Row, Col } from "antd";
import { BellOutlined, ExclamationCircleOutlined, WarningOutlined, ClockCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useBudget } from "../../../contexts/BudgetContext";
import notifStyles from "./Notifications.module.css";
import type { BudgetNotification, NotificationSettings, NotificationType } from "../../../models/budget.models";
import { generateBudgetNotifications } from "../../../utils/budget.utils";

const { Text } = Typography;

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; color: string }
> = {
  warning: { icon: <WarningOutlined />, color: "orange" },
  alert: { icon: <ExclamationCircleOutlined />, color: "red" },
  reminder: { icon: <ClockCircleOutlined />, color: "blue" },
  info: { icon: <BellOutlined />, color: "green" },
};

type NotificationOverrides = Record<string, { hidden?: boolean; read?: boolean }>;

export default function NotificationsPanel() {
  const { state } = useBudget();
  const { t } = useTranslation();

  const generatedNotifications = useMemo(
    () =>
      generateBudgetNotifications(
        state.categories,
        state.expenses,
        state.summary,
        state.currency,
        t,
      ),
    [state.categories, state.expenses, state.summary, state.currency, t],
  );
  const [notificationOverrides, setNotificationOverrides] =
    useState<NotificationOverrides>({});
  const notifications = useMemo(
    () =>
      generatedNotifications
        .filter((notification) => !notificationOverrides[notification.id]?.hidden)
        .map((notification) => ({
          ...notification,
          read:
            notificationOverrides[notification.id]?.read ?? notification.read,
        })),
    [generatedNotifications, notificationOverrides],
  );

  const [settings, setSettings] = useState<NotificationSettings>({
    budgetAlerts: true,
    paymentReminders: true,
    categoryWarnings: true,
    weeklyDigest: false,
    emailNotifications: false,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotificationOverrides((prev) => ({
      ...prev,
      [notificationId]: { ...prev[notificationId], read: true },
    }));
  };

  const markAllAsRead = () => {
    setNotificationOverrides((prev) => {
      const next = { ...prev };
      notifications.forEach((notification: BudgetNotification) => {
        next[notification.id] = { ...next[notification.id], read: true };
      });
      return next;
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotificationOverrides((prev) => ({
      ...prev,
      [notificationId]: { ...prev[notificationId], hidden: true },
    }));
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
