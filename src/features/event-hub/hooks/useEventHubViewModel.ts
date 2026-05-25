"use client";

import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";

import type { UseEventHubViewModelResult } from "../models/eventHub.models";
import { buildEventHubViewModel } from "../utils/eventHub.utils";

export const useEventHubViewModel = (): UseEventHubViewModelResult => {
  const { t } = useTranslation();
  const {
    state: {
      events: { selectedEvent },
    },
  } = useEvent();

  return {
    viewModel: selectedEvent
      ? buildEventHubViewModel({ selectedEvent, t })
      : null,
  };
};
