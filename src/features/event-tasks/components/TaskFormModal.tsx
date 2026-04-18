import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Space,
  Tag,
  Avatar,
} from "antd";
import type { Task, TaskFormValues, TaskCategory } from "../models/task.models";
import { TEAM_MEMBERS } from "../api/taskApi";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { TextArea } = Input;

interface TaskFormModalProps {
  open: boolean;
  task?: Task | null;
  categories: TaskCategory[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  task,
  categories,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!task;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const cat = categories.find((c) => c.id === values.category_id);

      // Build assignees from selected IDs
      const assigneeIds: string[] = values.assignee_ids ?? [];
      const assignees = assigneeIds.map((uid: string) => {
        const member = TEAM_MEMBERS.find((m) => m.user_id === uid);
        return {
          assignment_id: `assign-${Date.now()}-${uid}`,
          user_id: uid,
          user_name: member?.user_name ?? "Unknown",
          user_email: member?.user_email ?? "",
          user_avatar: member?.user_avatar ?? "",
          role: "assignee" as const,
          status: "pending" as const,
          assigned_at: new Date().toISOString(),
        };
      });

      const formValues: TaskFormValues = {
        ...values,
        due_date: values.due_date?.toISOString(),
        start_date: values.start_date?.toISOString(),
        category_name: cat?.name,
        category_color: cat?.color,
        assignees,
      };
      onSubmit(formValues);
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
        {/* Basic Info */}
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

        {/* Scheduling */}
        <Space style={{ width: "100%" }} size="middle">
          <Form.Item
            name="due_date"
            label={t("tasks.form.dueDate")}
            rules={[
              { required: true, message: t("tasks.form.dueDateRequired") },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="start_date" label={t("tasks.form.startDate")}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="estimated_hours"
            label={t("tasks.form.estimatedHours")}
          >
            <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
          </Form.Item>
        </Space>

        {/* Classification */}
        <Space style={{ width: "100%" }} size="middle">
          <Form.Item
            name="priority"
            label={t("tasks.priority.label")}
            style={{ minWidth: 140 }}
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
            style={{ minWidth: 160 }}
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
            style={{ minWidth: 180 }}
          >
            <Select
              placeholder={t("tasks.form.categoryPlaceholder")}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Form.Item>
        </Space>

        {/* Financial */}
        <Space style={{ width: "100%" }} size="middle">
          <Form.Item
            name="estimated_cost"
            label={t("tasks.form.estimatedCost")}
          >
            <InputNumber
              min={0}
              prefix="$"
              style={{ width: "100%" }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>

          <Form.Item name="actual_cost" label={t("tasks.form.actualCost")}>
            <InputNumber
              min={0}
              prefix="$"
              style={{ width: "100%" }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>
        </Space>

        {/* Additional */}
        <Form.Item name="assignee_ids" label={t("tasks.form.assignees")}>
          <Select
            mode="multiple"
            placeholder={t("tasks.form.assigneesPlaceholder")}
            allowClear
            optionFilterProp="label"
            options={TEAM_MEMBERS.map((m) => ({
              value: m.user_id,
              label: m.user_name,
            }))}
            optionRender={(option) => {
              const member = TEAM_MEMBERS.find(
                (m) => m.user_id === option.value,
              );
              return (
                <Space>
                  <Avatar
                    size={20}
                    style={{ backgroundColor: "#c9a38c", fontSize: 10 }}
                  >
                    {member?.user_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("") ?? "?"}
                  </Avatar>
                  <span>{member?.user_name}</span>
                  <Tag style={{ fontSize: 10 }}>{member?.role}</Tag>
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

        <Space>
          <Form.Item
            name="is_milestone"
            label={t("tasks.form.milestone")}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name="visibility" label={t("tasks.form.visibility")}>
            <Select
              style={{ minWidth: 120 }}
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
