import type { EventCardProps } from "@/features/events-list/models/eventCardProps.models";

export type EventHubTranslator = (
  key: string,
  options?: Record<string, number | string>,
) => string;

export interface EventHubActionDefinition {
  readonly id: string;
  readonly translationKey: string;
}

export interface EventHubListItem {
  readonly id: string;
  readonly label: string;
}

export interface EventHubStatisticItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface EventHubViewModel {
  readonly eventName: string;
  readonly headerItems: string[];
  readonly statistics: EventHubStatisticItem[];
  readonly upcomingTasks: EventHubListItem[];
  readonly reminders: EventHubListItem[];
  readonly commonActions: EventHubListItem[];
}

export interface UseEventHubViewModelResult {
  readonly viewModel: EventHubViewModel | null;
}

export interface StatisticsProps {
  readonly title: string;
  readonly items: EventHubStatisticItem[];
}

export interface UpcomingTasksProps {
  readonly title: string;
  readonly items: EventHubListItem[];
  readonly emptyText: string;
}

export interface RemindersProps {
  readonly title: string;
  readonly items: EventHubListItem[];
  readonly emptyText: string;
}

export interface CommonActionsProps {
  readonly title: string;
  readonly items: EventHubListItem[];
}

export interface EventHubViewModelParams {
  readonly selectedEvent: EventCardProps;
  readonly t: EventHubTranslator;
}
