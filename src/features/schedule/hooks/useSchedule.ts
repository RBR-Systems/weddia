import { useEffect, useRef, useState } from "react";
import { App } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { TimelineItem, Status } from "../models/schedule.models";
import { sortTimelineItems, getEffectiveStatus } from "../utils/schedule.utils";
import {
  fetchTimelineItems,
  createTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
} from "../api/scheduleApi";

interface AdjustmentSnapshot {
  timestamp: string;
  items: Pick<TimelineItem, "timeline_item_id" | "start_time" | "end_time" | "setup_time">[];
}

export interface AdjustmentResult {
  count: number;
  minutes: number;
  direction: string;
}

export function calculateNewTime(originalTime: string, minutes: number, dir: string) {
  const ms = minutes * 60000;
  if (dir === "behind") return dayjs(originalTime).add(ms, "ms").format("YYYY-MM-DDTHH:mm:ss");
  if (dir === "ahead") return dayjs(originalTime).subtract(ms, "ms").format("YYYY-MM-DDTHH:mm:ss");
  return originalTime;
}

export function useSchedule(eventId: number) {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<TimelineItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineItem | null>(null);
  const [shouldCascadeLocal, setShouldCascadeLocal] = useState(false);
  const [isAdjustModalOpen, setAdjustModalOpen] = useState(false);
  const [direction, setDirection] = useState<"behind" | "ahead" | "on-time">("behind");
  const [adjustmentMinutes, setAdjustmentMinutes] = useState<number | null>(15);
  const [applyFrom, setApplyFrom] = useState("all-remaining");
  const [isApplying, setIsApplying] = useState(false);
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentSnapshot[]>([]);
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToNowRef = useRef(false);
  const setupNotifiedRef = useRef<Record<string, { nearing?: boolean; missed?: boolean }>>({});

  useEffect(() => {
    setLoading(true);
    fetchTimelineItems(eventId)
      .then((list) => setItems(sortTimelineItems(list)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!hasScrolledToNowRef.current && !loading && nowIndicatorRef.current) {
      hasScrolledToNowRef.current = true;
      const timer = setTimeout(() => {
        nowIndicatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      items.forEach((item) => {
        if (!item.setup_time) return;
        const minutesUntilSetup = (new Date(item.setup_time).getTime() - now.getTime()) / 60000;

        if (minutesUntilSetup > 0 && minutesUntilSetup <= 15 && !setupNotifiedRef.current[item.timeline_item_id]?.nearing) {
          message.info(t("schedule.messages.setupBeginsSoon", { title: item.title, minutes: Math.round(minutesUntilSetup) }));
          setupNotifiedRef.current[item.timeline_item_id] = { ...setupNotifiedRef.current[item.timeline_item_id], nearing: true };
        }

        if (minutesUntilSetup < 0 && minutesUntilSetup > -5 && item.status === "pending" && !setupNotifiedRef.current[item.timeline_item_id]?.missed) {
          message.warning(t("schedule.messages.setupMissed", { title: item.title }));
          setupNotifiedRef.current[item.timeline_item_id] = { ...setupNotifiedRef.current[item.timeline_item_id], missed: true };
        }
      });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [items, message, t]);

  function jumpToNow() {
    if (nowIndicatorRef.current) {
      nowIndicatorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      message.info(t("schedule.messages.timeNotInRange"));
    }
  }

  function handleStatusChange(itemId: string, newStatus: Status) {
    const item = items.find((i) => i.timeline_item_id === itemId);
    if (!item) return;
    const updated = { ...item, status: newStatus, updated_at: new Date().toISOString() };
    setItems((prev) => prev.map((it) => it.timeline_item_id === itemId ? updated : it));
    updateTimelineItem(itemId, updated).catch((err) => {
      console.error("handleStatusChange: failed to persist", err);
      setItems((prev) => prev.map((it) => it.timeline_item_id === itemId ? item : it));
    });
    if (newStatus === "completed") {
      message.success({ content: t("schedule.messages.markedCompleted", { title: item.title }), duration: 2 });
    } else if (newStatus === "delayed") {
      message.warning({ content: t("schedule.messages.markedDelayed", { title: item.title }), duration: 2 });
    } else if (newStatus === "cancelled") {
      message.info({ content: t("schedule.messages.markedCancelled", { title: item.title }), duration: 2 });
    } else {
      message.info({ content: t("schedule.messages.statusUpdated", { title: item.title }), duration: 1.5 });
    }
  }

  function getFilteredItems() {
    const q = (searchQuery || "").trim().toLowerCase();
    return sortTimelineItems(
      items.filter((item) => {
        if (q && !((item.title || "").toLowerCase().includes(q) ||
          (item.location_name || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.notes || "").toLowerCase().includes(q))) return false;
        if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) return false;
        const effectiveStatus = getEffectiveStatus(item);
        if (activeFilter !== "all" && effectiveStatus !== activeFilter) return false;
        if (hideCompleted && effectiveStatus === "completed") return false;
        return true;
      })
    );
  }

  const filteredItems = getFilteredItems();
  const availableTypes = Array.from(new Set(items.map((i) => i.type).filter(Boolean)));

  function clearFilters() {
    setSearchQuery("");
    setSelectedTypes([]);
    setActiveFilter("all");
    setHideCompleted(false);
  }

  function analyzeDeleteImpact(itemToDelete: TimelineItem) {
    const sorted = sortTimelineItems(items);
    const index = sorted.findIndex((i) => i.timeline_item_id === itemToDelete.timeline_item_id);
    if (index === -1) return { hasGap: false as const };
    const previousItem = sorted[index - 1];
    const nextItem = sorted[index + 1];
    if (!previousItem || !nextItem) return { hasGap: false as const };
    const gapMs =
      new Date(nextItem.start_time).getTime() -
      new Date(previousItem.end_time).getTime() -
      (new Date(itemToDelete.end_time).getTime() - new Date(itemToDelete.start_time).getTime());
    if (gapMs > 0) {
      return { hasGap: true as const, gapDurationText: `${Math.round(gapMs / 60000)} min`, previousItem, nextItem, canCascade: true as const };
    }
    return { hasGap: false as const };
  }

  function handleDeleteRequest(itemId: string) {
    const item = items.find((i) => i.timeline_item_id === itemId);
    if (!item) return;
    setDeleteTarget(item);
    setShouldCascadeLocal(false);
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setShouldCascadeLocal(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const item = deleteTarget;
    const original = [...items];
    try {
      const sorted = sortTimelineItems(original);
      const index = sorted.findIndex((i) => i.timeline_item_id === item.timeline_item_id);
      let newItems = original.filter((i) => i.timeline_item_id !== item.timeline_item_id);
      if (shouldCascadeLocal && index !== -1) {
        const shift = -(new Date(item.end_time).getTime() - new Date(item.start_time).getTime());
        const idsToShift = new Set(sorted.slice(index + 1).map((i) => i.timeline_item_id));
        newItems = newItems.map((it) =>
          idsToShift.has(it.timeline_item_id)
            ? {
                ...it,
                start_time: dayjs(it.start_time).add(shift, "ms").format("YYYY-MM-DDTHH:mm:ss"),
                end_time: dayjs(it.end_time).add(shift, "ms").format("YYYY-MM-DDTHH:mm:ss"),
                setup_time: it.setup_time ? dayjs(it.setup_time).add(shift, "ms").format("YYYY-MM-DDTHH:mm:ss") : it.setup_time,
              }
            : it
        );
      }
      setItems(sortTimelineItems(newItems));
      message.success(t("schedule.messages.itemDeleted", { title: item.title }));
      deleteTimelineItem(item.timeline_item_id).catch(console.error);
    } catch {
      setItems(original);
      message.error(t("schedule.messages.deleteFailed"));
    } finally {
      closeDeleteModal();
    }
  }

  function getAffectedItems(applyFromValue: string) {
    const now = new Date();
    const sorted = sortTimelineItems(items);
    switch (applyFromValue) {
      case "all-remaining":
        return sorted.filter((item) => new Date(item.start_time) > now && (item.status ?? "pending") === "pending");
      case "current": {
        const cur = sorted.find((item) => now >= new Date(item.start_time) && now < new Date(item.end_time));
        return cur ? sorted.slice(sorted.indexOf(cur)) : [];
      }
      case "next": {
        const next = sorted.find((item) => new Date(item.start_time) > now && (item.status ?? "pending") === "pending");
        return next ? sorted.slice(sorted.indexOf(next)) : [];
      }
      default: {
        const idx = sorted.findIndex((item) => item.timeline_item_id === applyFromValue);
        return idx >= 0 ? sorted.slice(idx) : [];
      }
    }
  }

  async function applyAdjustment(): Promise<AdjustmentResult | null> {
    const mins = adjustmentMinutes ?? 0;
    const affected = getAffectedItems(applyFrom);
    if (!mins || affected.length === 0) return null;
    setIsApplying(true);
    const snapshot: AdjustmentSnapshot = {
      timestamp: new Date().toISOString(),
      items: affected.map(({ timeline_item_id, start_time, end_time, setup_time }) => ({
        timeline_item_id, start_time, end_time, setup_time,
      })),
    };
    try {
      const idSet = new Set(affected.map((a) => a.timeline_item_id));
      const newItems = items.map((it) =>
        idSet.has(it.timeline_item_id)
          ? {
              ...it,
              start_time: calculateNewTime(it.start_time, mins, direction),
              end_time: calculateNewTime(it.end_time, mins, direction),
              setup_time: it.setup_time ? calculateNewTime(it.setup_time, mins, direction) : it.setup_time,
              updated_at: new Date().toISOString(),
            }
          : it
      );
      setItems(sortTimelineItems(newItems));
      setAdjustmentHistory((prev) => [snapshot, ...prev].slice(0, 5));
      setAdjustModalOpen(false);
      return { count: affected.length, minutes: mins, direction };
    } catch {
      message.error(t("schedule.messages.adjustFailed"));
      return null;
    } finally {
      setIsApplying(false);
    }
  }

  async function undoLastAdjustment() {
    if (adjustmentHistory.length === 0) return;
    const last = adjustmentHistory[0];
    const idSet = new Set(last.items.map((i) => i.timeline_item_id));
    const restored = items.map((it) => {
      const snap = last.items.find((x) => x.timeline_item_id === it.timeline_item_id);
      return idSet.has(it.timeline_item_id) && snap ? { ...it, ...snap } : it;
    });
    setItems(sortTimelineItems(restored));
    setAdjustmentHistory((prev) => prev.slice(1));
    message.success(t("schedule.messages.adjustmentUndone"));
  }

  function replaceItemInList(prev: TimelineItem[], updated: TimelineItem): TimelineItem[] {
    return sortTimelineItems(prev.map((it) => (it.timeline_item_id === updated.timeline_item_id ? updated : it)));
  }

  function handleAddItem(item: TimelineItem) {
    setItems((prev) => sortTimelineItems([...prev, item]));
    setModalVisible(false);
    createTimelineItem(Number(eventId), item)
      .then((saved) => setItems((prev) => replaceItemInList(prev, saved)))
      .catch((err) => console.error("createTimelineItem failed:", err));
  }

  function handleSaveItem(updated: TimelineItem) {
    setItems((prev) => replaceItemInList(prev, updated));
    setEditItem(null);
    updateTimelineItem(updated.timeline_item_id, updated)
      .then((saved) => setItems((prev) => replaceItemInList(prev, saved)))
      .catch((err) => console.error("updateTimelineItem failed:", err));
  }

  return {
    items,
    loading,
    filteredItems,
    availableTypes,
    nowIndicatorRef,
    timelineContainerRef,
    isModalVisible,
    setModalVisible,
    editItem,
    setEditItem,
    deleteTarget,
    shouldCascadeLocal,
    setShouldCascadeLocal,
    handleDeleteRequest,
    closeDeleteModal,
    confirmDelete,
    analyzeDeleteImpact,
    isAdjustModalOpen,
    setAdjustModalOpen,
    direction,
    setDirection,
    adjustmentMinutes,
    setAdjustmentMinutes,
    applyFrom,
    setApplyFrom,
    isApplying,
    getAffectedItems,
    calculateNewTime,
    applyAdjustment,
    undoLastAdjustment,
    activeFilter,
    setActiveFilter,
    hideCompleted,
    setHideCompleted,
    searchQuery,
    setSearchQuery,
    selectedTypes,
    setSelectedTypes,
    clearFilters,
    jumpToNow,
    handleStatusChange,
    handleAddItem,
    handleSaveItem,
  };
}

export default useSchedule;
