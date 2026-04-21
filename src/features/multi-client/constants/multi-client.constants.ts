import dayjs from 'dayjs';
import type { ClientBudget } from '../models/multi-client.models';

export const CLIENT_STATUS_CONFIG = {
  on_track: { labelKey: 'multiClientView.status.onTrack', color: 'success' },
  at_risk: { labelKey: 'multiClientView.status.atRisk', color: 'warning' },
  over_budget: { labelKey: 'multiClientView.status.overBudget', color: 'error' },
  completed: { labelKey: 'multiClientView.status.completed', color: 'default' },
} as const;

export const CLIENT_SEARCH_WIDTH = 200;
export const CLIENT_FILTER_WIDTH = 150;
export const CLIENT_TABLE_PAGE_SIZE = 10;
export const CLIENT_DATE_FORMAT = 'MMM D, YYYY';
export const CLIENT_AVATAR_SECONDARY_FONT_SIZE = 12;

export const AT_RISK_DAY_THRESHOLD = 30;
export const APPROACHING_DAY_THRESHOLD = 90;

export const MOCK_CLIENTS: ClientBudget[] = [
  {
    id: '1',
    clientName: 'Sarah & Michael',
    weddingDate: '2026-06-15',
    totalBudget: 50000,
    totalSpent: 35000,
    status: 'on_track',
    lastUpdated: dayjs().subtract(1, 'day').toISOString(),
    expenseCount: 24,
  },
  {
    id: '2',
    clientName: 'Emily & James',
    weddingDate: '2026-08-20',
    totalBudget: 75000,
    totalSpent: 68000,
    status: 'at_risk',
    lastUpdated: dayjs().subtract(2, 'hours').toISOString(),
    expenseCount: 45,
  },
  {
    id: '3',
    clientName: 'Jessica & David',
    weddingDate: '2026-04-10',
    totalBudget: 30000,
    totalSpent: 32500,
    status: 'over_budget',
    lastUpdated: dayjs().subtract(3, 'days').toISOString(),
    expenseCount: 18,
  },
  {
    id: '4',
    clientName: 'Amanda & Chris',
    weddingDate: '2025-12-31',
    totalBudget: 45000,
    totalSpent: 44800,
    status: 'completed',
    lastUpdated: dayjs().subtract(10, 'days').toISOString(),
    expenseCount: 38,
  },
  {
    id: '5',
    clientName: 'Rachel & Tom',
    weddingDate: '2026-09-05',
    totalBudget: 60000,
    totalSpent: 15000,
    status: 'on_track',
    lastUpdated: dayjs().toISOString(),
    expenseCount: 8,
  },
];
