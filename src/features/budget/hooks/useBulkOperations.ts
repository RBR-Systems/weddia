'use client';
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { App } from 'antd';
import type { UploadProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useBudget } from '../contexts/BudgetContext';
import { buildExpenseCsvRows, triggerCsvDownload } from '../utils/bulkOperations.utils';
import type { BulkActionModal, Category, Currency, Expense, PaymentStatus } from '../models/budget.models';
import {
  EXPORT_ALL_FILENAME,
  EXPORT_SELECTED_FILENAME,
  IMPORT_TEMPLATE_FILENAME,
  IMPORT_TEMPLATE_CONTENT,
  IMPORT_PROGRESS_INTERVAL_MS,
  IMPORT_PROGRESS_TOTAL_MS,
  IMPORT_PROGRESS_STEP,
  IMPORT_PROGRESS_MAX,
} from '../constants/planner.constants';

export interface UseBulkOperationsResult {
  expenses: Expense[];
  categories: Category[];
  currency: Currency;
  selectedRowKeys: React.Key[];
  bulkActionModal: BulkActionModal;
  bulkStatus: PaymentStatus;
  bulkCategory: string;
  importProgress: number | null;
  rowSelection: { selectedRowKeys: React.Key[]; onChange: (keys: React.Key[]) => void };
  uploadProps: UploadProps;
  setBulkActionModal: (modal: BulkActionModal) => void;
  setBulkStatus: (status: PaymentStatus) => void;
  setBulkCategory: (category: string) => void;
  handleExportAll: () => void;
  handleExportSelected: () => void;
  handleDownloadTemplate: () => void;
  handleBulkStatusUpdate: () => void;
  handleBulkCategoryUpdate: () => void;
  handleBulkDelete: () => void;
}

export const useBulkOperations = (): UseBulkOperationsResult => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { state, deleteExpense, updateExpense } = useBudget();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkActionModal, setBulkActionModal] = useState<BulkActionModal>(null);
  const [bulkStatus, setBulkStatus] = useState<PaymentStatus>('paid');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [importProgress, setImportProgress] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleExportAll = useCallback(() => {
    const csv = buildExpenseCsvRows(state.expenses, state.categories);
    triggerCsvDownload(csv, EXPORT_ALL_FILENAME);
    message.success(t('bulkOperations.exportSuccess'));
  }, [state.expenses, state.categories, message, t]);

  const handleExportSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('bulkOperations.noExpensesSelected'));
      return;
    }
    const selected = state.expenses.filter((e) => selectedRowKeys.includes(e.expense_id));
    const csv = buildExpenseCsvRows(selected, state.categories);
    triggerCsvDownload(csv, EXPORT_SELECTED_FILENAME);
    message.success(t('bulkOperations.exportedCount', { count: selected.length }));
  }, [selectedRowKeys, state.expenses, state.categories, message, t]);

  const handleDownloadTemplate = useCallback(() => {
    triggerCsvDownload(IMPORT_TEMPLATE_CONTENT, IMPORT_TEMPLATE_FILENAME);
  }, []);

  const startImportProgress = useCallback((onComplete: () => void) => {
    setImportProgress(0);
    intervalRef.current = setInterval(() => {
      setImportProgress((prev) => {
        if (prev === null || prev >= IMPORT_PROGRESS_MAX) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return null;
        }
        return prev + IMPORT_PROGRESS_STEP;
      });
    }, IMPORT_PROGRESS_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      onComplete();
      setImportProgress(null);
    }, IMPORT_PROGRESS_TOTAL_MS);
  }, []);

  const uploadProps: UploadProps = useMemo(() => ({
    accept: '.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      file
        .text()
        .then(() =>
          startImportProgress(() => message.success(t('bulkOperations.importCompleted'))),
        )
        .catch(() => message.error(t('bulkOperations.importFailed')));
      return false;
    },
  }), [startImportProgress, message, t]);

  const handleBulkStatusUpdate = useCallback(() => {
    selectedRowKeys.forEach((key) => {
      updateExpense?.(key as string, { payment_status: bulkStatus });
    });
    message.success(
      t('bulkOperations.expensesStatusUpdated', {
        count: selectedRowKeys.length,
        status: bulkStatus,
      }),
    );
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  }, [selectedRowKeys, bulkStatus, updateExpense, message, t]);

  const handleBulkCategoryUpdate = useCallback(() => {
    if (!bulkCategory) {
      message.error(t('bulkOperations.selectCategoryRequired'));
      return;
    }
    selectedRowKeys.forEach((key) => {
      updateExpense?.(key as string, { category_id: bulkCategory });
    });
    message.success(
      t('bulkOperations.expensesCategoryUpdated', { count: selectedRowKeys.length }),
    );
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  }, [selectedRowKeys, bulkCategory, updateExpense, message, t]);

  const handleBulkDelete = useCallback(() => {
    selectedRowKeys.forEach((key) => {
      deleteExpense?.(key as string);
    });
    message.success(t('bulkOperations.expensesDeleted', { count: selectedRowKeys.length }));
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  }, [selectedRowKeys, deleteExpense, message, t]);

  const handleRowSelectionChange = useCallback(
    (keys: React.Key[]) => setSelectedRowKeys(keys),
    [],
  );

  const rowSelection = useMemo(
    () => ({ selectedRowKeys, onChange: handleRowSelectionChange }),
    [selectedRowKeys, handleRowSelectionChange],
  );

  return {
    expenses: state.expenses,
    categories: state.categories,
    currency: state.currency,
    selectedRowKeys,
    bulkActionModal,
    bulkStatus,
    bulkCategory,
    importProgress,
    rowSelection,
    uploadProps,
    setBulkActionModal,
    setBulkStatus,
    setBulkCategory,
    handleExportAll,
    handleExportSelected,
    handleDownloadTemplate,
    handleBulkStatusUpdate,
    handleBulkCategoryUpdate,
    handleBulkDelete,
  };
};
