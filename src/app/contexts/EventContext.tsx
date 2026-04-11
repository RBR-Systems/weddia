"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { EventContextInterface } from "./InitialState";
import { EventAction, EventActions } from "./EventActions";
import { EventCardProps } from "../components/events-list/models/event-card-props-model";
import { EventStatus } from "../components/events-list/models/enums/event-list-enums";
import { apiGet } from "@/lib/apiClient";
import { useAuth } from "./AuthContext";

interface ApiEvent {
  eventId: number;
  organizationId: number;
  title: string;
  description: string;
  eventDate: string;
  eventName: string;
  eventAddress: string;
  budget: number;
  status: string;
}

function mapApiStatus(status: string): EventStatus {
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "in_progress":
      return EventStatus.IN_PROGRESS;
    case "completed":
      return EventStatus.COMPLETED;
    case "cancelled":
    case "canceled":
      return EventStatus.CANCELED;
    default:
      return EventStatus.NOT_STARTED;
  }
}

function mapApiEvent(e: ApiEvent): EventCardProps {
  const d = new Date(e.eventDate);
  const date = d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    id: e.eventId,
    eventName: e.eventName || e.title,
    status: mapApiStatus(e.status),
    date,
    description: e.description ?? "",
    clients: "",
    location: e.eventAddress ?? "",
    invites: 0,
    rsvp: 0,
    tasks: 0,
    sits: 0,
    budget: e.budget,
    spent: 0,
  };
}

const initialState: EventContextInterface = {
  events: {
    allEvents: [],
    selectedEvent: null,
    openCreateOpenModal: false,
  },
};

function eventReducer(
  state: EventContextInterface,
  action: EventAction,
): EventContextInterface {
  switch (action.type) {
    case EventActions.SET_ALL_EVENTS:
      return {
        ...state,
        events: { ...state.events, allEvents: action.payload },
      };
    case EventActions.SET_OPEN_CREATE_EVENT_MODAL:
      return {
        ...state,
        events: { ...state.events, openCreateOpenModal: action.payload },
      };
    case EventActions.SET_SELECTED_EVENT:
      return {
        ...state,
        events: {
          ...state.events,
          selectedEvent: state.events.allEvents[action.payload ?? 0] ?? null,
        },
      };
    default:
      return state;
  }
}

const EventContext = createContext<{
  state: EventContextInterface;
  dispatch: React.Dispatch<EventAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    apiGet<ApiEvent[]>("/api/events")
      .then((events) => {
        const mapped = events.map(mapApiEvent);
        dispatch({ type: EventActions.SET_ALL_EVENTS, payload: mapped });
        if (mapped.length > 0) {
          dispatch({ type: EventActions.SET_SELECTED_EVENT, payload: 0 });
        }
      })
      .catch((err) => console.error("Failed to load events:", err));
  }, [token]);

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  );
}

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within an EventProvider");
  return context;
};
