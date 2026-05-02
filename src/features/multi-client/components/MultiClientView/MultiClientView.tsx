'use client';
import { Card, Table, Tag, Progress, Space, Button, Input, Select, Typography, Avatar } from 'antd';
import { PlusOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { formatCurrency } from '@/shared/utils/formatters.utils';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS, SEMANTIC_CHART_COLORS } from '@/theme/chartColors';
import { useTheme } from '@/theme/ThemeProvider';
import { DEFAULT_CURRENCY } from '@/shared/constants/app.constants';
import type { ClientBudget } from '../../models/multi-client.models';
import {
  CLIENT_STATUS_CONFIG,
  CLIENT_SEARCH_WIDTH,
  CLIENT_FILTER_WIDTH,
  CLIENT_TABLE_PAGE_SIZE,
  CLIENT_DATE_FORMAT,
  AT_RISK_DAY_THRESHOLD,
  APPROACHING_DAY_THRESHOLD,
} from '../../constants/multi-client.constants';
import { useMultiClientView } from '../../hooks/useMultiClientView';
import { ClientStatsRow } from '../ClientStatsRow/ClientStatsRow';
import styles from './MultiClientView.module.css';

interface MultiClientViewProps {
  readonly onSelectClient?: (clientId: string) => void;
}

const CLIENT_SEARCH_STYLE = { width: CLIENT_SEARCH_WIDTH } as const;
const CLIENT_FILTER_STYLE = { width: CLIENT_FILTER_WIDTH } as const;

export function MultiClientView({ onSelectClient }: MultiClientViewProps) {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const chartColors = CHART_COLORS[mode];
  const semantic = SEMANTIC_CHART_COLORS[mode];
  const {
    clients,
    filteredClients,
    totalManagedBudget,
    activeClientsCount,
    atRiskClientsCount,
    setSearchTerm,
    setStatusFilter,
  } = useMultiClientView();

  const columns: ColumnsType<ClientBudget> = [
    {
      title: t('multiClientView.columns.client'),
      key: 'client',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: chartColors[0] }}>
            {record.clientName.charAt(0)}
          </Avatar>
          <div>
            <Typography.Text strong>{record.clientName}</Typography.Text>
            <br />
            <Typography.Text type="secondary" className={styles.secondaryText}>
              <CalendarOutlined /> {dayjs(record.weddingDate).format(CLIENT_DATE_FORMAT)}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('common.budget'),
      key: 'budget',
      render: (_, record) => {
        const percent = Math.min(
          Math.round((record.totalSpent / record.totalBudget) * 100),
          100,
        );
        const progressStatus = (() => {
          if (record.status === 'over_budget') return 'exception' as const;
          if (record.status === 'at_risk') return 'normal' as const;
          return 'success' as const;
        })();
        const strokeColor = (() => {
          if (record.status === 'over_budget') return semantic.error;
          if (record.status === 'at_risk') return semantic.warning;
          return semantic.success;
        })();

        return (
          <div className={styles.budgetCell}>
            <div className={styles.budgetAmounts}>
              <Typography.Text>{formatCurrency(record.totalSpent, DEFAULT_CURRENCY)}</Typography.Text>
              <Typography.Text type="secondary">
                / {formatCurrency(record.totalBudget, DEFAULT_CURRENCY)}
              </Typography.Text>
            </div>
            <Progress
              percent={percent}
              status={progressStatus}
              size="small"
              strokeColor={strokeColor}
            />
          </div>
        );
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof CLIENT_STATUS_CONFIG) => {
        const config = CLIENT_STATUS_CONFIG[status];
        return <Tag color={config.color}>{t(config.labelKey)}</Tag>;
      },
      filters: Object.entries(CLIENT_STATUS_CONFIG).map(([key, value]) => ({
        text: t(value.labelKey),
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('multiClientView.columns.expenses'),
      dataIndex: 'expenseCount',
      key: 'expenseCount',
      sorter: (a, b) => a.expenseCount - b.expenseCount,
    },
    {
      title: t('multiClientView.columns.daysUntil'),
      key: 'daysUntil',
      render: (_, record) => {
        const days = dayjs(record.weddingDate).diff(dayjs(), 'day');
        if (days < 0) return <Tag>{t('common.past')}</Tag>;
        if (days <= AT_RISK_DAY_THRESHOLD) return <Tag color="red">{days} days</Tag>;
        if (days <= APPROACHING_DAY_THRESHOLD) return <Tag color="orange">{days} days</Tag>;
        return <Typography.Text type="secondary">{days} days</Typography.Text>;
      },
      sorter: (a, b) =>
        dayjs(a.weddingDate).diff(dayjs()) - dayjs(b.weddingDate).diff(dayjs()),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onSelectClient?.(record.id)}
        >
          {t('common.view')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <ClientStatsRow
        totalClients={clients.length}
        activeClientsCount={activeClientsCount}
        totalManagedBudget={totalManagedBudget}
        atRiskClientsCount={atRiskClientsCount}
      />

      <Card
        title={t('multiClientView.clientBudgets')}
        extra={
          <Space>
            <Input.Search
              placeholder={t('multiClientView.searchClients')}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={CLIENT_SEARCH_STYLE}
            />
            <Select
              placeholder={t('multiClientView.filterByStatus')}
              allowClear
              style={CLIENT_FILTER_STYLE}
              onChange={setStatusFilter}
              options={Object.entries(CLIENT_STATUS_CONFIG).map(([key, value]) => ({
                value: key,
                label: t(value.labelKey),
              }))}
            />
            <Button type="primary" icon={<PlusOutlined />}>
              {t('multiClientView.addClient')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredClients}
          rowKey="id"
          pagination={{ pageSize: CLIENT_TABLE_PAGE_SIZE }}
        />
      </Card>
    </>
  );
}
