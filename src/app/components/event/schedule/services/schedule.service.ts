import { TimelineItem } from '../models';
import timelineData from '../../../../data/timeline-data.json';

export async function fetchTimelineItems(): Promise<TimelineItem[]> {
  // Placeholder implementation that reads from local fixture during development.
  const raw: any = timelineData;
  return Array.isArray(raw?.timeline_items) ? raw.timeline_items : [];
}

export default { fetchTimelineItems };
