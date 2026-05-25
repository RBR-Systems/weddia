import { EventCardProps } from "@/features/events-list/models/eventCardProps.models";

export enum EventActions {
  SET_OPEN_CREATE_EVENT_MODAL = "SET_OPEN_CREATE_EVENT_MODAL",
  SET_SELECTED_EVENT = "SET_SELECTED_EVENT",
  SET_ALL_EVENTS = "SET_ALL_EVENTS",
  UPDATE_EVENT = "UPDATE_EVENT",
  ADD_EVENT = "ADD_EVENT",
}

export type EventAction =
  | { type: EventActions.SET_ALL_EVENTS; payload: EventCardProps[] }
  | { type: EventActions.SET_SELECTED_EVENT; payload: number | null }
  | { type: EventActions.SET_OPEN_CREATE_EVENT_MODAL; payload: boolean }
  | { type: EventActions.UPDATE_EVENT; payload: EventCardProps }
  | { type: EventActions.ADD_EVENT; payload: EventCardProps };
