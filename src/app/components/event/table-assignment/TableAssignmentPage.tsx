"use client";
import styles from "./TableAssignmentPage.module.css";
import { Card, Empty, Space, Typography, Button, FloatButton } from "antd";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  TeamOutlined,
  MessageOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import React from "react";
import TableCanvas from "./components/Tables/TableCanvas/TableCanvas";
import SeatingAIChat from "./components/AIChat/SeatingAIChat";
import { useTableAssignmentContext } from "./context/TableAssignmentContext";
import { TableAssignmentProvider } from "./context/TableAssignmentContext";
import SidePanel from "./components/SideGuestPanel/SidePanel";

const TableAssignmentPage = () => {
  return (
    <TableAssignmentProvider>
      <TableAssignmentContent />
    </TableAssignmentProvider>
  );
};

function TableAssignmentContent() {
  const {
    activeLayout,
    tablesForActiveLayout,
    tableOrder,
    tablesForActiveLayoutById,
    assignmentsByTable,
    selectedTableId,
    onSelectTable,
    guestsById,
    metersToPixels,
    sensors,
    onDragStart,
    onDragEnd,
    onDragCancel,
    dragOverlayContent,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    sideView,
    setSideView,
    segmentedOptions,
    sidePanelOpen,
    aiChatOpen,
    setAIChatOpen,
    hfGuests,
    hfTables,
    handleApplyAISeating,
    selectedTable,
    selectedTableAssignments,
    selectedTablePeopleCount,
    relationsById,
    assignedGuestIds,
    filteredGuests,
    guestSearch,
    setGuestSearch,
    relationFilter,
    setRelationFilter,
    relationOptions,
  } = useTableAssignmentContext();

  if (!activeLayout) {
    return (
      <div className={styles.page}>
        <Card>
          <Empty description="No table layouts available yet. Create a layout first." />
        </Card>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <Typography.Title level={2} className={styles.title}>
              Table Assignment
            </Typography.Title>
            <Typography.Text type="secondary">
              {activeLayout.name} • {tablesForActiveLayout.length} tables •{" "}
              {Array.from(guestsById.values()).length} guests
            </Typography.Text>
          </div>
        </div>

        <div className={styles.contentGrid + " " + styles.contentGridFull}>
          <Card
            className={styles.canvasCard}
            title={
              <Space size={8}>
                <TeamOutlined />
                <span>Seating chart</span>
              </Space>
            }
            extra={
              <Typography.Text type="secondary">
                Grid {activeLayout.x_grid_size}×{activeLayout.y_grid_size}
              </Typography.Text>
            }
          >
            <div className={styles.zoomControls}>
              <Button
                size="small"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                -
              </Button>
              <Button
                size="small"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
              >
                Reset
              </Button>
              <Button size="small" onClick={handleZoomIn} aria-label="Zoom in">
                +
              </Button>
            </div>
            <div className={styles.canvasWrapper}>
              <TableCanvas
                tableOrder={tableOrder}
                tablesForActiveLayoutById={tablesForActiveLayoutById}
                assignmentsByTable={assignmentsByTable}
                selectedTableId={selectedTableId}
                onSelectTable={onSelectTable}
                guestsById={guestsById}
                metersToPixels={metersToPixels}
                activeLayout={activeLayout}
              />
            </div>
          </Card>

          <SidePanel
            sideView={sideView}
            setSideView={setSideView}
            sidePanelOpen={sidePanelOpen}
            segmentedOptions={segmentedOptions}
            relationOptions={relationOptions}
            guestSearch={guestSearch}
            setGuestSearch={setGuestSearch}
            relationFilter={relationFilter}
            setRelationFilter={setRelationFilter}
            filteredGuests={filteredGuests}
            relationsById={relationsById}
            assignedGuestIds={assignedGuestIds}
            selectedTable={selectedTable}
            selectedTableAssignments={selectedTableAssignments}
            selectedTablePeopleCount={selectedTablePeopleCount}
            guestsById={guestsById}
          />

          <FloatButton
            icon={<MessageOutlined />}
            type="primary"
            className={styles.floatButtonFixed}
            onClick={() => setAIChatOpen(!aiChatOpen)}
            tooltip={aiChatOpen ? undefined : "AI Seating Assistant"}
          />
          {aiChatOpen && (
            <div className={styles.aiChatContainer}>
              <div className={styles.aiChatHeader}>
                <span className={styles.aiChatTitle}>
                  <MessageOutlined className={styles.aiChatIcon} />
                  AI Seating Assistant
                </span>
                <FloatButton
                  icon={<CloseOutlined />}
                  type="default"
                  className={styles.floatButtonClose}
                  onClick={() => setAIChatOpen(false)}
                  tooltip={"Close"}
                />
              </div>
              <div className={styles.aiChatContent}>
                <SeatingAIChat
                  guests={hfGuests}
                  tables={hfTables}
                  onApplySeating={handleApplyAISeating}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {dragOverlayContent != null ? (
          <div className={styles.dragOverlay}>
            <Typography.Text strong>{dragOverlayContent}</Typography.Text>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TableAssignmentPage;
