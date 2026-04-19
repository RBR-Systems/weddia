"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Form, Input, DatePicker } from "antd";
import { HeartOutlined, StarOutlined, CameraOutlined, ToolOutlined, PlayCircleOutlined, CoffeeOutlined, SoundOutlined, FireOutlined, SettingOutlined, TeamOutlined, ClockCircleOutlined, EnvironmentOutlined, FileTextOutlined } from "@ant-design/icons";
import type { Status, TimelineItem } from "../../models/schedule.models";
import dayjs from "dayjs";
import { suggestSetupTime, calculateSetupTime } from "../../utils/schedule.utils";
import styles from "./AddTimelineItemModal.module.css";

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
  { value: "ceremony",         icon: <HeartOutlined />,       labelKey: "schedule.types.ceremony"        },
  { value: "reception",        icon: <StarOutlined />,         labelKey: "schedule.types.reception"       },
  { value: "photos",           icon: <CameraOutlined />,       labelKey: "schedule.types.photos"          },
  { value: "entertainment",    icon: <PlayCircleOutlined />,   labelKey: "schedule.types.entertainment"   },
  { value: "meal_service",     icon: <CoffeeOutlined />,       labelKey: "schedule.types.mealService"     },
  { value: "speeches",         icon: <SoundOutlined />,        labelKey: "schedule.types.speeches"        },
  { value: "special_moment",   icon: <FireOutlined />,         labelKey: "schedule.types.specialMoment"   },
  { value: "vendor_setup",     icon: <ToolOutlined />,         labelKey: "schedule.types.vendorSetup"     },
  { value: "vendor_breakdown", icon: <ToolOutlined />,         labelKey: "schedule.types.vendorBreakdown" },
  { value: "setup",            icon: <SettingOutlined />,      labelKey: "schedule.types.setup"           },
  { value: "guest_activity",   icon: <TeamOutlined />,         labelKey: "schedule.types.guestActivity"   },
];

function TypeChipGroup({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.chipGrid}>
      {TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[styles.chip, value === opt.value ? styles.chipActive : ""].join(" ")}
          onClick={() => onChange?.(opt.value)}
        >
          {opt.icon}
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}
import { getRandomId } from '@/shared/utils/rng';

function createId() {
  // Delegate ID generation to shared utility which handles crypto/no-crypto fallbacks (without using Math.random).
  return getRandomId('id-');
}

