"use client";
import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, Timeline, Typography, Tag, Space, Select, DatePicker, Empty, Avatar, Input } from "antd";
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, DollarOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import { generateMockActivities } from "../../../utils/budget.utils";
import type { ActivityType, ActivityItem } from "../../../models/budget.models";
import activityStyles from "./ActivityLog.module.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

const ACTIVITY_CONFIG: Record<ActivityType, { icon: ReactNode; color: string }> = {
  expense_added: { icon: <PlusCircleOutlined />, color: "green" },
  expense_edited: { icon: <EditOutlined />, color: "blue" },
  expense_deleted: { icon: <DeleteOutlined />, color: "red" },
  payment_made: { icon: <CheckCircleOutlined />, color: "green" },
  category_updated: { icon: <EditOutlined />, color: "purple" },
  budget_updated: { icon: <DollarOutlined />, color: "gold" },
};

export default function ActivityLog() {
  const { state } = useBudget();
  const { t } = useTranslation();

  const activityTypeLabels = useMemo<Record<ActivityType, string>>(
    () => ({
      expense_added: t("activityLog.types.expenseAdded"),
      expense_edited: t("activityLog.types.expenseEdited"),
      expense_deleted: t("activityLog.types.expenseDeleted"),
      payment_made: t("activityLog.types.paymentMade"),
      category_updated: t("activityLog.types.categoryUpdated"),
      budget_updated: t("activityLog.types.budgetUpdated"),
    }),
    [t],
  );

  const [activities] = useState<ActivityItem[]>(generateMockActivities);
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesType = filterType === "all" || activity.type === filterType;
      const matchesSearch = activity.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDate =
        !dateRange ||
        (dayjs(activity.timestamp).isAfter(dateRange[0]) &&
          dayjs(activity.timestamp).isBefore(dateRange[1]));
      return matchesType && matchesSearch && matchesDate;
    });
  }, [activities, filterType, searchTerm, dateRange]);

  const formatTimestamp = (timestamp: string) => {
    const date = dayjs(timestamp);
    const now = dayjs();

    if (date.isSame(now, "day")) {
      return t("activityLog.todayAt", { time: date.format("h:mm A") });
    } else if (date.isSame(now.subtract(1, "day"), "day")) {
      return t("activityLog.yesterdayAt", { time: date.format("h:mm A") });
    } else if (date.isAfter(now.subtract(7, "day"))) {
      return date.format("dddd [at] h:mm A");
    } else {
      return date.format("MMM D, YYYY [at] h:mm A");
    }
  };

  return (
    <Card
      title={t("activityLog.title")}
      extra={
        <Space wrap>
          <Search
            placeholder={t("activityLog.searchPlaceholder")}
            allowClear
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={activityStyles.filterSearch}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            className={activityStyles.filterSelect}
            options={[
              { value: "all", label: t("activityLog.allActivities") },
              ...Object.entries(ACTIVITY_CONFIG).map(([key]) => ({
                value: key,
                label: activityTypeLabels[key as ActivityType],
              })),
            ]}
          />
          <RangePicker
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
          />
        </Space>
      }
    >
      {filteredActivities.length === 0 ? (
        <Empty description={t("activityLog.noActivity")} />
      ) : (
        <Timeline
          items={filteredActivities.map((activity) => {
            const config = ACTIVITY_CONFIG[activity.type];
            return {
              color: config.color,
              icon: config.icon,
              children: (
                <div>
                  <Space orientation="vertical" size={0}>
                    <Space>
                      <Tag color={config.color}>{activityTypeLabels[activity.type]}</Tag>
                      <Text>{activity.description}</Text>
                    </Space>
                    <Space className={activityStyles.activityMeta}>
                      {activity.amount && (
                        <Text type="secondary">
                          {formatCurrency(activity.amount, state.currency)}
                        </Text>
                      )}
                      {activity.user && (
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} />
                          <Text type="secondary">{activity.user}</Text>
                        </Space>
                      )}
                      <Text type="secondary" className={activityStyles.activityTimestamp}>
                        {formatTimestamp(activity.timestamp)}
                      </Text>
                    </Space>
                  </Space>
                </div>
              ),
            };
          })}
        />
      )}
    </Card>
  );
}


