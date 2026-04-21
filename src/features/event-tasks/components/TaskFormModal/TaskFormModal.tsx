import React from "react";
import {
  Avatar,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
} from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import { formatInputNumber } from "@/shared/utils/formatters.utils";
import { TEAM_MEMBERS } from "../../constants/task.constants";
import type { TaskFormModalProps } from "../../models/taskComponent.models";
import { getInitials } from "../../utils/task.utils";
import styles from "./TaskFormModal.module.css";

const { TextArea } = Input;

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  task,
  categories,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = Boolean(task);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const category = categories.find((item) => item.id === values.category_id);
      const assigneeIds: string[] = values.assignee_ids ?? [];
      const assignees = assigneeIds.map((userId: string) => {
        const member = TEAM_MEMBERS.find((item) => item.user_id === userId);

        return {
          assignment_id: `assign-${Date.now()}-${userId}`,
          user_id: userId,
          user_name: member?.user_name ?? "Unknown",
          user_email: member?.user_email ?? "",
          user_avatar: member?.user_avatar ?? "",
          role: "assignee" as const,
          status: "pending" as const,
          assigned_at: new Date().toISOString(),
        };
      });

      onSubmit({
        ...values,
        due_date: values.due_date?.toISOString(),
        start_date: values.start_date?.toISOString(),
        category_name: category?.name,
        category_color: category?.color,
        assignees,
      });
      form.resetFields();
    } catch {
      // validation error – form shows inline messages
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? t("tasks.form.editTitle") : t("tasks.form.createTitle")}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText={isEdit ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          task
            ? {
                ...task,
                due_date: dayjs(task.due_date),
                start_date: task.start_date
                  ? dayjs(task.start_date)
                  : undefined,
                category_id: task.category_id,
                assignee_ids: task.assignees.map((assignee) => assignee.user_id),
              }
            : {
                priority: "medium",
                status: "pending",
                visibility: "shared",
                is_milestone: false,
              }
        }
      >
        <Form.Item
          name="title"
          label={t("tasks.form.title")}
          rules={[{ required: true, message: t("tasks.form.titleRequired") }]}
        >
          <Input
            maxLength={255}
            placeholder={t("tasks.form.titlePlaceholder")}
          />
        </Form.Item>

        <Form.Item name="description" label={t("common.description")}>
          <TextArea
            rows={3}
            placeholder={t("tasks.form.descriptionPlaceholder")}
          />
        </Form.Item>

        <Space className={styles.fullWidth} size="middle" wrap>
          <Form.Item
            name="due_date"
            label={t("tasks.form.dueDate")}
            rules={[
              { required: true, message: t("tasks.form.dueDateRequired") },
            ]}
            className={styles.formField}
          >
            <DatePicker className={styles.fullWidthField} />
          </Form.Item>

          <Form.Item
            name="start_date"
            label={t("tasks.form.startDate")}
            className={styles.formField}
          >
            <DatePicker className={styles.fullWidthField} />
          </Form.Item>

          <Form.Item
            name="estimated_hours"
            label={t("tasks.form.estimatedHours")}
            className={styles.formField}
          >
            <InputNumber
              min={0}
              step={0.5}
              className={styles.fullWidthField}
            />
          </Form.Item>
        </Space>

        <Space className={styles.fullWidth} size="middle" wrap>
          <Form.Item
            name="priority"
            label={t("tasks.priority.label")}
            className={styles.fieldMin140}
          >
            <Select
              options={[
                { value: "low", label: t("tasks.priority.low") },
                { value: "medium", label: t("tasks.priority.medium") },
                { value: "high", label: t("tasks.priority.high") },
                { value: "urgent", label: t("tasks.priority.urgent") },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label={t("common.status")}
            className={styles.fieldMin160}
          >
            <Select
              options={[
                { value: "pending", label: t("tasks.status.pending") },
                { value: "in_progress", label: t("tasks.status.in_progress") },
                { value: "completed", label: t("tasks.status.completed") },
                { value: "cancelled", label: t("tasks.status.cancelled") },
                { value: "on_hold", label: t("tasks.status.on_hold") },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="category_id"
            label={t("common.category")}
            className={styles.fieldMin180}
          >
            <Select
              placeholder={t("tasks.form.categoryPlaceholder")}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
          </Form.Item>
        </Space>

        <Space className={styles.fullWidth} size="middle" wrap>
          <Form.Item
            name="estimated_cost"
            label={t("tasks.form.estimatedCost")}
            className={styles.formField}
          >
            <InputNumber
              min={0}
              prefix="$"
              className={styles.fullWidthField}
              formatter={(value) => formatInputNumber(value)}
            />
          </Form.Item>

          <Form.Item
            name="actual_cost"
            label={t("tasks.form.actualCost")}
            className={styles.formField}
          >
            <InputNumber
              min={0}
              prefix="$"
              className={styles.fullWidthField}
              formatter={(value) => formatInputNumber(value)}
            />
          </Form.Item>
        </Space>

        <Form.Item name="assignee_ids" label={t("tasks.form.assignees")}>
          <Select
            mode="multiple"
            placeholder={t("tasks.form.assigneesPlaceholder")}
            allowClear
            optionFilterProp="label"
            options={TEAM_MEMBERS.map((member) => ({
              value: member.user_id,
              label: member.user_name,
            }))}
            optionRender={(option) => {
              const member = TEAM_MEMBERS.find(
                (item) => item.user_id === option.value,
              );

              return (
                <Space>
                  <Avatar size={20} className={styles.memberAvatar}>
                    {member ? getInitials(member.user_name) : "?"}
                  </Avatar>
                  <span>{member?.user_name}</span>
                  <Tag className={styles.memberRoleTag}>{member?.role}</Tag>
                </Space>
              );
            }}
          />
        </Form.Item>

        <Form.Item name="location" label={t("tasks.form.location")}>
          <Input placeholder={t("tasks.form.locationPlaceholder")} />
        </Form.Item>

        <Form.Item name="notes" label={t("tasks.form.notes")}>
          <TextArea rows={2} />
        </Form.Item>

        <Space size="middle" wrap>
          <Form.Item
            name="is_milestone"
            label={t("tasks.form.milestone")}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="visibility"
            label={t("tasks.form.visibility")}
            className={styles.fieldMin120}
          >
            <Select
              options={[
                { value: "private", label: t("tasks.visibility.private") },
                { value: "shared", label: t("tasks.visibility.shared") },
                { value: "public", label: t("tasks.visibility.public") },
              ]}
            />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default TaskFormModal;
