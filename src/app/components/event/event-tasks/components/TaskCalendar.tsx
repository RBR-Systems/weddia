import React, { useState } from "react";
import {
  Calendar,
  Badge,
  Card,
  Typography,
  Tag,
  Space,
  Tooltip,
  Button,
  Empty,
  Avatar,
  Flex,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { Task, TaskCategory } from "../types/task.types";
import { getTasksForDate } from "../services/task.service";
import styles from "../EventTasks.module.css";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface TaskCalendarProps {
  tasks: Task[];
  categories: TaskCategory[];
  onTaskClick: (task: Task) => void;
  onQuickComplete: (task: Task) => void;
  onNewTask: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: "red",
  high: "orange",
  medium: "gold",
  low: "green",
};

const statusBadge: Record<string, "success" | "processing" | "error" | "default" | "warning"> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
  cancelled: "error",
  on_hold: "warning",
};

const avatarColors = [
  "#c9a38c", "#5b6bc1", "#5cb68a", "#d4a29a", "#F59E0B", "#8B5CF6",
];

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  categories,
  onTaskClick,
  onQuickComplete,
  onNewTask,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const selectedTasks = getTasksForDate(tasks, selectedDate.toDate());

  const dateCellRender = (date: Dayjs) => {
    const dayTasks = getTasksForDate(tasks, date.toDate());
    if (dayTasks.length === 0) return null;

    const overdue = dayTasks.filter(
      (tk) =>
        tk.status !== "completed" &&
        tk.status !== "cancelled" &&
        date.isBefore(dayjs(), "day")
    );
    const active = dayTasks.filter(
      (tk) => tk.status !== "completed" && tk.status !== "cancelled"
    );
    const done = dayTasks.filter((tk) => tk.status === "completed");

    return (
      <div className={styles.calendarCell}>
        {overdue.length > 0 && (
          <Badge status="error" text={`${overdue.length}`} className={styles.calendarBadge} />
        )}
        {active.length > 0 && overdue.length === 0 && (
          <Badge status="processing" text={`${active.length}`} className={styles.calendarBadge} />
        )}
        {done.length > 0 && active.length === 0 && overdue.length === 0 && (
          <Badge status="success" text={`${done.length}`} className={styles.calendarBadge} />
        )}
        {dayTasks.length > 1 && (
          <div className={styles.calendarDots}>
            {dayTasks.slice(0, 3).map((tk) => (
              <span
                key={tk.task_id}
                className={styles.calendarDot}
                style={{ backgroundColor: tk.category_color }}
              />
            ))}
            {dayTasks.length > 3 && (
              <Text type="secondary" style={{ fontSize: 10 }}>+{dayTasks.length - 3}</Text>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Space orientation="vertical" style={{ width: "100%" }} size="large">
      <div className={styles.taskListHeader}>
        <Title level={5} style={{ margin: 0 }}>
          {t("tasks.calendar.title")}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onNewTask}>
          {t("tasks.newTask")}
        </Button>
      </div>

      <div className={styles.calendarLayout}>
        <div className={styles.calendarMain}>
          <Card size="small">
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={(date) => setSelectedDate(date)}
              cellRender={(current, info) => {
                if (info.type === "date") return dateCellRender(current as Dayjs);
                return null;
              }}
            />
          </Card>
        </div>

        <div className={styles.calendarSidebar}>
          <Card
            title={
              <Space>
                <CalendarIcon />
                <span>{selectedDate.format("dddd, MMMM D")}</span>
              </Space>
            }
            size="small"
            extra={
              <Tag>{selectedTasks.length} {t("tasks.calendar.tasksLabel")}</Tag>
            }
          >
            {selectedTasks.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("tasks.calendar.noTasks")}
              >
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNewTask}>
                  {t("tasks.newTask")}
                </Button>
              </Empty>
            ) : (
              <Flex vertical>
                {selectedTasks.map((task) => {
                  const isOverdue =
                    task.status !== "completed" &&
                    task.status !== "cancelled" &&
                    dayjs(task.due_date).isBefore(dayjs(), "day");

                  return (
                    <Flex
                      key={task.task_id}
                      align="center"
                      justify="space-between"
                      onClick={() => onTaskClick(task)}
                      style={{ cursor: "pointer", padding: "8px 0" }}
                    >
                      <Flex align="flex-start" gap={8} style={{ flex: 1, minWidth: 0 }}>
                        <Badge status={statusBadge[task.status]} />
                        <Flex vertical>
                          <Space size={4}>
                            <span style={{ fontWeight: 500 }}>{task.title}</span>
                            <Tag color={priorityColors[task.priority]} style={{ margin: 0, fontSize: 11 }}>
                              {t(`tasks.priority.${task.priority}`)}
                            </Tag>
                            {isOverdue && (
                              <Tag color="red" style={{ margin: 0, fontSize: 11 }}>
                                <ExclamationCircleOutlined /> {t("tasks.groups.overdue")}
                              </Tag>
                            )}
                          </Space>
                          <Space size={4} wrap>
                            <Tag style={{ borderColor: task.category_color, color: task.category_color, margin: 0, fontSize: 11 }}>
                              {task.category_name}
                            </Tag>
                            {task.assignees.slice(0, 2).map((a, idx) => (
                              <Tooltip key={a.assignment_id} title={a.user_name}>
                                <Avatar size={20} style={{ backgroundColor: avatarColors[idx % avatarColors.length], fontSize: 10 }}>
                                  {a.user_name.split(" ").map((n) => n[0]).join("")}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </Space>
                        </Flex>
                      </Flex>
                      {task.status !== "completed" && (
                        <Tooltip title={t("tasks.card.markComplete")}>
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckCircleOutlined style={{ color: "#22C55E" }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickComplete(task);
                            }}
                          />
                        </Tooltip>
                      )}
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Card>
        </div>
      </div>
    </Space>
  );
};

function CalendarIcon() {
  return <ClockCircleOutlined style={{ color: "#c9a38c" }} />;
}

export default TaskCalendar;
