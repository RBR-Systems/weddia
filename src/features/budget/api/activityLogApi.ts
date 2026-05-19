import { apiGet, apiPost } from "@/shared/api/apiClient";
import type { ActivityItem } from "../models/budget.models";

interface ActivityLogApiRow {
  id: string;
  type: string;
  description: string;
  amount?: number | null;
  timestamp: string;
}

export async function fetchActivities(eventId: number): Promise<ActivityItem[]> {
  const rows = await apiGet<ActivityLogApiRow[]>(`/api/budget-activity-log/event/${eventId}`);
  return (rows ?? []).map((row) => ({
    id: row.id,
    type: row.type as ActivityItem["type"],
    description: row.description,
    amount: row.amount ?? undefined,
    timestamp: row.timestamp,
  }));
}

export async function insertActivity(
  eventId: number,
  activity: ActivityItem,
): Promise<void> {
  await apiPost(`/api/budget-activity-log/event/${eventId}`, {
    id: activity.id,
    type: activity.type,
    description: activity.description,
    amount: activity.amount ?? null,
    timestamp: activity.timestamp,
  });
}
