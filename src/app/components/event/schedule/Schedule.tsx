"use client";

import React, { useEffect, useState } from "react";
import { Spin, Empty, Button, Space, Modal, message } from "antd";
import { Checkbox } from "antd";
import { TimelineItem, Status } from "./models/types";
import { sortTimelineItems, formatTime } from "./utils/helpers";
import ScheduleList from "./components/ScheduleList";
import AddTimelineItemModal from "./components/AddTimelineItemModal";
import StatusProgressBar from "./components/StatusProgressBar";
import StatusFilter from "./components/StatusFilter";
// NOTE: import antd styles globally (e.g. in root layout):
// import 'antd/dist/reset.css';

import timelineData from "../../../../data/timeline-data.json";

const Schedule: React.FC = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<TimelineItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineItem | null>(null);
  const [shouldCascadeLocal, setShouldCascadeLocal] = useState(false);

  // Status management state
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [hideCompleted, setHideCompleted] = useState(false);

  const eventId = "demo-event-id"; // TODO: Replace with actual eventId from context/props

  useEffect(() => {
    const raw: any = timelineData;
    const list = Array.isArray(raw?.timeline_items) ? raw.timeline_items : [];
    // Ensure all items have a status field
    const itemsWithStatus = list.map((item: any) => ({
      ...item,
      status: item.status || "pending",
    }));
    setItems(sortTimelineItems(itemsWithStatus));
    setLoading(false);
  }, []);

  // Handle status change
  function handleStatusChange(itemId: string, newStatus: Status) {
    const item = items.find((i) => i.timeline_item_id === itemId);
    if (!item) return;

    // Optimistic update
    const originalItems = [...items];
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
        content: `"${item.title}" marked as completed`,
        duration: 2,
      });
    } else if (newStatus === "delayed") {
      message.warning({
        content: `"${item.title}" marked as delayed`,
        duration: 2,
      });
    } else if (newStatus === "cancelled") {
      message.info({
        content: `"${item.title}" cancelled`,
        duration: 2,
      });
    } else {
      message.info({
        content: `Status updated to ${newStatus.replace("_", " ")}`,
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
    let filtered = [...items];

    if (activeFilter !== "all") {
      filtered = filtered.filter(
        (item) => (item.status ?? "pending") === activeFilter,
      );
    }

    if (hideCompleted) {
      filtered = filtered.filter(
        (item) => (item.status ?? "pending") !== "completed",
      );
    }

    return sortTimelineItems(filtered);
  }

  const filteredItems = getFilteredItems();

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
                start_time: new Date(
                  new Date(it.start_time).getTime() + shift,
                ).toISOString(),
                end_time: new Date(
                  new Date(it.end_time).getTime() + shift,
                ).toISOString(),
                setup_time: it.setup_time
                  ? new Date(
                      new Date(it.setup_time).getTime() + shift,
                    ).toISOString()
                  : it.setup_time,
              }
            : it,
        );
      }

      setItems(sortTimelineItems(newItems));
      message.success(`"${item.title}" deleted`);
    } catch (err) {
      setItems(original);
      message.error("Failed to delete item");
    } finally {
      closeDeleteModal();
    }
  }

  if (loading) return <Spin />;
  if (!items.length) return <Empty description="No timeline items" />;

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
        <h2 style={{ margin: 0 }}>Schedule</h2>
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
      />

      {/* Timeline list */}
      {filteredItems.length === 0 ? (
        <Empty
          description={`No ${activeFilter !== "all" ? activeFilter.replace("_", " ") : ""} items found`}
          style={{ marginTop: 24 }}
        />
      ) : (
        <ScheduleList
          items={filteredItems}
          onEdit={(item) => setEditItem(item)}
          onDelete={handleDeleteRequest}
          onStatusChange={handleStatusChange}
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : "Delete item"}
        onOk={confirmDelete}
        onCancel={closeDeleteModal}
        okText="Delete"
        okType="danger"
      >
        {deleteTarget && (
          <div>
            <div style={{ marginBottom: 8 }}>
              {formatTime(deleteTarget.start_time)} -{" "}
              {formatTime(deleteTarget.end_time)}
            </div>

            {analyzeDeleteImpact(deleteTarget).hasGap && (
              <div style={{ marginBottom: 8 }}>
                This will create a gap of{" "}
                {analyzeDeleteImpact(deleteTarget).gapDurationText} between "
                {analyzeDeleteImpact(deleteTarget)?.previousItem?.title}" and "
                {analyzeDeleteImpact(deleteTarget)?.nextItem?.title}".
              </div>
            )}

            {analyzeDeleteImpact(deleteTarget).canCascade && (
              <div style={{ marginTop: 8 }}>
                <Checkbox
                  checked={shouldCascadeLocal}
                  onChange={(e) => setShouldCascadeLocal(e.target.checked)}
                >
                  Shift following items earlier to close the gap
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
        onAdd={(item: any) => {
          setItems((prev) => sortTimelineItems([...prev, item]));
          setModalVisible(false);
        }}
      />

      {/* Edit modal (reuses same component) */}
      <AddTimelineItemModal
        visible={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        eventId={eventId}
        initialData={editItem ?? undefined}
        onSave={(updated) => {
          setItems((prev) => {
            const copy = prev.map((it) =>
              it.timeline_item_id === updated.timeline_item_id ? updated : it,
            );
            return sortTimelineItems(copy);
          });
          setEditItem(null);
        }}
      />
    </div>
  );
};

export default Schedule;
