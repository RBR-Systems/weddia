import React from "react";
import {
  Avatar,
  Button,
  Divider,
  Modal,
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  PaperClipOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import {
  AVATAR_COLORS,
  PRIORITY_COLORS,
  PROGRESS_STROKE_COLOR,
  STATUS_COLORS,
} from "../../constants/task.constants";
import type { TaskDetailModalProps } from "../../models/taskComponent.models";
import { getInitials } from "../../utils/task.utils";
import styles from "./TaskDetailModal.module.css";

const { Paragraph, Text } = Typography;

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (!task) {
    return null;
  }

  const dueDate = dayjs(task.due_date);
  const daysUntil = dueDate.diff(dayjs(), "day");
  const isOverdue =
    daysUntil < 0 && task.status !== "completed" && task.status !== "cancelled";
  const completionPercent =
    task.subtasks_count > 0
      ? Math.round((task.subtasks_completed / task.subtasks_count) * 100)
      : task.completion_percentage;

  const avatarColorClasses = [
    styles.avatarColor0,
    styles.avatarColor1,
    styles.avatarColor2,
    styles.avatarColor3,
    styles.avatarColor4,
    styles.avatarColor5,
  ] as const;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={680}
      title={
        <div className={styles.modalTitle}>
          <span>{task.title}</span>
          <Tag color={PRIORITY_COLORS[task.priority]}>
            {t(`tasks.priority.${task.priority}`)}
          </Tag>
          {task.is_milestone && (
            <Tooltip title={t("tasks.card.milestone")}>
              <FlagOutlined className={styles.milestoneIcon} />
            </Tooltip>
          )}
        </div>
      }
      footer={
        <Space>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(task.task_id)}
          >
            {t("common.delete")}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => onEdit(task)}>
            {t("common.edit")}
          </Button>
          <Button type="primary" onClick={onClose}>
            {t("common.close")}
          </Button>
        </Space>
      }
    >
      <div className={styles.statusBar}>
        <Tag color={STATUS_COLORS[task.status] as string}>
          {t(`tasks.status.${task.status}`)}
        </Tag>
        <Tag color={task.category_color}>{task.category_name}</Tag>
        {isOverdue && (
          <Tag color="red">
            {t("tasks.card.overdueDays", { count: Math.abs(daysUntil) })}
          </Tag>
        )}
        {!isOverdue && daysUntil >= 0 && (
          <Tag color="blue">
            {daysUntil === 0
              ? t("tasks.card.dueToday")
              : t("tasks.card.dueDays", { count: daysUntil })}
          </Tag>
        )}
      </div>

      {task.description && (
        <div className={styles.detailSection}>
          <Paragraph>{task.description}</Paragraph>
        </div>
      )}

      {(task.subtasks_count > 0 || task.completion_percentage > 0) && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            {t("tasks.detail.progress")}
          </div>
          <Progress percent={completionPercent} strokeColor={PROGRESS_STROKE_COLOR} />
          {task.subtasks_count > 0 && (
            <Text type="secondary" className={styles.subtasksText}>
              {t("tasks.detail.subtasks", {
                completed: task.subtasks_completed,
                total: task.subtasks_count,
              })}
            </Text>
          )}
        </div>
      )}

      <Divider />

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>
          {t("tasks.detail.details")}
        </div>
        <div className={styles.detailGrid}>
          <div>
            <div className={styles.detailLabel}>
              <CalendarOutlined /> {t("tasks.detail.dueDate")}
            </div>
            <div className={styles.detailValue}>
              {dueDate.format("MMMM D, YYYY")}
            </div>
          </div>
          {task.start_date && (
            <div>
              <div className={styles.detailLabel}>
                <CalendarOutlined /> {t("tasks.detail.startDate")}
              </div>
              <div className={styles.detailValue}>
                {dayjs(task.start_date).format("MMMM D, YYYY")}
              </div>
            </div>
          )}
          <div>
            <div className={styles.detailLabel}>
              <ClockCircleOutlined /> {t("tasks.detail.estimatedHours")}
            </div>
            <div className={styles.detailValue}>
              {task.estimated_hours}h
              {task.actual_hours != null && ` / ${task.actual_hours}h`}
            </div>
          </div>
          <div>
            <div className={styles.detailLabel}>
              <DollarOutlined /> {t("tasks.detail.estimatedCost")}
            </div>
            <div className={styles.detailValue}>
              ${task.estimated_cost.toLocaleString()}
              {task.actual_cost != null &&
                ` / $${task.actual_cost.toLocaleString()}`}
            </div>
          </div>
          {task.location && (
            <div>
              <div className={styles.detailLabel}>
                <EnvironmentOutlined /> {t("tasks.detail.location")}
              </div>
              <div className={styles.detailValue}>{task.location}</div>
            </div>
          )}
          <div>
            <div className={styles.detailLabel}>
              {t("tasks.detail.visibility")}
            </div>
            <div className={styles.detailValue}>
              {t(`tasks.visibility.${task.visibility}`)}
            </div>
          </div>
        </div>
      </div>

      {task.tags.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>{t("tasks.detail.tags")}</div>
          <Space wrap>
            {task.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </div>
      )}

      {task.notes && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>{t("tasks.detail.notes")}</div>
          <Paragraph type="secondary">{task.notes}</Paragraph>
        </div>
      )}

      <Divider />

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>
          <UserOutlined /> {t("tasks.detail.assignedTo")} ({task.assignees.length})
        </div>
        {task.assignees.length > 0 ? (
          <div className={styles.assigneeList}>
            {task.assignees.map((assignee, index) => (
              <div key={assignee.assignment_id} className={styles.assigneeItem}>
                <Avatar
                  size={32}
                  className={`${styles.assigneeAvatar} ${avatarColorClasses[index % AVATAR_COLORS.length]}`}
                >
                  {getInitials(assignee.user_name)}
                </Avatar>
                <div className={styles.assigneeInfo}>
                  <div className={styles.assigneeName}>{assignee.user_name}</div>
                  <div className={styles.assigneeEmail}>{assignee.user_email}</div>
                </div>
                <Tag>{t(`tasks.roles.${assignee.role}`)}</Tag>
                <Tag
                  color={
                    assignee.status === "accepted"
                      ? "green"
                      : assignee.status === "completed"
                        ? "blue"
                        : assignee.status === "declined"
                          ? "red"
                          : "default"
                  }
                >
                  {t(`tasks.assigneeStatus.${assignee.status}`)}
                </Tag>
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">{t("tasks.detail.noAssignees")}</Text>
        )}
      </div>

      {task.attachments.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            <PaperClipOutlined /> {t("tasks.detail.attachments")} (
            {task.attachments.length})
          </div>
          <Space orientation="vertical">
            {task.attachments.map((attachment) => (
              <div key={attachment.file_id} className={styles.attachmentRow}>
                {attachment.name}{" "}
                <Text type="secondary">
                  ({(attachment.size / 1024).toFixed(0)} KB)
                </Text>
              </div>
            ))}
          </Space>
        </div>
      )}

      <Divider />

      <div className={styles.metadata}>
        {t("tasks.detail.createdAt", {
          date: dayjs(task.created_at).format("MMM D, YYYY HH:mm"),
        })}
        {"  "}
        {t("tasks.detail.updatedAt", {
          date: dayjs(task.updated_at).format("MMM D, YYYY HH:mm"),
        })}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
