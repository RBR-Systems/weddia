import { EventStatus } from "./enums/event-list-enums";

export interface EventCardProps {
  id?: number;
  eventName: string;
  status: EventStatus;
  date: string;
  /** Raw ISO date string preserved from the API for editing */
  rawDate?: string;
  description: string;
  clients: string;
  location: string;
  invites: number;
  rsvp: number;
  tasks: number;
  sits: number;
  budget?: number;
  spent?: number;
}
