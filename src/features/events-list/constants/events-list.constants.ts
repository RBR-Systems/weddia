import { EventStatus } from '../models/enums/eventList.models';

export const STATUS_TO_API_STATUS: Record<EventStatus, string> = {
  [EventStatus.IN_PROGRESS]: 'in_progress',
  [EventStatus.NOT_STARTED]: 'not_started',
  [EventStatus.COMPLETED]: 'completed',
  [EventStatus.CANCELED]: 'canceled',
};

export const STATUS_CONFIG: Record<EventStatus, { color: string; label: string }> = {
  [EventStatus.IN_PROGRESS]: { color: 'processing', label: 'In Progress' },
  [EventStatus.NOT_STARTED]: { color: 'default',    label: 'Not Started' },
  [EventStatus.COMPLETED]:   { color: 'success',    label: 'Completed' },
  [EventStatus.CANCELED]:    { color: 'error',      label: 'Canceled' },
};

export const STATUS_SORT_ORDER: Record<string, number> = {
  [EventStatus.IN_PROGRESS]: 1,
  [EventStatus.NOT_STARTED]: 2,
  [EventStatus.CANCELED]:    3,
  [EventStatus.COMPLETED]:   4,
};

export const BUDGET_LOW_THRESHOLD = 0.2;
export const BUDGET_WARNING_PERCENT = 90;
export const EVENTS_PAGE_SIZE = 10;
