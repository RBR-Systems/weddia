"use client";
import React from "react";
import { Modal, Checkbox } from "antd";
import { useTranslation } from "react-i18next";
import { TimelineItem } from "../../models/schedule.models";
import { formatTime } from "../../utils/schedule.utils";
import pageStyles from "../../schedule-page.module.css";

type DeleteImpact = ReturnType<(item: TimelineItem) => {
  hasGap: false;
} | {
  hasGap: true;
  gapDurationText: string;
  previousItem: TimelineItem;
  nextItem: TimelineItem;
  canCascade: true;
}>;

interface Props {
  deleteTarget: TimelineItem | null;
  shouldCascade: boolean;
  onCascadeChange: (v: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
  analyzeDeleteImpact: (item: TimelineItem) => DeleteImpact;
}

const DeleteConfirmModal: React.FC<Props> = ({
  deleteTarget, shouldCascade, onCascadeChange, onConfirm, onClose, analyzeDeleteImpact,
}) => {
  const { t } = useTranslation();
  const impact = deleteTarget ? analyzeDeleteImpact(deleteTarget) : null;

  return (
    <Modal
      open={Boolean(deleteTarget)}
      title={
        deleteTarget
          ? t("schedule.deleteModal.title", { title: deleteTarget.title })
          : t("schedule.deleteModal.titleFallback")
      }
      onOk={onConfirm}
      onCancel={onClose}
      okText={t("common.delete")}
      okType="danger"
    >
      {deleteTarget && impact && (
        <div>
          <div className={pageStyles.deleteModalTime}>
            {formatTime(deleteTarget.start_time)} – {formatTime(deleteTarget.end_time)}
          </div>
          {impact.hasGap && (
            <div className={pageStyles.deleteModalGap}>
              {t("schedule.deleteModal.gapWarning", {
                gap: impact.gapDurationText,
                prev: impact.previousItem.title,
                next: impact.nextItem.title,
              })}
            </div>
          )}
          {impact.hasGap && impact.canCascade && (
            <div className={pageStyles.deleteModalCascade}>
              <Checkbox checked={shouldCascade} onChange={(e) => onCascadeChange(e.target.checked)}>
                {t("schedule.deleteModal.cascadeShift")}
              </Checkbox>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DeleteConfirmModal;
