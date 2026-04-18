"use client";

import React from "react";
import { Modal, Button, InputNumber, Typography, Tag, Space, Divider } from "antd";
import { StarFilled, PhoneOutlined, MailOutlined, EnvironmentOutlined, AlertOutlined, MedicineBoxOutlined, FileTextOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { CheckInGuest } from "../../models/checkIn.models";
import styles from "./CheckIn.module.css";

const { Text, Title } = Typography;

interface CheckInModalProps {
  open: boolean;
  guest: CheckInGuest | null;
  actualPartySize: number;
  onActualPartySizeChange: (value: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({
  open,
  guest,
  actualPartySize,
  onActualPartySizeChange,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  if (!guest) return null;

  const hasDietary =
    guest.dietary_restrictions && guest.dietary_restrictions.length > 0;
  const hasAccessibility = !!guest.accesability_needs;
  const hasNotes = !!guest.notes;

  return (
    <Modal
      open={open}
      title={
        <div className={styles.vipHeader}>
          <span>{t("checkIn.modal.title")}</span>
          {guest.is_vip && (
            <Tag color="gold" icon={<StarFilled />}>
              {t("checkIn.badges.vip")}
            </Tag>
          )}
        </div>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t("checkIn.modal.cancelCheckIn")}
        </Button>,
        <Button key="confirm" type="primary" onClick={onConfirm}>
          {t("checkIn.modal.confirmCheckIn")}
        </Button>,
      ]}
      width={520}
    >
      {/* Guest Info */}
      <div className={styles.modalSection}>
        <Title level={4} style={{ margin: 0 }}>
          {guest.first_name} {guest.last_name}
        </Title>
        {guest.relation_name && (
          <Text type="secondary">{guest.relation_name}</Text>
        )}
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {/* Table Assignment */}
      <div className={styles.modalSection}>
        <div className={styles.modalSectionTitle}>
          {t("checkIn.modal.tableAssignment")}
        </div>
        <div className={styles.modalInfoGrid}>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>
              {t("checkIn.modal.table")}
            </span>
            <span className={styles.modalInfoValue}>
              {guest.table_id ? (
                <Space>
                  <EnvironmentOutlined />
                  {guest.table_id}
                </Space>
              ) : (
                <Text type="secondary">{t("checkIn.modal.notAssigned")}</Text>
              )}
            </span>
          </div>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>
              {t("checkIn.modal.seat")}
            </span>
            <span className={styles.modalInfoValue}>
              {guest.seat_number
                ? t("checkIn.table.seatNumber", { number: guest.seat_number })
                : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Party Size */}
      <div className={styles.modalSection}>
        <div className={styles.modalInfoGrid}>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>
              {t("checkIn.modal.expectedPartySize")}
            </span>
            <span className={styles.modalInfoValue}>{guest.party_size}</span>
          </div>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>
              {t("checkIn.modal.actualPartySize")}
            </span>
            <InputNumber
              min={1}
              max={20}
              value={actualPartySize}
              onChange={(v) => onActualPartySizeChange(v as number)}
              className={styles.partySizeInput}
            />
            <span className={styles.partySizeHelp}>
              {t("checkIn.modal.actualPartySizeHelp")}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className={styles.modalSection}>
        <div className={styles.modalSectionTitle}>
          {t("checkIn.modal.contactInfo")}
        </div>
        {guest.phone || guest.email ? (
          <Space orientation="vertical" size={4}>
            {guest.phone && (
              <Space>
                <PhoneOutlined />
                <Text>{guest.phone}</Text>
              </Space>
            )}
            {guest.email && (
              <Space>
                <MailOutlined />
                <Text>{guest.email}</Text>
              </Space>
            )}
          </Space>
        ) : (
          <Text type="secondary">{t("checkIn.modal.noContact")}</Text>
        )}
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {/* Alerts Section */}
      {hasDietary && (
        <div className={`${styles.alertBox} ${styles.alertBoxDietary}`}>
          <div className={styles.alertBoxTitle}>
            <MedicineBoxOutlined style={{ color: "#1677ff" }} />
            {t("checkIn.modal.dietaryRestrictions")}
          </div>
          <div className={styles.alertBoxContent}>
            {guest.dietary_restrictions!.join(", ")}
          </div>
        </div>
      )}

      {hasAccessibility && (
        <div className={`${styles.alertBox} ${styles.alertBoxAccessibility}`}>
          <div className={styles.alertBoxTitle}>
            <AlertOutlined style={{ color: "#722ed1" }} />
            {t("checkIn.modal.accessibilityNeeds")}
          </div>
          <div className={styles.alertBoxContent}>
            {guest.accesability_needs}
          </div>
        </div>
      )}

      {hasNotes && (
        <div className={`${styles.alertBox} ${styles.alertBoxNotes}`}>
          <div className={styles.alertBoxTitle}>
            <FileTextOutlined style={{ color: "#faad14" }} />
            {t("checkIn.modal.specialNotes")}
          </div>
          <div className={styles.alertBoxContent}>{guest.notes}</div>
        </div>
      )}
    </Modal>
  );
};

export default CheckInModal;

