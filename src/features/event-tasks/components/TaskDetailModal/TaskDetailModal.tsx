"use client";
import React, { useState } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  Divider,
  Input,
  Modal,
  Progress,
  Space,
  Spin,
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
  PlusOutlined,
  SendOutlined,
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
import { useSubtasks } from "../../hooks/useSubtasks";
import { useTaskComments } from "../../hooks/useTaskComments";
import styles from "./TaskDetailModal.module.css";

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

type TabKey = "detail" | "subtasks" | "comments";

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("detail");
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");

  const numericTaskId = task ? Number(task.task_id) : null;
  const { subtasks, isLoading: subtasksLoading, addSubtask, toggleSubtask, removeSubtask } = useSubtasks(
    activeTab === "subtasks" ? numericTaskId : null,
  );
  const { comments, isLoading: commentsLoading, postComment, removeComment } = useTaskComments(
    activeTab === "comments" ? numericTaskId : null,
  );

  if (!task) return null;

  const dueDate = dayjs(task.due_date);
  const daysUntil = dueDate.diff(dayjs(), "day");
  const isOverdue =
    daysUntil < 0 && task.status !== "completed" && task.status !== "cancelled";
  const completionPercent =
    subtasks.length > 0
      ? Math.round((subtasks.filter((s) => s.status === "completed").length / subtasks.length) * 100)
      : task.subtasks_count > 0
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

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await addSubtask(newSubtask);
    setNewSubtask("");
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    await postComment(newComment);
    setNewComment("");
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "detail", label: t("tasks.detailModal.tabDetail", "Detail") },
    { key: "subtasks", label: t("tasks.detailModal.tabSubtasks", "Subtasks") },
    { key: "comments", label: t("tasks.detailModal.tabComments", "Comments") },
  ];

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
          <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(task.task_id)}>
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

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Detail tab */}
      {activeTab === "detail" && (
        <>
          {task.description && (
            <div className={styles.detailSection}>
              <Paragraph>{task.description}</Paragraph>
            </div>
          )}

          {(task.subtasks_count > 0 || task.completion_percentage > 0) && (
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>{t("tasks.detail.progress")}</div>
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
            <div className={styles.detailSectionTitle}>{t("tasks.detail.details")}</div>
            <div className={styles.detailGrid}>
              <div>
                <div className={styles.detailLabel}><CalendarOutlined /> {t("tasks.detail.dueDate")}</div>
                <div className={styles.detailValue}>{dueDate.format("MMMM D, YYYY")}</div>
              </div>
              {task.start_date && (
                <div>
                  <div className={styles.detailLabel}><CalendarOutlined /> {t("tasks.detail.startDate")}</div>
                  <div className={styles.detailValue}>{dayjs(task.start_date).format("MMMM D, YYYY")}</div>
                </div>
              )}
              <div>
                <div className={styles.detailLabel}><ClockCircleOutlined /> {t("tasks.detail.estimatedHours")}</div>
                <div className={styles.detailValue}>
                  {task.estimated_hours}h
                  {task.actual_hours != null && ` / ${task.actual_hours}h`}
                </div>
              </div>
              <div>
                <div className={styles.detailLabel}><DollarOutlined /> {t("tasks.detail.estimatedCost")}</div>
                <div className={styles.detailValue}>
                  ${task.estimated_cost.toLocaleString()}
                  {task.actual_cost != null && ` / $${task.actual_cost.toLocaleString()}`}
                </div>
              </div>
              {task.location && (
                <div>
                  <div className={styles.detailLabel}><EnvironmentOutlined /> {t("tasks.detail.location")}</div>
                  <div className={styles.detailValue}>{task.location}</div>
                </div>
              )}
              <div>
                <div className={styles.detailLabel}>{t("tasks.detail.visibility")}</div>
                <div className={styles.detailValue}>{t(`tasks.visibility.${task.visibility}`)}</div>
              </div>
            </div>
          </div>

          {task.tags.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>{t("tasks.detail.tags")}</div>
              <Space wrap>
                {task.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
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
                    <Avatar size={32} className={`${styles.assigneeAvatar} ${avatarColorClasses[index % AVATAR_COLORS.length]}`}>
                      {getInitials(assignee.user_name)}
                    </Avatar>
                    <div className={styles.assigneeInfo}>
                      <div className={styles.assigneeName}>{assignee.user_name}</div>
                      <div className={styles.assigneeEmail}>{assignee.user_email}</div>
                    </div>
                    <Tag>{t(`tasks.roles.${assignee.role}`)}</Tag>
                    <Tag color={assignee.status === "accepted" ? "green" : assignee.status === "completed" ? "blue" : assignee.status === "declined" ? "red" : "default"}>
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
                <PaperClipOutlined /> {t("tasks.detail.attachments")} ({task.attachments.length})
              </div>
              <Space orientation="vertical">
                {task.attachments.map((attachment) => (
                  <div key={attachment.file_id} className={styles.attachmentRow}>
                    {attachment.name}{" "}
                    <Text type="secondary">({(attachment.size / 1024).toFixed(0)} KB)</Text>
                  </div>
                ))}
              </Space>
            </div>
          )}

          <Divider />

          <div className={styles.metadata}>
            {t("tasks.detail.createdAt", { date: dayjs(task.created_at).format("MMM D, YYYY HH:mm") })}
            {"  "}
            {t("tasks.detail.updatedAt", { date: dayjs(task.updated_at).format("MMM D, YYYY HH:mm") })}
          </div>
        </>
      )}

      {/* Subtasks tab */}
      {activeTab === "subtasks" && (
        <div className={styles.tabPanel}>
          {subtasks.length > 0 && (
            <div className={styles.detailSection}>
              <Progress
                percent={completionPercent}
                strokeColor={PROGRESS_STROKE_COLOR}
                size="small"
              />
              <Text type="secondary" className={styles.subtasksText}>
                {subtasks.filter((s) => s.status === "completed").length} / {subtasks.length}{" "}
                {t("tasks.detailModal.subtasksCompleted", "completed")}
              </Text>
            </div>
          )}

          {subtasksLoading ? (
            <div className={styles.spinWrap}><Spin /></div>
          ) : (
            <div className={styles.subtaskList}>
              {subtasks.length === 0 && (
                <Text type="secondary" className={styles.emptyHint}>
                  {t("tasks.subtasks.empty", "No subtasks yet.")}
                </Text>
              )}
              {subtasks.map((s) => (
                <div key={s.subtask_id} className={styles.subtaskRow}>
                  <Checkbox
                    checked={s.status === "completed"}
                    onChange={() => toggleSubtask(s)}
                  />
                  <span className={`${styles.subtaskTitle} ${s.status === "completed" ? styles.subtaskDone : ""}`}>
                    {s.title}
                  </span>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeSubtask(s.subtask_id)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className={styles.addRow}>
            <Input
              placeholder={t("tasks.subtasks.addPlaceholder", "New subtask...")}
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onPressEnter={handleAddSubtask}
            />
            <Button icon={<PlusOutlined />} onClick={handleAddSubtask}>
              {t("common.add", "Add")}
            </Button>
          </div>
        </div>
      )}

      {/* Comments tab */}
      {activeTab === "comments" && (
        <div className={styles.tabPanel}>
          {commentsLoading ? (
            <div className={styles.spinWrap}><Spin /></div>
          ) : (
            <div className={styles.commentList}>
              {comments.length === 0 && (
                <Text type="secondary" className={styles.emptyHint}>
                  {t("tasks.comments.empty", "No comments yet.")}
                </Text>
              )}
              {comments.map((c) => (
                <div key={c.comment_id} className={styles.commentItem}>
                  <div className={styles.commentMeta}>
                    <Text type="secondary" className={styles.commentDate}>
                      {dayjs(c.created_at).format("MMM D, YYYY HH:mm")}
                    </Text>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeComment(c.comment_id)}
                    />
                  </div>
                  <Paragraph className={styles.commentText}>{c.comment}</Paragraph>
                </div>
              ))}
            </div>
          )}

          <div className={styles.addRow}>
            <TextArea
              rows={2}
              placeholder={t("tasks.comments.addPlaceholder", "Write a comment...")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button icon={<SendOutlined />} type="primary" onClick={handlePostComment}>
              {t("tasks.comments.post", "Post")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
