'use client';
import { Card, Row, Col } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Statistic from '@/shared/components/AnimatedStatistic/AnimatedStatistic';
import { formatCurrency } from '@/shared/utils/formatters.utils';
import { SEMANTIC_CHART_COLORS } from '@/theme/chartColors';
import { useTheme } from '@/theme/ThemeProvider';

interface ClientStatsRowProps {
  totalClients: number;
  activeClientsCount: number;
  totalManagedBudget: number;
  atRiskClientsCount: number;
}

export const ClientStatsRow = ({
  totalClients,
  activeClientsCount,
  totalManagedBudget,
  atRiskClientsCount,
}: ClientStatsRowProps) => {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const semantic = SEMANTIC_CHART_COLORS[mode];

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title={t('multiClientView.totalClients')}
            value={totalClients}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title={t('multiClientView.activeWeddings')}
            value={activeClientsCount}
            styles={{ content: { color: semantic.info } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title={t('multiClientView.totalManaged')}
            value={totalManagedBudget}
            formatter={(value: number | string) => formatCurrency(Number(value), 'USD')}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title={t('multiClientView.needsAttention')}
            value={atRiskClientsCount}
            styles={{
              content: { color: atRiskClientsCount > 0 ? semantic.error : semantic.success },
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};
