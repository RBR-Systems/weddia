import { TimelineItem } from "../models/types";

export const STATUS_OPTIONS = {
  pending: {
    value: "pending",
    label: "Pending",
    icon: "",
    color: "#95A5A6",
    description: "Not yet started",
  },
  in_progress: {
    value: "in_progress",
    label: "In Progress",
    icon: "",
    color: "#3498DB",
    description: "Currently happening",
  },
  completed: {
    value: "completed",
    label: "Completed",
    icon: "",
    color: "#27AE60",
    description: "Finished successfully",
  },
  delayed: {
    value: "delayed",
    label: "Delayed",
    icon: "",
    color: "#E67E22",
    description: "Running behind schedule",
  },
  cancelled: {
    value: "cancelled",
    label: "Cancelled",
    icon: "",
    color: "#E74C3C",
    description: "Will not happen",
  },
} as const;

export function calculateProgress(items: TimelineItem[]) {
  const total = items.length;
  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    const s = item.status ?? "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const completed = statusCounts.completed || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending: statusCounts.pending || 0,
    in_progress: statusCounts.in_progress || 0,
    delayed: statusCounts.delayed || 0,
    cancelled: statusCounts.cancelled || 0,
    completion_percentage: percentage,
  };
}

export function formatTime(timestamp: string, use24Hour = false) {
  if (!timestamp) return "Invalid time";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Invalid time";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: !use24Hour,
  });
}

export function calculateDuration(item: TimelineItem) {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
}

export function sortTimelineItems(items: TimelineItem[]) {
  return [...items].sort((a, b) => {
    const tA = new Date(a.start_time).getTime();
    const tB = new Date(b.start_time).getTime();
    return tA - tB;
  });
}

export function getFilteredItems(
  items: TimelineItem[],
  filter: string,
  hideCompleted: boolean,
) {
  let filtered = [...items];

  if (filter !== "all") {
    filtered = filtered.filter((item) => (item.status ?? "pending") === filter);
  }

  if (hideCompleted) {
    filtered = filtered.filter(
      (item) => (item.status ?? "pending") !== "completed",
    );
  }

  return filtered;
}
