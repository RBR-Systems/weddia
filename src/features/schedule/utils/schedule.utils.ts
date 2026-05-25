import { TimelineItem, Status } from "../models/schedule.models";
import i18next from "i18next";

export const getStatusOptions = () => ({
  pending: {
    value: "pending",
    label: i18next.t("schedule.status.pending"),
    icon: "",
    color: "#95A5A6",
    description: i18next.t("schedule.statusDesc.pending"),
  },
  in_progress: {
    value: "in_progress",
    label: i18next.t("schedule.status.inProgress"),
    icon: "",
    color: "#3498DB",
    description: i18next.t("schedule.statusDesc.inProgress"),
  },
  completed: {
    value: "completed",
    label: i18next.t("schedule.status.completed"),
    icon: "",
    color: "#27AE60",
    description: i18next.t("schedule.statusDesc.completed"),
  },
  delayed: {
    value: "delayed",
    label: i18next.t("schedule.status.delayed"),
    icon: "",
    color: "#E67E22",
    description: i18next.t("schedule.statusDesc.delayed"),
  },
  cancelled: {
    value: "cancelled",
    label: i18next.t("schedule.status.cancelled"),
    icon: "",
    color: "#E74C3C",
    description: i18next.t("schedule.statusDesc.cancelled"),
  },
});

export function getEffectiveStatus(item: TimelineItem, nowMs = Date.now()): Status {
  const rawStatus = item.status ?? "pending";
  if (rawStatus !== "pending") return rawStatus;
  const startMs = new Date(item.start_time).getTime();
  const endMs = new Date(item.end_time).getTime();
  if (nowMs > endMs) return "completed";
  if (nowMs >= startMs) return "in_progress";
  return "pending";
}

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
  if (!timestamp) return i18next.t("schedule.duration.invalidTime");
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return i18next.t("schedule.duration.invalidTime");

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

  if (diffMins < 60) return i18next.t(diffMins === 1 ? "schedule.duration.minute" : "schedule.duration.minutes", { count: diffMins });
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (mins === 0) return i18next.t(hours === 1 ? "schedule.duration.hour" : "schedule.duration.hours", { count: hours });
  return `${i18next.t(hours === 1 ? "schedule.duration.hour" : "schedule.duration.hours", { count: hours })} ${i18next.t(mins === 1 ? "schedule.duration.minute" : "schedule.duration.minutes", { count: mins })}`;
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

export function calculateSetupDuration(item: TimelineItem) {
  if (!item.setup_time) return null;
  const setup = new Date(item.setup_time);
  const start = new Date(item.start_time);
  if (Number.isNaN(setup.getTime()) || Number.isNaN(start.getTime()))
    return null;
  const diffMs = start.getTime() - setup.getTime();
  if (diffMs <= 0) return null;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return i18next.t(diffMins === 1 ? "schedule.duration.minute" : "schedule.duration.minutes", { count: diffMins });
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (mins === 0) return i18next.t(hours === 1 ? "schedule.duration.hour" : "schedule.duration.hours", { count: hours });
  return `${i18next.t(hours === 1 ? "schedule.duration.hour" : "schedule.duration.hours", { count: hours })} ${i18next.t(mins === 1 ? "schedule.duration.minute" : "schedule.duration.minutes", { count: mins })}`;
}

export function suggestSetupTime(activityType: string) {
  const suggestions: Record<string, number> = {
    ceremony: 30,
    reception: 60,
    photos: 15,
    meal_service: 45,
    special_moment: 10,
    vendor_setup: 30,
  };
  return suggestions[activityType] ?? 15;
}

export function calculateSetupTime(startTime: string, minutesBefore: number) {
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return null;
  const setup = new Date(start.getTime() - minutesBefore * 60000);
  return setup.toISOString();
}
