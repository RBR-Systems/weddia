'use client';
import { Card, Table, Space, Button, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, CheckSquareOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import CategoryTag from '../../common/CategoryTag/CategoryTag';
import { formatCurrency, formatDate } from '@/shared/utils/formatters.utils';
import type { Category, Expense } from '../../../models/budget.models';
import { BULK_TABLE_PAGE_SIZE } from '../../../constants/planner.constants';
import { useBulkOperations } from '../../../hooks/useBulkOperations';
import { BulkDataPanel } from '../BulkDataPanel/BulkDataPanel';
import { BulkActionModals } from '../BulkActionModals/BulkActionModals';
import bulkStyles from './BulkOperations.module.css';

export function BulkOperations() {
  const { t } = useTranslation();
  const ops = useBulkOperations();

  const columns: ColumnsType<Expense> = [
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => formatCurrency(v, ops.currency),
    },
    {
      title: t('common.category'),
      dataIndex: 'category_id',
      key: 'category_id',
      render: (id: string) => {
        const cat = ops.categories.find((c: Category) => c.id === id);
        return <CategoryTag color={cat?.color}>{cat?.name ?? id}</CategoryTag>;
      },
    },
    {
      title: t('common.date'),
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (v: string) => formatDate(v),
    },
    {
      title: t('common.status'),
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => t(`statusBadge.${status}`),
    },
  ];

  return (
    <>
      <BulkDataPanel
        expenseCount={ops.expenses.length}
        selectedCount={ops.selectedRowKeys.length}
        uploadProps={ops.uploadProps}
        importProgress={ops.importProgress}
        onExportAll={ops.handleExportAll}
        onExportSelected={ops.handleExportSelected}
        onDownloadTemplate={ops.handleDownloadTemplate}
      />

      <Card
        title={t('bulkOperations.title')}
        className={bulkStyles.bulkTable}
        extra={
          ops.selectedRowKeys.length > 0 && (
            <Space>
              <Typography.Text>
                {t('bulkOperations.selectedCount', { count: ops.selectedRowKeys.length })}
              </Typography.Text>
              <Button
                icon={<EditOutlined />}
                onClick={() => ops.setBulkActionModal('status')}
              >
                {t('bulkOperations.updateStatus')}
              </Button>
              <Button
                icon={<CheckSquareOutlined />}
                onClick={() => ops.setBulkActionModal('category')}
              >
                {t('bulkOperations.changeCategory')}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => ops.setBulkActionModal('delete')}
              >
                {t('common.delete')}
              </Button>
            </Space>
          )
        }
      >
        <Table
          rowSelection={ops.rowSelection}
          columns={columns}
          dataSource={ops.expenses}
          rowKey="expense_id"
          pagination={{ pageSize: BULK_TABLE_PAGE_SIZE }}
        />
      </Card>

      <BulkActionModals
        bulkActionModal={ops.bulkActionModal}
        selectedCount={ops.selectedRowKeys.length}
        bulkStatus={ops.bulkStatus}
        bulkCategory={ops.bulkCategory}
        categories={ops.categories}
        onStatusChange={ops.setBulkStatus}
        onCategoryChange={ops.setBulkCategory}
        onConfirmStatus={ops.handleBulkStatusUpdate}
        onConfirmCategory={ops.handleBulkCategoryUpdate}
        onConfirmDelete={ops.handleBulkDelete}
        onCancel={() => ops.setBulkActionModal(null)}
      />
    </>
  );
}
