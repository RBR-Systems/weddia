import { useEffect, useState } from 'react';
import { TimelineItem } from '../models/types';
import { fetchTimelineItems } from '../services/schedule.service';

export function useSchedule(eventId: number = 1) {
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    fetchTimelineItems(eventId).then(setItems).catch(() => setItems([]));
  }, [eventId]);

  return { items };
}

export default useSchedule;
