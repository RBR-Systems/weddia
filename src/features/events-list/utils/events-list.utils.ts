import type { EventCardProps } from '../models/eventCardProps.models';
import { STATUS_SORT_ORDER } from '../constants/events-list.constants';

/** Compact currency formatter — no decimal places, USD, en-US locale. */
export const formatBudgetAmount = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** Returns events sorted by operational priority (in-progress first, completed last). */
export const sortEventsByStatus = (events: EventCardProps[]): EventCardProps[] =>
  [...events].sort(
    (a, b) => (STATUS_SORT_ORDER[a.status] ?? 5) - (STATUS_SORT_ORDER[b.status] ?? 5),
  );

/** Returns a map of status → count for the given event list. */
export const countEventsByStatus = (events: EventCardProps[]): Record<string, number> =>
  events.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
