import type { Dayjs } from 'dayjs';
import type { EventStatus } from './enums/eventList.models';

export interface EventEditFormValues {
  eventName: string;
  eventDate: Dayjs | null;
  location: string;
  description: string;
  budget: number;
  status: EventStatus;
}
