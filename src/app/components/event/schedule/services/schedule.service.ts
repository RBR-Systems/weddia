import { TimelineItem, Status } from "../models/types";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/apiClient";

interface ApiTimelineItem {
  timelineItemId: number;
  eventId: number;
  title: string;
  itemType: string;
  locationName?: string | null;
  locationAddress?: string | null;
  description?: string | null;
  notes?: string | null;
  guestsDescription?: string | null;
  startTime: string;
  endTime: string;
  setupTime?: string | null;
  status: number;
}

function mapStatus(n: number): Status {
  switch (n) {
    case 2: return "in_progress";
    case 3: return "completed";
    case 4: return "delayed";
    case 5: return "cancelled";
    default: return "pending";
  }
}

function mapApiItem(item: ApiTimelineItem): TimelineItem {
  return {
    timeline_item_id: String(item.timelineItemId),
    event_id: String(item.eventId),
    title: item.title,
    type: item.itemType,
    location_name: item.locationName ?? null,
    location_address: item.locationAddress ?? null,
    description: item.description ?? null,
    notes: item.notes ?? null,
    guests_description: item.guestsDescription ?? null,
    start_time: item.startTime,
    end_time: item.endTime,
    setup_time: item.setupTime ?? null,
    status: mapStatus(item.status),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchTimelineItems(eventId: number): Promise<TimelineItem[]> {
  try {
    const raw = await apiGet<ApiTimelineItem[]>(`/api/eventtimelineitems/event/${eventId}`);
    return Array.isArray(raw) ? raw.map(mapApiItem) : [];
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    console.error("fetchTimelineItems error", err);
    return [];
  }
}

export async function createTimelineItem(
  eventId: number,
  item: Omit<TimelineItem, "timeline_item_id" | "event_id" | "created_at" | "updated_at">,
): Promise<TimelineItem> {
  const body = {
    eventId,
    title: item.title,
    itemType: item.type,
    locationName: item.location_name,
    locationAddress: item.location_address,
    description: item.description,
    notes: item.notes,
    guestsDescription: item.guests_description,
    startTime: item.start_time,
    endTime: item.end_time,
    setupTime: item.setup_time,
    status: 1,
  };
  const created = await apiPost<ApiTimelineItem>(`/api/eventtimelineitems?adminId=1`, body);
  return mapApiItem(created);
}

export async function updateTimelineItem(
  id: string,
  item: Partial<TimelineItem>,
): Promise<TimelineItem> {
  const statusMap: Record<string, number> = {
    pending: 1, in_progress: 2, completed: 3, delayed: 4, cancelled: 5,
  };
  const body: Record<string, unknown> = {};
  if (item.title) body.title = item.title;
  if (item.type) body.itemType = item.type;
  if (item.location_name !== undefined) body.locationName = item.location_name;
  if (item.location_address !== undefined) body.locationAddress = item.location_address;
  if (item.description !== undefined) body.description = item.description;
  if (item.notes !== undefined) body.notes = item.notes;
  if (item.start_time) body.startTime = item.start_time;
  if (item.end_time) body.endTime = item.end_time;
  if (item.setup_time !== undefined) body.setupTime = item.setup_time;
  if (item.status) body.status = statusMap[item.status] ?? 1;
  if (item.event_id) body.eventId = Number(item.event_id);

  const updated = await apiPut<ApiTimelineItem>(`/api/eventtimelineitems/${id}?adminId=1`, body);
  return mapApiItem(updated);
}

export async function deleteTimelineItem(id: string): Promise<void> {
  await apiDelete(`/api/eventtimelineitems/${id}`);
}

export default { fetchTimelineItems, createTimelineItem, updateTimelineItem, deleteTimelineItem };
