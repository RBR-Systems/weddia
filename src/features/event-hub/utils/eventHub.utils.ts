import { formatCurrency, formatDate, formatNumber } from "@/shared/utils/formatters.utils";

import {
  EVENT_HUB_COMMON_ACTIONS,
  EVENT_HUB_DATE_FORMAT_OPTIONS,
  EVENT_HUB_EMPTY_VALUE,
  EVENT_HUB_PLANNING_START_OFFSET_YEARS,
} from "../constants/eventHub.constants";
import type {
  EventHubTranslator,
  EventHubViewModel,
  EventHubViewModelParams,
} from "../models/eventHub.models";
import type { EventCardProps } from "@/features/events-list/models/eventCardProps.models";

const getSafeDate = (dateValue?: string): Date | null => {
  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(dateValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatEventDate = (selectedEvent: EventCardProps): string => {
  const eventDate = getSafeDate(selectedEvent.rawDate);

  if (eventDate) {
    return formatDate(eventDate, EVENT_HUB_DATE_FORMAT_OPTIONS);
  }

  return selectedEvent.date || EVENT_HUB_EMPTY_VALUE;
};

const formatPlanningStartDate = (selectedEvent: EventCardProps): string => {
  const eventDate = getSafeDate(selectedEvent.rawDate);

  if (!eventDate) {
    return EVENT_HUB_EMPTY_VALUE;
  }

  const planningStartDate = new Date(eventDate);
  planningStartDate.setFullYear(
    planningStartDate.getFullYear() - EVENT_HUB_PLANNING_START_OFFSET_YEARS,
  );

  return formatDate(planningStartDate, EVENT_HUB_DATE_FORMAT_OPTIONS);
};

const formatBudget = (budget?: number): string => {
  if (budget == null) {
    return EVENT_HUB_EMPTY_VALUE;
  }

  return formatCurrency(budget);
};

const getStatusLabel = (
  selectedEvent: EventCardProps,
  t: EventHubTranslator,
): string => t(`eventList.status.${selectedEvent.status}`);

export const buildEventHubViewModel = (
  params: EventHubViewModelParams,
): EventHubViewModel => {
  const { selectedEvent, t } = params;
  const eventDate = formatEventDate(selectedEvent);

  return {
    eventName: selectedEvent.eventName,
    headerItems: [
      t("eventsHub.yearToGo"),
      t("eventsHub.startedOn", {
        date: formatPlanningStartDate(selectedEvent),
      }),
      t("eventsHub.weddingDay", { date: eventDate }),
      t("eventsHub.status", {
        status: getStatusLabel(selectedEvent, t),
      }),
    ],
    statistics: [
      {
        id: "event-date",
        label: t("eventsHub.statistics.date"),
        value: eventDate,
      },
      {
        id: "event-location",
        label: t("eventsHub.statistics.location"),
        value: selectedEvent.location || EVENT_HUB_EMPTY_VALUE,
      },
      {
        id: "event-budget",
        label: t("eventsHub.statistics.budget"),
        value: formatBudget(selectedEvent.budget),
      },
      {
        id: "event-tasks",
        label: t("eventsHub.statistics.tasks"),
        value: formatNumber(selectedEvent.tasks),
      },
    ],
    upcomingTasks:
      selectedEvent.tasks > 0
        ? [
            {
              id: "tracked-tasks",
              label: t("eventsHub.upcomingTasks.count", {
                count: selectedEvent.tasks,
              }),
            },
          ]
        : [],
    reminders: [],
    commonActions: EVENT_HUB_COMMON_ACTIONS.map((action) => ({
      id: action.id,
      label: t(action.translationKey),
    })),
  };
};
