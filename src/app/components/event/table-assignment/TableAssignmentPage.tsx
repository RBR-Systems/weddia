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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
          <Empty description={t("tableAssignment.emptyState")} />
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
              {t("tableAssignment.title")}
            </Typography.Title>
            <Typography.Text type="secondary">
              {activeLayout.name} • {t("tableAssignment.tables", { count: tablesForActiveLayout.length })} •{" "}
              {t("tableAssignment.guests", { count: Array.from(guestsById.values()).length })}
            </Typography.Text>
          </div>
        </div>

        <div className={styles.contentGrid + " " + styles.contentGridFull}>
          <Card
            className={styles.canvasCard}
            title={
              <Space size={8} align="center">
                <TeamOutlined />
                <span>{t("tableAssignment.seatingChart")}</span>
                <Tag color="blue" className={styles["tagSpacing"]}>
                  {t("tableAssignment.guests", { count: Array.from(guestsById.values()).length })}
                </Tag>
                <Tag color="orange" className={styles["tagSpacing"]}>
                  {t("tableAssignment.unassigned", { count: Array.from(guestsById.values()).length -
                    (assignedGuestIds?.size ?? 0) })}
                </Tag>
              </Space>
            }
            extra={
              <Space align="center" size={8}>
                <Typography.Text type="secondary">{t("tableAssignment.grid")}</Typography.Text>
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
                aria-label={t("tableAssignment.zoom.out")}
                icon={<ZoomOutOutlined />}
              ></Button>
              <Button
                size="small"
                onClick={handleZoomReset}
                aria-label={t("tableAssignment.zoom.reset")}
                icon={<UndoOutlined />}
              ></Button>
              <Button
                size="small"
                onClick={() => {
                  const w = canvasWrapperRef.current?.clientWidth ?? 800;
                  const h = canvasWrapperRef.current?.clientHeight ?? 600;
                  handleZoomFit(w, h);
                }}
                aria-label={t("tableAssignment.zoom.fit")}
                icon={<PlusSquareOutlined />}
              ></Button>
              <Button
                size="small"
                onClick={handleZoomIn}
                aria-label={t("tableAssignment.zoom.in")}
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
            tooltip={aiChatOpen ? undefined : t("tableAssignment.aiAssistant")}
          />
          {aiChatOpen && (
            <div className={styles.aiChatContainer}>
              <div className={styles.aiChatHeader}>
                <span className={styles.aiChatTitle}>
                  <MessageOutlined className={styles.aiChatIcon} />
                  {t("tableAssignment.aiAssistant")}
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
