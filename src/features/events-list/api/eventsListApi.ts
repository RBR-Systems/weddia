import { apiPut } from '@/shared/api/apiClient';

export interface UpdateEventBody {
  eventName: string;
  title: string;
  description: string;
  eventDate: string;
  eventAddress: string;
  budget: number;
  status: string;
}

export const updateEvent = (id: number, body: UpdateEventBody): Promise<void> =>
  apiPut(`/api/events/${id}?adminId=1`, body);