export default function AddTimelineItemModal({
  visible,
  onClose,
  onAdd,
  eventId,
  initialData = null,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = Boolean(initialData?.timeline_item_id);

  React.useEffect(() => {
    if (initialData && visible) {
      form.setFieldsValue({
        title:             initialData.title,
        type:              initialData.type,
        timeRange:         initialData.start_time
          ? [dayjs(initialData.start_time), dayjs(initialData.end_time)]
          : undefined,
        setup_time:        initialData.setup_time ? dayjs(initialData.setup_time) : undefined,
        location_name:     initialData.location_name ?? undefined,
        location_address:  initialData.location_address ?? undefined,
        description:       initialData.description ?? undefined,
        notes:             initialData.notes ?? undefined,
        guests_description: initialData.guests_description ?? undefined,
      });
    }
    if (!visible) {
      form.resetFields();
    }
  }, [initialData, visible, form]);

  const handleValuesChange = (changed: Record<string, unknown>) => {
    if (Object.prototype.hasOwnProperty.call(changed, "type")) {
      const type = changed.type as string;
      const currentSetup = form.getFieldValue("setup_time");
      const timeRange = form.getFieldValue("timeRange");
      if (!currentSetup && timeRange && timeRange[0]) {
        const suggestedMinutes = suggestSetupTime(type);
        const iso = calculateSetupTime(dayjs(timeRange[0]).toISOString(), suggestedMinutes);
        if (iso) form.setFieldValue("setup_time", dayjs(iso));
      }
    }
  };

  const handleFinish = (values: Record<string, unknown>) => {
    const [start, end] = (values.timeRange as dayjs.Dayjs[]) || [];
    const base = {
      title:              values.title as string,
      type:               values.type as string,
      location_name:      (values.location_name as string) || null,
      location_address:   (values.location_address as string) || null,
      description:        (values.description as string) || null,
      notes:              (values.notes as string) || null,
      guests_description: (values.guests_description as string) || null,
      start_time:         start ? dayjs(start).format("YYYY-MM-DDTHH:mm:ss") : dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      end_time:           end   ? dayjs(end).format("YYYY-MM-DDTHH:mm:ss")   : dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      setup_time:         values.setup_time ? dayjs(values.setup_time as dayjs.Dayjs).format("YYYY-MM-DDTHH:mm:ss") : null,
    };

    if (isEditing) {
      onSave?.({
        ...base,
        timeline_item_id: initialData!.timeline_item_id!,
        event_id:         initialData!.event_id || eventId,
        status:           (initialData!.status as Status) ?? "pending",
        created_at:       initialData!.created_at ?? new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      });
    } else {
      onAdd?.({
        ...base,
        timeline_item_id: createId(),
        event_id:         eventId,
        status:           "pending",
        created_at:       new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      });
    }

    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isEditing ? t("schedule.addModal.editTitle") : t("schedule.addModal.addTitle")}
      open={visible}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={() => form.submit()}
      okText={isEditing ? t("common.save") : t("common.add")}
      cancelText={t("common.cancel")}
      width={560}
      forceRender
      destroyOnHidden={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        style={{ marginTop: 4 }}
      >
        {/* ── Hero: title ──────────��───────────────────────────────── */}
        <div className={styles.hero}>
          <Form.Item
            name="title"
            label={t("schedule.addModal.title")}
            rules={[{ required: true, message: t("schedule.addModal.title") }]}
          >
            <Input className={styles.heroInput} placeholder={t("schedule.addModal.title")} />
          </Form.Item>
        </div>

        {/* ── Type ────────────��────────────────────────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            <StarOutlined /> {t("schedule.addModal.type")}
          </p>
          <Form.Item
            name="type"
            noStyle
            rules={[{ required: true, message: t("schedule.addModal.type") }]}
          >
            <TypeChipGroup />
          </Form.Item>
        </div>

        {/* ── Schedule ─────────────────────────────────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            <ClockCircleOutlined /> {t("schedule.addModal.startEndTime")}
          </p>
          <Form.Item
            name="timeRange"
            rules={[{ required: true, message: t("schedule.addModal.startEndTime") }]}
            style={{ marginBottom: 12 }}
          >
            <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
          </Form.Item>

          <hr className={styles.sectionDivider} />

          <Form.Item
            name="setup_time"
            label={t("schedule.addModal.setupTime")}
            rules={[{
              validator: (_rule, value) => {
                if (!value) return Promise.resolve();
                const timeRange = form.getFieldValue("timeRange");
                if (!timeRange?.[0]) return Promise.resolve();
                const setup = dayjs(value);
                const start = dayjs(timeRange[0]);
                if (!setup.isValid() || !start.isValid()) return Promise.reject(t("schedule.addModal.invalidTime"));
                if (!setup.isBefore(start)) return Promise.reject(t("schedule.addModal.setupBeforeStart"));
                if (start.diff(setup, "hour", true) > 12) return Promise.reject(t("schedule.addModal.setupTooEarly"));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </div>

        {/* ── Location ───────────────────────────��─────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            <EnvironmentOutlined /> {t("schedule.addModal.locationName")}
          </p>
          <div className={styles.twoCol}>
            <Form.Item name="location_name" label={t("schedule.addModal.locationName")} style={{ marginBottom: 0 }}>
              <Input />
            </Form.Item>
            <Form.Item name="location_address" label={t("schedule.addModal.locationAddress")} style={{ marginBottom: 0 }}>
              <Input />
            </Form.Item>
          </div>
        </div>

        {/* ── Details ─────────────────────────���────────────────────── */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            <FileTextOutlined /> {t("schedule.addModal.description")}
          </p>
          <Form.Item name="description" label={t("schedule.addModal.description")} style={{ marginBottom: 12 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className={styles.twoCol}>
            <Form.Item name="notes" label={t("schedule.addModal.notes")} style={{ marginBottom: 0 }}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="guests_description" label={t("schedule.addModal.guestsDescription")} style={{ marginBottom: 0 }}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}

