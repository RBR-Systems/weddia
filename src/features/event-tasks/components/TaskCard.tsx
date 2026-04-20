import React from "react";
import { Card, Tag, Progress, Tooltip, Button, Avatar } from "antd";
import { CalendarOutlined, CheckCircleOutlined, FlagOutlined, PaperClipOutlined, MessageOutlined } from "@ant-design/icons";
import type { Task } from "../models/task.models";
import styles from "../EventTasks.module.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface TaskCardProps {
  readonly task: Task;
  readonly onClick: (task: Task) => void;
  readonly onQuickComplete: (task: Task) => void;
  readonly isOverdue?: boolean;
}

const priorityColors: Record<string, string> = {
  urgent: "red",
  high: "orange",
  medium: "gold",
  low: "green",
};

const statusColors: Record<string, string> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
  cancelled: "error",
  on_hold: "warning",
};

const avatarColors = [
  "#c9a38c",
  "#5b6bc1",
  "#5cb68a",
  "#d4a29a",
  "#F59E0B",
  "#8B5CF6",
];

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onQuickComplete,
  isOverdue,
}) => {
  const { t } = useTranslation();

  const dueDate = dayjs(task.due_date);
  const daysUntil = dueDate.diff(dayjs(), "day");

  const dueDateLabel = isOverdue
    ? t("tasks.card.overdueDays", { count: Math.abs(daysUntil) })
    : daysUntil === 0
      ? t("tasks.card.dueToday")
      : daysUntil <= 7
        ? t("tasks.card.dueDays", { count: daysUntil })
        : dueDate.format("MMM D, YYYY");

  return (
    <Card
      className={`${styles.taskCard} ${isOverdue ? styles.taskCardOverdue : ""}`}
      size="small"
      onClick={() => onClick(task)}
      hoverable
    >
      {/* Quick complete button */}
      {task.status !== "completed" && (
        <Tooltip title={t("tasks.card.markComplete")}>
          <Button
            className={styles.quickComplete}
            type="text"
            shape="circle"
            icon={<CheckCircleOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onQuickComplete(task);
            }}
          />
        </Tooltip>
      )}

      {/* Header: priority + status badges */}
      <div className={styles.taskCardHeader}>
        <span className={styles.taskTitle}>{task.title}</span>
        <Tag color={priorityColors[task.priority]}>
          {t(`tasks.priority.${task.priority}`)}
        </Tag>
      </div>

      {/* Description preview */}
      {task.description && (
        <div className={styles.taskDescription}>{task.description}</div>
      )}

      {/* Progress bar when has subtasks */}
      {(task.subtasks_count > 0 || task.completion_percentage > 0) && (
        <Progress
          percent={
            task.subtasks_count > 0
              ? Math.round(
                  (task.subtasks_completed / task.subtasks_count) * 100,
                )
              : task.completion_percentage
          }
          size="small"
          strokeColor="#c9a38c"
        />
      )}

      {/* Meta info */}
      <div className={styles.taskMeta}>
        <div className={styles.taskMetaLeft}>
          <CalendarOutlined />
          <span
            style={{
              color: isOverdue ? "#ef4444" : undefined,
              fontWeight: isOverdue ? 600 : undefined,
            }}
          >
            {dueDateLabel}
          </span>
          {task.is_milestone && (
            <Tooltip title={t("tasks.card.milestone")}>
              <FlagOutlined style={{ color: "#F59E0B" }} />
            </Tooltip>
          )}
          {task.attachments.length > 0 && (
            <span>
              <PaperClipOutlined /> {task.attachments.length}
            </span>
          )}
          {task.comments_count > 0 && (
            <span>
              <MessageOutlined /> {task.comments_count}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Tag
            color={statusColors[task.status] as string}
            style={{ margin: 0 }}
          >
            {t(`tasks.status.${task.status}`)}
          </Tag>
        </div>
      </div>

      {/* Assignees + category */}
      <div className={styles.taskMeta} style={{ marginTop: 6 }}>
        <div className={styles.assigneeAvatars}>
          {task.assignees.slice(0, 3).map((a, idx) => (
            <Tooltip key={a.assignment_id} title={a.user_name}>
              <Avatar
                size={24}
                style={{
                  backgroundColor: avatarColors[idx % avatarColors.length],
                  marginLeft: idx > 0 ? -4 : 0,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {a.user_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            </Tooltip>
          ))}
          {task.assignees.length > 3 && (
            <Avatar
              size={24}
              style={{
                backgroundColor: "#9CA3AF",
                marginLeft: -4,
                fontSize: 11,
              }}
            >
              +{task.assignees.length - 3}
            </Avatar>
          )}
        </div>

        <Tag
          style={{
            borderColor: task.category_color,
            color: task.category_color,
            margin: 0,
          }}
        >
          {task.category_name}
        </Tag>
      </div>
    </Card>
  );
};

export default TaskCard;

