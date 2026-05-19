import { supabase } from "@/shared/lib/supabaseClient";
import type { ActivityItem } from "../models/budget.models";

const db = supabase.schema("event_planner");

export async function fetchActivities(eventId: number): Promise<ActivityItem[]> {
  const { data, error } = await db
    .from("budget_activity_log")
    .select("id, type, description, amount, timestamp")
    .eq("event_id", eventId)
    .order("timestamp", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
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
  const { error } = await db.from("budget_activity_log").insert({
    id: activity.id,
    event_id: eventId,
    type: activity.type,
    description: activity.description,
    amount: activity.amount ?? null,
    timestamp: activity.timestamp,
  });

  if (error) console.error("insertActivity failed:", error.message);
}
