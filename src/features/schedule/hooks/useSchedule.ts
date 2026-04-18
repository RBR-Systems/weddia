import { useEffect, useState } from 'react';
import { TimelineItem } from '../models/schedule.models';
import { fetchTimelineItems } from '../api/scheduleApi';

export function useSchedule(eventId: number = 1) {
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    fetchTimelineItems(eventId).then(setItems).catch(() => setItems([]));
  }, [eventId]);

  return { items };
}

export default useSchedule;
