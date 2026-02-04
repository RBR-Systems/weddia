"use client";
import React from "react";
import { Modal, Form, Input, Select, DatePicker } from "antd";
import type { Status, TimelineItem } from "../../models/types";
import dayjs from "dayjs";
import { suggestSetupTime, calculateSetupTime } from "../../utils/helpers";

const { RangePicker } = DatePicker;

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd?: (item: TimelineItem) => void;
  eventId: string;
  initialData?: Partial<TimelineItem> | null;
  onSave?: (item: TimelineItem) => void;
};

const TYPE_OPTIONS = [
  "ceremony",
  "reception",
  "photos",
  "vendor_setup",
  "vendor_breakdown",
  "entertainment",
  "meal_service",
  "speeches",
  "special_moment",
  "setup",
  "guest_activity",
];

export default function AddTimelineItemModal({
  visible,
  onClose,
  onAdd,
  eventId,
  initialData = null,
  onSave,
}: Props) {
  const [form] = Form.useForm();

  function createId() {
    try {
      // browser crypto if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (
        (globalThis as any).crypto?.randomUUID?.() ??
        `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      );
    } catch {
      return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }

  const handleFinish = (values: any) => {
    const [start, end] = values.timeRange || [];
    const baseItem: Partial<TimelineItem> = {
      title: values.title,
      type: values.type,
      location_name: values.location_name || null,
      location_address: values.location_address || null,
      description: values.description || null,
      notes: values.notes || null,
      guests_description: values.guests_description || null,
      start_time: start ? dayjs(start).toISOString() : new Date().toISOString(),
      end_time: end ? dayjs(end).toISOString() : new Date().toISOString(),
      setup_time: values.setup_time
        ? dayjs(values.setup_time).toISOString()
        : null,
    };

    if (initialData && initialData.timeline_item_id) {
      const updated: TimelineItem = {
        timeline_item_id: initialData.timeline_item_id,
        event_id: initialData.event_id || eventId,
        title: baseItem.title as string,
        type: baseItem.type as string,
        location_name: baseItem.location_name ?? null,
        location_address: baseItem.location_address ?? null,
        description: baseItem.description ?? null,
        notes: baseItem.notes ?? null,
        guests_description: baseItem.guests_description ?? null,
        start_time: baseItem.start_time as string,
        end_time: baseItem.end_time as string,
        setup_time: baseItem.setup_time ?? null,
        status: (initialData.status as Status) ?? ("pending" as Status),
        created_at: initialData.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onSave?.(updated);
      form.resetFields();
      onClose();
      return;
    }

    const newItem: TimelineItem = {
      timeline_item_id: createId(),
      event_id: eventId,
      title: baseItem.title as string,
      type: baseItem.type as string,
      location_name: baseItem.location_name ?? null,
      location_address: baseItem.location_address ?? null,
      description: baseItem.description ?? null,
      notes: baseItem.notes ?? null,
      guests_description: baseItem.guests_description ?? null,
      start_time: baseItem.start_time as string,
      end_time: baseItem.end_time as string,
      setup_time: baseItem.setup_time ?? null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onAdd?.(newItem);
    form.resetFields();
    onClose();
  };

  const handleValuesChange = (changed: any, all: any) => {
    // Auto-suggest setup_time when type changes and no setup_time provided
    if (Object.prototype.hasOwnProperty.call(changed, "type")) {
      const type = changed.type;
      const currentSetup = form.getFieldValue("setup_time");
      const timeRange = form.getFieldValue("timeRange");
      if (!currentSetup && timeRange && timeRange[0]) {
        const suggestedMinutes = suggestSetupTime(type);
        const iso = calculateSetupTime(
          dayjs(timeRange[0]).toISOString(),
          suggestedMinutes,
        );
        if (iso) form.setFieldValue("setup_time", dayjs(iso));
      }
    }
  };

  React.useEffect(() => {
    if (initialData && visible) {
      form.setFieldsValue({
        title: initialData.title,
        type: initialData.type,
        timeRange: initialData.start_time
          ? [dayjs(initialData.start_time), dayjs(initialData.end_time)]
          : undefined,
        setup_time: initialData.setup_time
          ? dayjs(initialData.setup_time)
          : undefined,
        location_name: initialData.location_name ?? undefined,
        location_address: initialData.location_address ?? undefined,
        description: initialData.description ?? undefined,
        notes: initialData.notes ?? undefined,
        guests_description: initialData.guests_description ?? undefined,
      });
    }
    if (!visible) {
      form.resetFields();
    }
  }, [initialData, visible, form]);

  return (
    <Modal
      title={initialData ? "Edit Timeline Item" : "Add Timeline Item"}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      destroyOnClose
      okText={initialData ? "Save" : "Add"}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Select options={TYPE_OPTIONS.map((t) => ({ label: t, value: t }))} />
        </Form.Item>

        <Form.Item
          name="timeRange"
          label="Start & End Time"
          rules={[{ required: true }]}
        >
          <RangePicker showTime format="YYYY-MM-DD HH:mm" />
        </Form.Item>

        <Form.Item
          name="setup_time"
          label="Setup Time (optional)"
          rules={[
            {
              validator: (_rule, value) => {
                const timeRange = form.getFieldValue("timeRange");
                if (!value) return Promise.resolve();
                if (!timeRange || !timeRange[0]) return Promise.resolve();
                const setup = dayjs(value);
                const start = dayjs(timeRange[0]);
                if (!setup.isValid() || !start.isValid())
                  return Promise.reject("Invalid time");
                if (!setup.isBefore(start))
                  return Promise.reject("Setup time must be before start time");
                const hoursBefore = start.diff(setup, "hour", true);
                if (hoursBefore > 12)
                  return Promise.reject(
                    "Setup time seems too early (more than 12 hours before). Please verify.",
                  );
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm" />
        </Form.Item>

        <Form.Item name="location_name" label="Location name">
          <Input />
        </Form.Item>

        <Form.Item name="location_address" label="Location address">
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="guests_description" label="Guests description">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
