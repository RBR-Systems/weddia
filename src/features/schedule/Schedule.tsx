"use client";
import React, { useEffect, useState, useRef } from "react";
import { App, Spin, Empty, Button, Space, Modal, Radio, InputNumber, Select, Checkbox } from "antd";
import { ClockCircleOutlined, ThunderboltOutlined, CheckCircleOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { TimelineItem, Status } from "./models/schedule.models";
import { sortTimelineItems, formatTime } from "./utils/schedule.utils";
import ScheduleList from "./components/ScheduleList/ScheduleList";
import AddTimelineItemModal from "./components/AddTimelineItemModal/AddTimelineItemModal";
import StatusProgressBar from "./components/StatusProgressBar/StatusProgressBar";
import StatusFilter from "./components/StatusFilter/StatusFilter";
import CurrentTimeIndicator from "./components/CurrentTimeIndicator/CurrentTimeIndicator";
// NOTE: import antd styles globally (e.g. in root layout):
// import 'antd/dist/reset.css';

import pageStyles from "./schedule-page.module.css";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import { fetchTimelineItems, createTimelineItem, updateTimelineItem, deleteTimelineItem } from "./api/scheduleApi";

const Schedule: React.FC = () => {
  const { t } = useTranslation();
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = (selectedEvent as any)?.id ?? 1;
  const { message, notification } = App.useApp();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<TimelineItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineItem | null>(null);
  const [shouldCascadeLocal, setShouldCascadeLocal] = useState(false);

  // Bulk adjustment state
  const [isAdjustModalOpen, setAdjustModalOpen] = useState(false);
  const [direction, setDirection] = useState<"behind" | "ahead" | "on-time">(
    "behind",
  );
  const [adjustmentMinutes, setAdjustmentMinutes] = useState<number | null>(15);
  const [applyFrom, setApplyFrom] = useState<string>("all-remaining");
  const [selectedItemId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);

  // Status management state
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [hideCompleted, setHideCompleted] = useState(false);
  // Filters & search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Refs for current time indicator
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToNowRef = useRef(false);


  useEffect(() => {
    setLoading(true);
    fetchTimelineItems(eventId)
      .then((list) => {
        setItems(sortTimelineItems(list));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Auto-scroll to current time on page load
  useEffect(() => {
    if (!hasScrolledToNowRef.current && !loading && nowIndicatorRef.current) {
      hasScrolledToNowRef.current = true;
      const timer = setTimeout(() => {
        nowIndicatorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 1000); // Delay to ensure DOM is fully rendered
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Function to manually jump to now
  const jumpToNow = () => {
    if (nowIndicatorRef.current) {
      nowIndicatorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      message.info(t("schedule.messages.timeNotInRange"));
    }
  };

  // Setup time alerts (notifies once per item when approaching or missed)
  const setupNotifiedRef = useRef<
    Record<string, { nearing?: boolean; missed?: boolean }>
  >({});

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      items.forEach((item) => {
        if (!item.setup_time) return;
        const setup = new Date(item.setup_time);
        const minutesUntilSetup = (setup.getTime() - now.getTime()) / 60000;

        // Alert 15 minutes before setup time
        if (minutesUntilSetup > 0 && minutesUntilSetup <= 15) {
          if (!setupNotifiedRef.current[item.timeline_item_id]?.nearing) {
            message.info(
              t("schedule.messages.setupBeginsSoon", { title: item.title, minutes: Math.round(minutesUntilSetup) }),
            );
            setupNotifiedRef.current[item.timeline_item_id] = {
              ...(setupNotifiedRef.current[item.timeline_item_id] || {}),
              nearing: true,
            };
          }
        }

        // Alert when setup time has passed within 5 minutes and still pending
        if (
          minutesUntilSetup < 0 &&
          minutesUntilSetup > -5 &&
          item.status === "pending"
        ) {
          if (!setupNotifiedRef.current[item.timeline_item_id]?.missed) {
            message.warning(t("schedule.messages.setupMissed", { title: item.title }));
            setupNotifiedRef.current[item.timeline_item_id] = {
              ...(setupNotifiedRef.current[item.timeline_item_id] || {}),
              missed: true,
            };
          }
        }
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [items]);

  // Handle status change
  function handleStatusChange(itemId: string, newStatus: Status) {
    const item = items.find((i) => i.timeline_item_id === itemId);
    if (!item) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((it) =>
        it.timeline_item_id === itemId
          ? { ...it, status: newStatus, updated_at: new Date().toISOString() }
          : it,
      ),
    );

    // Show success message
    if (newStatus === "completed") {
      message.success({
        content: t("schedule.messages.markedCompleted", { title: item.title }),
        duration: 2,
      });
    } else if (newStatus === "delayed") {
      message.warning({
        content: t("schedule.messages.markedDelayed", { title: item.title }),
        duration: 2,
      });
    } else if (newStatus === "cancelled") {
      message.info({
        content: t("schedule.messages.markedCancelled", { title: item.title }),
        duration: 2,
      });
    } else {
      message.info({
        content: t("schedule.messages.statusUpdated", { title: item.title }),
        duration: 1.5,
      });
    }

    // In a real app, you would call the API here:
    // try {
    //   await updateItemStatus(itemId, newStatus);
    // } catch (error) {
    //   setItems(originalItems);
    //   message.error('Failed to update status');
    // }
  }

  // Filter items based on active filter and hideCompleted
  function getFilteredItems() {
    const q = (searchQuery || "").trim().toLowerCase();
    const filtered = [...items].filter((item) => {
      // Search
      if (q) {
        const matches =
          (item.title || "").toLowerCase().includes(q) ||
          (item.location_name || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.notes || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type))
        return false;

      // Status filter
      if (activeFilter !== "all" && (item.status ?? "pending") !== activeFilter)
        return false;

      // Hide completed
      if (hideCompleted && (item.status ?? "pending") === "completed")
        return false;

      return true;
    });

    return sortTimelineItems(filtered);
  }

  const filteredItems = getFilteredItems();

  const availableTypes = Array.from(new Set(items.map((i) => i.type).filter(Boolean)));

  function clearFilters() {
    setSearchQuery("");
    setSelectedTypes([]);
    setActiveFilter("all");
    setHideCompleted(false);
  }

  function analyzeDeleteImpact(itemToDelete: any) {
    const sorted = sortTimelineItems(items);
    const index = sorted.findIndex(
      (i) => i.timeline_item_id === itemToDelete.timeline_item_id,
    );
    if (index === -1) return { hasGap: false };
    const previousItem = sorted[index - 1];
    const nextItem = sorted[index + 1];
    if (!previousItem || !nextItem) return { hasGap: false };
    const gapStart = new Date(previousItem.end_time).getTime();
    const gapEnd = new Date(nextItem.start_time).getTime();
    const deletedDuration =
      new Date(itemToDelete.end_time).getTime() -
      new Date(itemToDelete.start_time).getTime();
    const gapMs = gapEnd - gapStart - deletedDuration;
    if (gapMs > 0) {
      return {
        hasGap: true,
        gapDurationMs: gapMs,
        gapDurationText: `${Math.round(gapMs / 60000)} min`,
        previousItem,
        nextItem,
        canCascade: true,
      };
    }
    return { hasGap: false };
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
      const index = sorted.findIndex(
        (i) => i.timeline_item_id === item.timeline_item_id,
      );

      let newItems = original.filter(
        (i) => i.timeline_item_id !== item.timeline_item_id,
      );

      if (shouldCascadeLocal && index !== -1) {
        const deletedDuration =
          new Date(item.end_time).getTime() -
          new Date(item.start_time).getTime();
        const shift = -deletedDuration;
        const idsToShift = sorted
          .slice(index + 1)
          .map((i) => i.timeline_item_id);
        newItems = newItems.map((it) =>
          idsToShift.includes(it.timeline_item_id)
            ? {
                ...it,
                start_time: dayjs(it.start_time).add(shift, "ms").format("YYYY-MM-DDTHH:mm:ss"),
                end_time:   dayjs(it.end_time).add(shift, "ms").format("YYYY-MM-DDTHH:mm:ss"),
                setup_time: it.setup_time
                  ? dayjs(it.setup_time).add(shift, "ms").format("YYYY-MM-DDTHH:mm:ss")
                  : it.setup_time,
              }
            : it,
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

  // ----- Bulk adjustment helpers -----
  function calculateNewTime(
    originalTime: string,
    minutes: number,
    dir: string,
  ) {
    const adjustmentMs = minutes * 60000;
    if (dir === "behind") return dayjs(originalTime).add(adjustmentMs, "ms").format("YYYY-MM-DDTHH:mm:ss");
    if (dir === "ahead")  return dayjs(originalTime).subtract(adjustmentMs, "ms").format("YYYY-MM-DDTHH:mm:ss");
    return originalTime;
  }

  function getAffectedItems(applyFromValue: string) {
    const now = new Date();
    const sorted = sortTimelineItems(items);

    switch (applyFromValue) {
      case "all-remaining":
        return sorted.filter(
          (item) =>
            new Date(item.start_time) > now &&
            (item.status ?? "pending") === "pending",
        );
      case "current": {
        const currentItem = sorted.find((item) => {
          const start = new Date(item.start_time);
          const end = new Date(item.end_time);
          return now >= start && now < end;
        });
        if (!currentItem) return [];
        const idx = sorted.indexOf(currentItem);
        return sorted.slice(idx);
      }
      case "next": {
        const nextItem = sorted.find(
          (item) =>
            new Date(item.start_time) > now &&
            (item.status ?? "pending") === "pending",
        );
        if (!nextItem) return [];
        const idx = sorted.indexOf(nextItem);
        return sorted.slice(idx);
      }
      default: {
        const selIdx = sorted.findIndex(
          (item) => item.timeline_item_id === applyFromValue,
        );
        return selIdx >= 0 ? sorted.slice(selIdx) : [];
      }
    }
  }

  async function applyAdjustment() {
    const mins = adjustmentMinutes ?? 0;
    const affected = getAffectedItems(
      applyFrom === "specific" && selectedItemId ? selectedItemId : applyFrom,
    );
    if (!mins || affected.length === 0) return;
    setIsApplying(true);

    const snapshot = {
      timestamp: new Date().toISOString(),
      items: affected.map((it) => ({
        timeline_item_id: it.timeline_item_id,
        start_time: it.start_time,
        end_time: it.end_time,
        setup_time: it.setup_time,
      })),
    };

    try {
      const idSet = new Set(affected.map((a) => a.timeline_item_id));
      const newItems = items.map((it) => {
        if (!idSet.has(it.timeline_item_id)) return it;
        return {
          ...it,
          start_time: calculateNewTime(it.start_time, mins, direction),
          end_time: calculateNewTime(it.end_time, mins, direction),
          setup_time: it.setup_time
            ? calculateNewTime(it.setup_time, mins, direction)
            : it.setup_time,
          updated_at: new Date().toISOString(),
        } as TimelineItem;
      });

      setItems(sortTimelineItems(newItems));
      setAdjustmentHistory((prev) => [snapshot, ...prev].slice(0, 5));

      const key = `adjust-${Date.now()}`;
      notification.open({
        message: t("schedule.messages.timelineAdjusted"),
        description: t("schedule.messages.timelineAdjustedDesc", { count: affected.length, minutes: mins, direction: direction === "behind" ? t("schedule.later") : t("schedule.earlier") }),
        btn: (
          <Button
            type="link"
            onClick={async () => {
              await undoLastAdjustment();
              notification.destroy(key);
            }}
          >
            {t("common.undo")}
          </Button>
        ),
        key,
        duration: 8,
      });

      setAdjustModalOpen(false);
    } catch {
      message.error(t("schedule.messages.adjustFailed"));
    } finally {
      setIsApplying(false);
    }
  }

  async function undoLastAdjustment() {
    if (adjustmentHistory.length === 0) return;
    const last = adjustmentHistory[0];
    const idSet = new Set(last.items.map((i: any) => i.timeline_item_id));
    const restored = items.map((it) =>
      idSet.has(it.timeline_item_id)
        ? {
            ...it,
            ...(last.items.find(
              (x: any) => x.timeline_item_id === it.timeline_item_id,
            ) || {}),
          }
        : it,
    );
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

  if (loading) return <Spin />;
  if (!items.length) return <Empty description={t("schedule.emptyState")} />;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>{t("schedule.title")}</h2>
        <Space>
          <Button
            icon={<ClockCircleOutlined />}
            onClick={jumpToNow}
            title={t("schedule.jumpToNow")}
          >
            {t("schedule.jumpToNow")}
          </Button>
          <Button
            icon={<ClockCircleOutlined />}
            onClick={() => setAdjustModalOpen(true)}
          >
            {t("schedule.adjustTimeline")}
          </Button>
        </Space>
      </div>

      {/* Progress bar */}
      <StatusProgressBar items={items} />

      {/* Status filter */}
      <StatusFilter
        items={items}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        hideCompleted={hideCompleted}
        onHideCompletedChange={setHideCompleted}
        onAddClick={() => setModalVisible(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        types={availableTypes}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        onClearFilters={clearFilters}
        filteredCount={filteredItems.length}
      />

      {/* Timeline list */}
      {filteredItems.length === 0 ? (
        <Empty
          description={t("schedule.noFilteredItems", { status: activeFilter !== "all" ? activeFilter.replace("_", " ") : "" })}
          style={{ marginTop: 24 }}
        />
      ) : (
          <div ref={timelineContainerRef} className={pageStyles.timelineContainer}>
          <CurrentTimeIndicator
            ref={nowIndicatorRef}
            items={items}
            containerRef={timelineContainerRef}
          />
          <ScheduleList
            items={filteredItems}
            onEdit={(item) => setEditItem(item)}
            onDelete={handleDeleteRequest}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      <Modal
        open={isAdjustModalOpen}
        title={t("schedule.adjustModal.title")}
        onCancel={() => setAdjustModalOpen(false)}
        footer={null}
      >
          <div className={pageStyles.modalSection}>
            <div className={pageStyles.modalSectionLabel}>{t("schedule.adjustModal.timelineRunning")}</div>
          <Radio.Group
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <Radio value="behind">
              <ClockCircleOutlined className={pageStyles.radioIconMargin} />
              {t("schedule.adjustModal.behind")}
            </Radio>
            <Radio value="ahead" className={pageStyles.radioSpacing}>
              <ThunderboltOutlined className={pageStyles.radioIconMargin} />
              {t("schedule.adjustModal.ahead")}
            </Radio>
            <Radio value="on-time" className={pageStyles.radioSpacing}>
              <CheckCircleOutlined className={pageStyles.radioIconMargin} />
              {t("schedule.adjustModal.onTime")}
            </Radio>
          </Radio.Group>
        </div>

        <div className={pageStyles.modalSection}>
          <div className={pageStyles.modalSectionLabel}>{t("schedule.adjustModal.adjustByMinutes")}</div>
          <InputNumber
            min={0}
            max={180}
            step={5}
            value={adjustmentMinutes ?? undefined}
            onChange={(v) => setAdjustmentMinutes(v as number)}
          />
          <div className={pageStyles.quickMinuteWrap}>
            {[5, 10, 15, 20, 30, 45, 60].map((m) => (
              <Button
                key={m}
                size="small"
                className={pageStyles.quickMinuteBtn}
                onClick={() => setAdjustmentMinutes(m)}
              >
                {t("schedule.adjustModal.minuteShort", { count: m })}
              </Button>
            ))}
          </div>
        </div>

        <div className={pageStyles.modalSection}>
          <div className={pageStyles.modalSectionLabel}>{t("schedule.adjustModal.applyTo")}</div>
          <Select
            value={applyFrom}
            onChange={(v) => setApplyFrom(v)}
            className={pageStyles.fullWidth}
          >
            <Select.Option value="all-remaining">
              {t("schedule.adjustModal.allRemaining")}
            </Select.Option>
            <Select.Option value="current">
              {t("schedule.adjustModal.fromCurrent")}
            </Select.Option>
            <Select.Option value="next">
              {t("schedule.adjustModal.fromNext")}
            </Select.Option>
            {items.map((it) => (
              <Select.Option
                key={it.timeline_item_id}
                value={it.timeline_item_id}
              >{t("schedule.adjustModal.fromSpecific", { title: it.title })}</Select.Option>
            ))}
          </Select>
        </div>

        <div className={pageStyles.modalSection}>
          <div className={pageStyles.previewHeader}>
            <div>
              <strong>{t("schedule.adjustModal.previewChanges")}</strong>
            </div>
            <div className={pageStyles.previewCount}>
              {t("schedule.adjustModal.itemsWillUpdate", { count:
                getAffectedItems(
                  applyFrom === "specific" && selectedItemId
                    ? selectedItemId
                    : applyFrom,
                ).length
              })}
            </div>
          </div>

          <div>
            {getAffectedItems(
              applyFrom === "specific" && selectedItemId
                ? selectedItemId
                : applyFrom,
            ).slice(0, 5).map((item: any) => (
              <div key={item.timeline_item_id} className={pageStyles.previewListItem}>
                <div>{item.title}</div>
                <div className={pageStyles.previewTimeShift}>
                  {formatTime(item.start_time)} <RightOutlined />{" "}
                  {formatTime(
                    calculateNewTime(
                      item.start_time,
                      adjustmentMinutes ?? 0,
                      direction,
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={pageStyles.modalFooter}>
          <Button onClick={() => setAdjustModalOpen(false)}>{t("common.cancel")}</Button>
          <Button
            type="primary"
            onClick={applyAdjustment}
            loading={isApplying}
            disabled={!adjustmentMinutes}
          >
            {t("schedule.adjustModal.applyChanges")}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title={deleteTarget ? t("schedule.deleteModal.title", { title: deleteTarget.title }) : t("schedule.deleteModal.titleFallback")}
        onOk={confirmDelete}
        onCancel={closeDeleteModal}
        okText={t("common.delete")}
        okType="danger"
      >
        {deleteTarget && (
          <div>
            <div className={pageStyles.deleteModalTime}>
              {formatTime(deleteTarget.start_time)} -{" "}
              {formatTime(deleteTarget.end_time)}
            </div>

            {analyzeDeleteImpact(deleteTarget).hasGap && (
              <div className={pageStyles.deleteModalGap}>
                {t("schedule.deleteModal.gapWarning", {
                  gap: analyzeDeleteImpact(deleteTarget).gapDurationText,
                  prev: analyzeDeleteImpact(deleteTarget)?.previousItem?.title,
                  next: analyzeDeleteImpact(deleteTarget)?.nextItem?.title,
                })}
              </div>
            )}

            {analyzeDeleteImpact(deleteTarget).canCascade && (
              <div className={pageStyles.deleteModalCascade}>
                <Checkbox
                  checked={shouldCascadeLocal}
                  onChange={(e) => setShouldCascadeLocal(e.target.checked)}
                >
                  {t("schedule.deleteModal.cascadeShift")}
                </Checkbox>
              </div>
            )}
          </div>
        )}
      </Modal>

      <AddTimelineItemModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        eventId={eventId}
        onAdd={handleAddItem}
      />

      {/* Edit modal (reuses same component) */}
      <AddTimelineItemModal
        visible={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        eventId={eventId}
        initialData={editItem ?? undefined}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default Schedule;


