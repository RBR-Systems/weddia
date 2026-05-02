'use client';
import { Modal, Space, Select, Alert, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { BulkActionModal } from '../../../models/budget.models';
import type { Category, PaymentStatus } from '../../../models/budget.models';
import { BULK_PAYMENT_STATUS_OPTIONS } from '../../../constants/planner.constants';
import styles from './BulkActionModals.module.css';

interface BulkActionModalsProps {
  bulkActionModal: BulkActionModal;
  selectedCount: number;
  bulkStatus: PaymentStatus;
  bulkCategory: string;
  categories: Category[];
  onStatusChange: (status: PaymentStatus) => void;
  onCategoryChange: (categoryId: string) => void;
  onConfirmStatus: () => void;
  onConfirmCategory: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export const BulkActionModals = ({
  bulkActionModal,
  selectedCount,
  bulkStatus,
  bulkCategory,
  categories,
  onStatusChange,
  onCategoryChange,
  onConfirmStatus,
  onConfirmCategory,
  onConfirmDelete,
  onCancel,
}: BulkActionModalsProps) => {
  const { t } = useTranslation();

  const statusOptions = BULK_PAYMENT_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <Modal
        title={t('bulkOperations.updatePaymentStatus')}
        open={bulkActionModal === 'status'}
        onOk={onConfirmStatus}
        onCancel={onCancel}
      >
        <Space orientation="vertical" className={styles.fullWidth}>
          <Typography.Text>
            {t('bulkOperations.updateExpensesTo', { count: selectedCount })}
          </Typography.Text>
          <Select
            value={bulkStatus}
            onChange={onStatusChange}
            className="u-full-width"
            options={statusOptions}
          />
        </Space>
      </Modal>

      <Modal
        title={t('bulkOperations.changeCategory')}
        open={bulkActionModal === 'category'}
        onOk={onConfirmCategory}
        onCancel={onCancel}
      >
        <Space orientation="vertical" className={styles.fullWidth}>
          <Typography.Text>
            {t('bulkOperations.moveExpensesTo', { count: selectedCount })}
          </Typography.Text>
          <Select
            value={bulkCategory}
            onChange={onCategoryChange}
            className="u-full-width"
            placeholder={t('bulkOperations.selectCategoryPlaceholder')}
            options={categoryOptions}
          />
        </Space>
      </Modal>

      <Modal
        title={t('bulkOperations.confirmDelete')}
        open={bulkActionModal === 'delete'}
        onOk={onConfirmDelete}
        onCancel={onCancel}
        okText={t('common.delete')}
        okButtonProps={{ danger: true }}
      >
        <Alert
          message={t('bulkOperations.deleteConfirm', { count: selectedCount })}
          description={t('bulkOperations.cannotUndo')}
          type="warning"
          showIcon
        />
      </Modal>
    </>
  );
};
