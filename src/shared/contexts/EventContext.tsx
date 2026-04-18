"use client";
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from "react";
import { EventContextInterface } from "./InitialState";
import { EventAction, EventActions } from "./eventActions";
import { EventCardProps } from "@/features/events-list/models/eventCardProps.models";
import { EventStatus } from "@/features/events-list/models/enums/eventList.models";
import { apiGet, isAbortError } from "@/shared/api/apiClient";
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
    rawDate: e.eventDate,
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

const SELECTED_EVENT_KEY = "rbr_selected_event_id";

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
    case EventActions.UPDATE_EVENT:
      return {
        ...state,
        events: {
          ...state.events,
          allEvents: state.events.allEvents.map((e) =>
            e.id === action.payload.id ? action.payload : e,
          ),
        },
      };
    case EventActions.ADD_EVENT:
      return {
        ...state,
        events: {
          ...state.events,
          allEvents: [...state.events.allEvents, action.payload],
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

  // Persist selected event id whenever it changes
  useEffect(() => {
    const id = state.events.selectedEvent?.id;
    if (id != null) {
      localStorage.setItem(SELECTED_EVENT_KEY, String(id));
    }
  }, [state.events.selectedEvent]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    apiGet<ApiEvent[]>("/api/events", { signal: controller.signal })
      .then((events) => {
        const mapped = events.map(mapApiEvent);
        dispatch({ type: EventActions.SET_ALL_EVENTS, payload: mapped });
        if (mapped.length > 0) {
          const savedId = localStorage.getItem(SELECTED_EVENT_KEY);
          const restoredIdx = savedId
            ? mapped.findIndex((e) => String(e.id) === savedId)
            : -1;
          dispatch({
            type: EventActions.SET_SELECTED_EVENT,
            payload: restoredIdx >= 0 ? restoredIdx : 0,
          });
        }
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        console.error("Failed to load events:", err);
      });
    return () => controller.abort();
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

