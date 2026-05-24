"use client";
import React from "react";
import { App, Spin, Empty, Button, Space } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import { useSchedule } from "./hooks/useSchedule";
import ScheduleList from "./components/ScheduleList/ScheduleList";
import AddTimelineItemModal from "./components/AddTimelineItemModal/AddTimelineItemModal";
import StatusProgressBar from "./components/StatusProgressBar/StatusProgressBar";
import StatusFilter from "./components/StatusFilter/StatusFilter";
import CurrentTimeIndicator from "./components/CurrentTimeIndicator/CurrentTimeIndicator";
import AdjustTimelineModal from "./components/AdjustTimelineModal/AdjustTimelineModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal/DeleteConfirmModal";
import pageStyles from "./schedule-page.module.css";

const Schedule: React.FC = () => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = selectedEvent?.id ?? 1;
  const eventIdStr = String(eventId);

  const schedule = useSchedule(eventId);

  async function handleApplyAdjustment() {
    const result = await schedule.applyAdjustment();
    if (!result) return;
    const key = `adjust-${Date.now()}`;
    notification.open({
      message: t("schedule.messages.timelineAdjusted"),
      description: t("schedule.messages.timelineAdjustedDesc", {
        count: result.count,
        minutes: result.minutes,
        direction: result.direction === "behind" ? t("schedule.later") : t("schedule.earlier"),
      }),
      btn: (
        <Button type="link" onClick={async () => { await schedule.undoLastAdjustment(); notification.destroy(key); }}>
          {t("common.undo")}
        </Button>
      ),
      key,
      duration: 8,
    });
  }

  if (schedule.loading) return <Spin />;

  return (
    <div>
      <div className={pageStyles.scheduleHeader}>
        <h2 className={pageStyles.scheduleTitle}>{t("schedule.title")}</h2>
        <Space>
          <Button icon={<ClockCircleOutlined />} onClick={schedule.jumpToNow}>
            {t("schedule.jumpToNow")}
          </Button>
          <Button icon={<ClockCircleOutlined />} onClick={() => schedule.setAdjustModalOpen(true)}>
            {t("schedule.adjustTimeline")}
          </Button>
        </Space>
      </div>

      <StatusProgressBar items={schedule.items} />

      <StatusFilter
        items={schedule.items}
        activeFilter={schedule.activeFilter}
        onFilterChange={schedule.setActiveFilter}
        hideCompleted={schedule.hideCompleted}
        onHideCompletedChange={schedule.setHideCompleted}
        onAddClick={() => schedule.setModalVisible(true)}
        searchQuery={schedule.searchQuery}
        onSearchChange={schedule.setSearchQuery}
        types={schedule.availableTypes}
        selectedTypes={schedule.selectedTypes}
        onTypesChange={schedule.setSelectedTypes}
        onClearFilters={schedule.clearFilters}
        filteredCount={schedule.filteredItems.length}
      />

      {schedule.filteredItems.length === 0 ? (
        <Empty
          description={
            schedule.items.length === 0
              ? t("schedule.emptyState")
              : t("schedule.noFilteredItems", {
                  status: schedule.activeFilter !== "all" ? schedule.activeFilter.replace("_", " ") : "",
                })
          }
          className={pageStyles.emptyMarginTop}
        />
      ) : (
        <div ref={schedule.timelineContainerRef} className={pageStyles.timelineContainer}>
          <CurrentTimeIndicator ref={schedule.nowIndicatorRef} items={schedule.items} containerRef={schedule.timelineContainerRef} />
          <ScheduleList
            items={schedule.filteredItems}
            onEdit={(item) => schedule.setEditItem(item)}
            onDelete={schedule.handleDeleteRequest}
            onStatusChange={schedule.handleStatusChange}
          />
        </div>
      )}

      <AdjustTimelineModal
        open={schedule.isAdjustModalOpen}
        onClose={() => schedule.setAdjustModalOpen(false)}
        direction={schedule.direction}
        setDirection={schedule.setDirection}
        adjustmentMinutes={schedule.adjustmentMinutes}
        setAdjustmentMinutes={schedule.setAdjustmentMinutes}
        applyFrom={schedule.applyFrom}
        setApplyFrom={schedule.setApplyFrom}
        isApplying={schedule.isApplying}
        items={schedule.items}
        getAffectedItems={schedule.getAffectedItems}
        onApply={handleApplyAdjustment}
      />

      <DeleteConfirmModal
        deleteTarget={schedule.deleteTarget}
        shouldCascade={schedule.shouldCascadeLocal}
        onCascadeChange={schedule.setShouldCascadeLocal}
        onConfirm={schedule.confirmDelete}
        onClose={schedule.closeDeleteModal}
        analyzeDeleteImpact={schedule.analyzeDeleteImpact}
      />

      <AddTimelineItemModal
        visible={schedule.isModalVisible}
        onClose={() => schedule.setModalVisible(false)}
        eventId={eventIdStr}
        onAdd={schedule.handleAddItem}
      />

      <AddTimelineItemModal
        visible={Boolean(schedule.editItem)}
        onClose={() => schedule.setEditItem(null)}
        eventId={eventIdStr}
        initialData={schedule.editItem ?? undefined}
        onSave={schedule.handleSaveItem}
      />
    </div>
  );
};

export default Schedule;
