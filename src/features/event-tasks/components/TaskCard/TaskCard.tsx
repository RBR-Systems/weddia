import React from "react";
import {
  Avatar,
  Button,
  Card,
  Progress,
  Tag,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  FlagOutlined,
  MessageOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import {
  AVATAR_COLORS,
  OVERFLOW_AVATAR_COLOR,
  PRIORITY_COLORS,
  PROGRESS_STROKE_COLOR,
  STATUS_COLORS,
} from "../../constants/task.constants";
import type { TaskCardProps } from "../../models/taskComponent.models";
import { getInitials } from "../../utils/task.utils";
import styles from "./TaskCard.module.css";

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

  const avatarColorClasses = [
    styles.avatarColor0,
    styles.avatarColor1,
    styles.avatarColor2,
    styles.avatarColor3,
    styles.avatarColor4,
    styles.avatarColor5,
  ] as const;

  return (
    <Card
      className={`${styles.taskCard} ${isOverdue ? styles.taskCardOverdue : ""}`}
      size="small"
      onClick={() => onClick(task)}
      hoverable
    >
      {task.status !== "completed" && (
        <Tooltip title={t("tasks.card.markComplete")}>
          <Button
            className={styles.quickComplete}
            type="text"
            shape="circle"
            icon={<CheckCircleOutlined className={styles.completeIcon} />}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onQuickComplete(task);
            }}
          />
        </Tooltip>
      )}

      <div className={styles.taskCardHeader}>
        <span className={styles.taskTitle}>{task.title}</span>
        <Tag color={PRIORITY_COLORS[task.priority]}>
          {t(`tasks.priority.${task.priority}`)}
        </Tag>
      </div>

      {task.description && (
        <div className={styles.taskDescription}>{task.description}</div>
      )}

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
          strokeColor={PROGRESS_STROKE_COLOR}
        />
      )}

      <div className={styles.taskMeta}>
        <div className={styles.taskMetaLeft}>
          <CalendarOutlined />
          <span className={isOverdue ? styles.overdueDate : undefined}>
            {dueDateLabel}
          </span>
          {task.is_milestone && (
            <Tooltip title={t("tasks.card.milestone")}>
              <FlagOutlined className={styles.milestoneIcon} />
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

        <div className={styles.taskMetaRight}>
          <Tag
            color={STATUS_COLORS[task.status] as string}
            className={styles.zeroMarginTag}
          >
            {t(`tasks.status.${task.status}`)}
          </Tag>
        </div>
      </div>

      <div className={`${styles.taskMeta} ${styles.taskMetaSpaced}`}>
        <div className={styles.assigneeAvatars}>
          {task.assignees.slice(0, 3).map((assignee, index) => (
            <Tooltip key={assignee.assignment_id} title={assignee.user_name}>
              <Avatar
                size={24}
                className={`${styles.assigneeAvatar} ${index > 0 ? styles.assigneeAvatarStacked : ""} ${avatarColorClasses[index % AVATAR_COLORS.length]}`}
              >
                {getInitials(assignee.user_name)}
              </Avatar>
            </Tooltip>
          ))}
          {task.assignees.length > 3 && (
            <Avatar
              size={24}
              className={`${styles.assigneeAvatar} ${styles.assigneeAvatarStacked} ${styles.overflowAvatar}`}
            >
              +{task.assignees.length - 3}
            </Avatar>
          )}
        </div>

        <Tag
          color={task.category_color || OVERFLOW_AVATAR_COLOR}
          className={styles.zeroMarginTag}
        >
          {task.category_name}
        </Tag>
      </div>
    </Card>
  );
};

export default TaskCard;
