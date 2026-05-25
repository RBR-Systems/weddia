import { Tooltip, Tag, Progress } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from '../../event-list.module.css';
import { formatBudgetAmount } from '../../utils/events-list.utils';
import { BUDGET_LOW_THRESHOLD, BUDGET_WARNING_PERCENT } from '../../constants/events-list.constants';

interface EventBudgetCellProps {
  budget: number;
  spent: number;
}

export const EventBudgetCell = ({ budget, spent }: EventBudgetCellProps) => {
  const { t } = useTranslation();
  const remaining = budget - spent;
  const percentage = Math.round((spent / budget) * 100);
  const isOverBudget = spent > budget;

  return (
    <div className={styles.budgetContainer}>
      <div className={styles.budgetRow}>
        <Tooltip title={t('eventList.totalBudget')}>
          <span className={styles.budgetTotal}>
            <DollarOutlined /> {formatBudgetAmount(budget)}
          </span>
        </Tooltip>
        <Tag
          color={isOverBudget ? 'red' : remaining < budget * BUDGET_LOW_THRESHOLD ? 'orange' : 'green'}
          className={styles.tagNoMargin}
        >
          {isOverBudget
            ? `-${formatBudgetAmount(Math.abs(remaining))}`
            : formatBudgetAmount(remaining)}
        </Tag>
      </div>
      <Progress
        percent={Math.min(percentage, 100)}
        size="small"
        status={isOverBudget ? 'exception' : percentage >= BUDGET_WARNING_PERCENT ? 'active' : 'normal'}
        strokeColor={
          isOverBudget
            ? 'var(--status-canceled)'
            : percentage >= BUDGET_WARNING_PERCENT
            ? 'var(--status-delayed)'
            : 'var(--status-completed)'
        }
        format={() => `${percentage}%`}
      />
    </div>
  );
};
