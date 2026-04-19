"use client";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, Timeline, Typography, Tag, Space, Select, DatePicker, Empty, Avatar, Input } from "antd";
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, DollarOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters.utils";
import activityStyles from "./ActivityLog.module.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

type ActivityType =
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "payment_made"
  | "category_updated"
  | "budget_updated";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  amount?: number;
  user?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  expense_added: {
    icon: <PlusCircleOutlined />,
    color: "green",
    label: "Expense Added",
  },
  expense_edited: {
    icon: <EditOutlined />,
    color: "blue",
    label: "Expense Edited",
  },
  expense_deleted: {
    icon: <DeleteOutlined />,
    color: "red",
    label: "Expense Deleted",
  },
  payment_made: {
    icon: <CheckCircleOutlined />,
    color: "green",
    label: "Payment Made",
  },
  category_updated: {
    icon: <EditOutlined />,
    color: "purple",
    label: "Category Updated",
  },
  budget_updated: {
    icon: <DollarOutlined />,
    color: "gold",
    label: "Budget Updated",
  },
};

// Simulated activity data - in real app, this would come from backend
const generateMockActivities = (): ActivityItem[] => {
  return [
    {
      id: "1",
      type: "expense_added",
      description: "Added expense: Venue Deposit",
      amount: 5000,
      user: "John Doe",
      timestamp: dayjs().subtract(1, "hour").toISOString(),
    },
    {
      id: "2",
      type: "payment_made",
      description: "Marked payment as paid: Photography Package",
      amount: 3500,
      user: "Jane Smith",
      timestamp: dayjs().subtract(3, "hours").toISOString(),
    },
    {
      id: "3",
      type: "category_updated",
      description: "Updated allocation for Catering & Bar",
      user: "John Doe",
      timestamp: dayjs().subtract(1, "day").toISOString(),
    },
    {
      id: "4",
      type: "expense_edited",
      description: "Modified expense: DJ Services",
      amount: 1200,
      user: "Jane Smith",
      timestamp: dayjs().subtract(2, "days").toISOString(),
    },
    {
      id: "5",
      type: "budget_updated",
      description: "Total budget increased from $45,000 to $50,000",
      user: "John Doe",
      timestamp: dayjs().subtract(3, "days").toISOString(),
    },
    {
      id: "6",
      type: "expense_deleted",
      description: "Removed expense: Initial Florist Quote",
      amount: 2000,
      user: "Jane Smith",
      timestamp: dayjs().subtract(5, "days").toISOString(),
    },
  ];
};

export default function ActivityLog() {
  const { state } = useBudget();
  const { t } = useTranslation();

  const activityTypeLabels: Record<ActivityType, string> = {
    expense_added: t("activityLog.types.expenseAdded"),
    expense_edited: t("activityLog.types.expenseEdited"),
    expense_deleted: t("activityLog.types.expenseDeleted"),
    payment_made: t("activityLog.types.paymentMade"),
    category_updated: t("activityLog.types.categoryUpdated"),
    budget_updated: t("activityLog.types.budgetUpdated"),
  };

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

  const getTimelineColor = (type: ActivityType) => {
    return ACTIVITY_CONFIG[type]?.color || "gray";
  };

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
            style={{ width: 200 }}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
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
              color: getTimelineColor(activity.type),
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


