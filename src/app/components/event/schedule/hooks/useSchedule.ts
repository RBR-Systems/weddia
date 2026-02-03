import { useEffect, useState } from 'react';
import { TimelineItem } from '../models';
import timelineData from '../../../../data/timeline-data.json';

export function useSchedule() {
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const raw: any = timelineData;
    const list = Array.isArray(raw?.timeline_items) ? raw.timeline_items : [];
    setItems(list);
  }, []);

  return { items };
}

export default useSchedule;
