import type { Dayjs } from "dayjs";

export type RequiredMark = boolean | "optional";

export interface CreateEventFormValues {
  requiredMarkValue?: RequiredMark;
  eventName: string;
  eventDate: Dayjs;
  eventAddress: string;
  description?: string;
  theme?: string;
  budget: number;
  comments?: string;
}

export interface CreateEventPayload {
  eventName: string;
  title: string;
  description: string;
  eventDate: string;
  eventAddress: string;
  budget: number;
  status: string;
  organizationId?: number | null;
}

export interface CreateEventResponse {
  eventId: number;
}
