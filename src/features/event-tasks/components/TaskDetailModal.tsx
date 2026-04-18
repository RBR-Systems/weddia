import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Progress,
  Avatar,
  Tooltip,
  Typography,
  Divider,
  Space,
  Button,
  Empty,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FlagOutlined,
  EnvironmentOutlined,
  PaperClipOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { Task } from "../models/task.models";
import styles from "../EventTasks.module.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
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

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { t } = useTranslation();

  if (!task) return null;

  const dueDate = dayjs(task.due_date);
  const daysUntil = dueDate.diff(dayjs(), "day");
  const isOverdue =
    daysUntil < 0 && task.status !== "completed" && task.status !== "cancelled";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={680}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{task.title}</span>
          <Tag color={priorityColors[task.priority]}>
            {t(`tasks.priority.${task.priority}`)}
          </Tag>
          {task.is_milestone && (
            <Tooltip title={t("tasks.card.milestone")}>
              <FlagOutlined style={{ color: "#F59E0B" }} />
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
      {/* Status bar */}
      <div
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <Tag color={statusColors[task.status] as string}>
          {t(`tasks.status.${task.status}`)}
        </Tag>
        <Tag
          style={{
            borderColor: task.category_color,
            color: task.category_color,
          }}
        >
          {task.category_name}
        </Tag>
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

      {/* Description */}
      {task.description && (
        <div className={styles.detailSection}>
          <Paragraph>{task.description}</Paragraph>
        </div>
      )}

      {/* Progress */}
      {(task.subtasks_count > 0 || task.completion_percentage > 0) && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            {t("tasks.detail.progress")}
          </div>
          <Progress
            percent={
              task.subtasks_count > 0
                ? Math.round(
                    (task.subtasks_completed / task.subtasks_count) * 100,
                  )
                : task.completion_percentage
            }
            strokeColor="#c9a38c"
          />
          {task.subtasks_count > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t("tasks.detail.subtasks", {
                completed: task.subtasks_completed,
                total: task.subtasks_count,
              })}
            </Text>
          )}
        </div>
      )}

      <Divider />

      {/* Details grid */}
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

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            {t("tasks.detail.tags")}
          </div>
          <Space wrap>
            {task.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            {t("tasks.detail.notes")}
          </div>
          <Paragraph type="secondary">{task.notes}</Paragraph>
        </div>
      )}

      <Divider />

      {/* Assignees */}
      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>
          <UserOutlined /> {t("tasks.detail.assignedTo")} (
          {task.assignees.length})
        </div>
        {task.assignees.length > 0 ? (
          <div className={styles.assigneeList}>
            {task.assignees.map((a, idx) => (
              <div key={a.assignment_id} className={styles.assigneeItem}>
                <Avatar
                  size={32}
                  style={{
                    backgroundColor: avatarColors[idx % avatarColors.length],
                  }}
                >
                  {a.user_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Avatar>
                <div className={styles.assigneeInfo}>
                  <div className={styles.assigneeName}>{a.user_name}</div>
                  <div className={styles.assigneeEmail}>{a.user_email}</div>
                </div>
                <Tag>{t(`tasks.roles.${a.role}`)}</Tag>
                <Tag
                  color={
                    a.status === "accepted"
                      ? "green"
                      : a.status === "completed"
                        ? "blue"
                        : a.status === "declined"
                          ? "red"
                          : "default"
                  }
                >
                  {t(`tasks.assigneeStatus.${a.status}`)}
                </Tag>
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">{t("tasks.detail.noAssignees")}</Text>
        )}
      </div>

      {/* Attachments */}
      {task.attachments.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            <PaperClipOutlined /> {t("tasks.detail.attachments")} (
            {task.attachments.length})
          </div>
          <Space orientation="vertical">
            {task.attachments.map((a) => (
              <div key={a.file_id} style={{ fontSize: 13 }}>
                📎 {a.name}{" "}
                <Text type="secondary">({(a.size / 1024).toFixed(0)} KB)</Text>
              </div>
            ))}
          </Space>
        </div>
      )}

      {/* Metadata */}
      <Divider />
      <div style={{ fontSize: 12, opacity: 0.5 }}>
        {t("tasks.detail.createdAt", {
          date: dayjs(task.created_at).format("MMM D, YYYY HH:mm"),
        })}
        {" · "}
        {t("tasks.detail.updatedAt", {
          date: dayjs(task.updated_at).format("MMM D, YYYY HH:mm"),
        })}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
