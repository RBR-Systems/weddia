"use client";
import React from "react";
import { Modal, Radio, InputNumber, Select, Button } from "antd";
import { ClockCircleOutlined, ThunderboltOutlined, CheckCircleOutlined, RightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TimelineItem } from "../../models/schedule.models";
import { formatTime } from "../../utils/schedule.utils";
import { calculateNewTime } from "../../hooks/useSchedule";
import pageStyles from "../../schedule-page.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  direction: "behind" | "ahead" | "on-time";
  setDirection: (v: "behind" | "ahead" | "on-time") => void;
  adjustmentMinutes: number | null;
  setAdjustmentMinutes: (v: number | null) => void;
  applyFrom: string;
  setApplyFrom: (v: string) => void;
  isApplying: boolean;
  items: TimelineItem[];
  getAffectedItems: (applyFrom: string) => TimelineItem[];
  onApply: () => void;
}

const AdjustTimelineModal: React.FC<Props> = ({
  open, onClose, direction, setDirection,
  adjustmentMinutes, setAdjustmentMinutes,
  applyFrom, setApplyFrom, isApplying,
  items, getAffectedItems, onApply,
}) => {
  const { t } = useTranslation();
  const affectedItems = getAffectedItems(applyFrom);

  return (
    <Modal
      open={open}
      title={t("schedule.adjustModal.title")}
      onCancel={onClose}
      footer={null}
    >
      <div className={pageStyles.modalSection}>
        <div className={pageStyles.modalSectionLabel}>{t("schedule.adjustModal.timelineRunning")}</div>
        <Radio.Group value={direction} onChange={(e) => setDirection(e.target.value)}>
          <Radio value="behind">
            <ClockCircleOutlined className={pageStyles.radioIconMargin} />
            {t("schedule.adjustModal.behind")}
          </Radio>
          <Radio value="ahead" className={pageStyles.radioSpacing}>
            <ThunderboltOutlined className={pageStyles.radioIconMargin} />
            {t("schedule.adjustModal.ahead")}
          </Radio>
          <Radio value="on-time" className={pageStyles.radioSpacing}>
            <CheckCircleOutlined className={pageStyles.radioIconMargin} />
            {t("schedule.adjustModal.onTime")}
          </Radio>
        </Radio.Group>
      </div>

      <div className={pageStyles.modalSection}>
        <div className={pageStyles.modalSectionLabel}>{t("schedule.adjustModal.adjustByMinutes")}</div>
        <InputNumber
          min={0}
          max={180}
          step={5}
          value={adjustmentMinutes ?? undefined}
          onChange={(v) => setAdjustmentMinutes(v as number)}
        />
        <div className={pageStyles.quickMinuteWrap}>
          {[5, 10, 15, 20, 30, 45, 60].map((m) => (
            <Button key={m} size="small" className={pageStyles.quickMinuteBtn} onClick={() => setAdjustmentMinutes(m)}>
              {t("schedule.adjustModal.minuteShort", { count: m })}
            </Button>
          ))}
        </div>
      </div>

      <div className={pageStyles.modalSection}>
        <div className={pageStyles.modalSectionLabel}>{t("schedule.adjustModal.applyTo")}</div>
        <Select value={applyFrom} onChange={setApplyFrom} className={pageStyles.fullWidth}>
          <Select.Option value="all-remaining">{t("schedule.adjustModal.allRemaining")}</Select.Option>
          <Select.Option value="current">{t("schedule.adjustModal.fromCurrent")}</Select.Option>
          <Select.Option value="next">{t("schedule.adjustModal.fromNext")}</Select.Option>
          {items.map((it) => (
            <Select.Option key={it.timeline_item_id} value={it.timeline_item_id}>
              {t("schedule.adjustModal.fromSpecific", { title: it.title })}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div className={pageStyles.modalSection}>
        <div className={pageStyles.previewHeader}>
          <strong>{t("schedule.adjustModal.previewChanges")}</strong>
          <span className={pageStyles.previewCount}>
            {t("schedule.adjustModal.itemsWillUpdate", { count: affectedItems.length })}
          </span>
        </div>
        <div>
          {affectedItems.slice(0, 5).map((item) => (
            <div key={item.timeline_item_id} className={pageStyles.previewListItem}>
              <div>{item.title}</div>
              <div className={pageStyles.previewTimeShift}>
                {formatTime(item.start_time)}
                <RightOutlined />
                {formatTime(calculateNewTime(item.start_time, adjustmentMinutes ?? 0, direction))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={pageStyles.modalFooter}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button type="primary" onClick={onApply} loading={isApplying} disabled={!adjustmentMinutes}>
          {t("schedule.adjustModal.applyChanges")}
        </Button>
      </div>
    </Modal>
  );
};

export default AdjustTimelineModal;
