import type { TimelineItem } from "../models/schedule.models";

/**
 * Creates a fully-typed TimelineItem with all defaults applied.
 * Pass overrides for only the fields you care about.
 *
 * @example
 * // Production
 * createTimelineItem({ timeline_item_id: id, event_id, title, type, start_time, end_time })
 *
 * // Test
 * const item = createTimelineItem({ status: "delayed", title: "Ceremony" });
 */
export function createTimelineItem(overrides: Partial<TimelineItem> = {}): TimelineItem {
  const now = new Date().toISOString();
  return {
    timeline_item_id: "",
    event_id: "",
    title: "",
    type: "",
    location_name: null,
    location_address: null,
    description: null,
    notes: null,
    guests_description: null,
    start_time: "",
    end_time: "",
    setup_time: null,
    status: "pending",
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}
