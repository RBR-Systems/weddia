export type Status =
  | "pending"
  | "in_progress"
  | "completed"
  | "delayed"
  | "cancelled";

export interface TimelineItem {
  timeline_item_id: string;
  event_id: string;
  title: string;
  type: string;
  location_name?: string | null;
  location_address?: string | null;
  description?: string | null;
  notes?: string | null;
  guests_description?: string | null;
  start_time: string;
  end_time: string;
  setup_time?: string | null;
  status?: Status;
  created_at?: string;
  updated_at?: string;
}

export type TimelineItems = TimelineItem[];
