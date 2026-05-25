import { EventCardProps } from "@/features/events-list/models/eventCardProps.models";

export interface EventContextInterface {
  events: {
    selectedEvent: EventCardProps | null;
    allEvents: EventCardProps[];
    openCreateOpenModal: boolean;
  };
}
