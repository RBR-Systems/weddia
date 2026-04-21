import type { EventHubActionDefinition } from "../models/eventHub.models";

export const EVENT_HUB_EMPTY_VALUE = "—";

export const EVENT_HUB_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export const EVENT_HUB_PLANNING_START_OFFSET_YEARS = 1;

export const EVENT_HUB_COMMON_ACTIONS: readonly EventHubActionDefinition[] = [
  { id: "guest-list", translationKey: "nav.guestList" },
  { id: "budget", translationKey: "nav.budget" },
  { id: "schedule", translationKey: "nav.schedule" },
  { id: "tasks", translationKey: "nav.tasks" },
];
