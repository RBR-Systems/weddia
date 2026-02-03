"use client";
import styles from "./TableAssignmentPage.module.css";
import {
  Card,
  Empty,
  Space,
  Typography,
  Button,
  FloatButton,
  InputNumber,
  Tag,
} from "antd";
import {
  INITIAL_METERS_TO_PIXELS,
  DEFAULT_VENUE_WIDTH_METERS,
} from "./constants/constants";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  TeamOutlined,
  MessageOutlined,
  CloseOutlined,
  UndoOutlined,
  PlusOutlined,
  MinusOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
  PlusSquareOutlined,
} from "@ant-design/icons";
import React from "react";
import { message } from "antd";
import TableCanvas from "./components/Tables/TableCanvas/TableCanvas";
import SeatingAIChat from "./components/AIChat/SeatingAIChat";
import { useTableAssignmentContext } from "./context/TableAssignmentContext";
import { TableAssignmentProvider } from "./context/TableAssignmentContext";
import SidePanel from "./components/SideGuestPanel/SidePanel";

const TableAssignmentPage = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <TableAssignmentProvider messageApi={messageApi}>
      {contextHolder}
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
    handleZoomFit,
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
    assignedFilter,
    setAssignedFilter,
    filteredGuests,
    guestSearch,
    setGuestSearch,
    relationFilter,
    setRelationFilter,
    relationOptions,
    dispatch,
  } = useTableAssignmentContext();

  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);

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
              <Space size={8} align="center">
                <TeamOutlined />
                <span>Seating chart</span>
                <Tag color="blue" style={{ marginLeft: 6 }}>
                  {Array.from(guestsById.values()).length} guests
                </Tag>
                <Tag color="orange" style={{ marginLeft: 6 }}>
                  {Array.from(guestsById.values()).length -
                    (assignedGuestIds?.size ?? 0)}{" "}
                  unassigned
                </Tag>
              </Space>
            }
            extra={
              <Space align="center" size={8}>
                <Typography.Text type="secondary">Grid</Typography.Text>
                <InputNumber
                  min={1}
                  value={activeLayout.x_grid_size}
                  onChange={(v) =>
                    typeof v === "number" &&
                    dispatch({
                      type: "SET_ACTIVE_LAYOUT_GRID",
                      payload: {
                        x_grid_size: v,
                        y_grid_size: activeLayout.y_grid_size,
                      },
                    })
                  }
                  size="small"
                />
                <span>×</span>
                <InputNumber
                  min={1}
                  value={activeLayout.y_grid_size}
                  onChange={(v) =>
                    typeof v === "number" &&
                    dispatch({
                      type: "SET_ACTIVE_LAYOUT_GRID",
                      payload: {
                        x_grid_size: activeLayout.x_grid_size,
                        y_grid_size: v,
                      },
                    })
                  }
                  size="small"
                />
              </Space>
            }
          >
            <div className={styles.zoomControls}>
              <Button
                size="small"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                icon={<ZoomOutOutlined />}
              ></Button>
              <Button
                size="small"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
                icon={<UndoOutlined />}
              ></Button>
              <Button
                size="small"
                onClick={() => {
                  const w = canvasWrapperRef.current?.clientWidth ?? 800;
                  const h = canvasWrapperRef.current?.clientHeight ?? 600;
                  handleZoomFit(w, h);
                }}
                aria-label="Fit"
                icon={<PlusSquareOutlined />}
              ></Button>
              <Button
                size="small"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                icon={<ZoomInOutlined />}
              ></Button>
              <Typography.Text
                className={styles.zoomPercentage}
                type="secondary"
              >
                {Math.round((metersToPixels / INITIAL_METERS_TO_PIXELS) * 100)}%
              </Typography.Text>
            </div>
            <div
              className={styles.canvasWrapper}
              ref={canvasWrapperRef}
              style={
                {
                  ["--grid-size"]: `${(DEFAULT_VENUE_WIDTH_METERS / activeLayout.x_grid_size) * metersToPixels}px`,
                } as React.CSSProperties
              }
            >
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

          <div className={styles.sideContainer}>
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
              assignedFilter={assignedFilter}
              setAssignedFilter={setAssignedFilter}
              filteredGuests={filteredGuests}
              relationsById={relationsById}
              assignedGuestIds={assignedGuestIds}
              selectedTable={selectedTable}
              selectedTableAssignments={selectedTableAssignments}
              selectedTablePeopleCount={selectedTablePeopleCount}
              guestsById={guestsById}
              tableOrder={tableOrder}
              tablesForActiveLayoutById={tablesForActiveLayoutById}
              onSelectTable={onSelectTable}
              onClearSelectedTable={() =>
                dispatch({ type: "SET_SELECTED_TABLE", payload: null })
              }
            />
          </div>

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
