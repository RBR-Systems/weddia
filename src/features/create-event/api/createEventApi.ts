import { apiPost } from "@/shared/api/apiClient";
import type {
  CreateEventPayload,
  CreateEventResponse,
} from "../models/createEvent.models";
import { CREATE_EVENT_API_PATH } from "../constants/createEvent.constants";

export const createEvent = (
  payload: CreateEventPayload,
): Promise<CreateEventResponse> =>
  apiPost<CreateEventResponse>(CREATE_EVENT_API_PATH, payload);
