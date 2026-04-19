"use client";
import styles from "./TableAssignmentPage.module.css";
import { App, Card, Empty, Space, Typography, Button, FloatButton, InputNumber, Modal, Form, Select, Tag } from "antd";
import { DEFAULT_VENUE_WIDTH_METERS } from "./constants/tableAssignment.constants";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { TeamOutlined, MessageOutlined, UndoOutlined, PlusOutlined, ZoomOutOutlined, ZoomInOutlined, PlusSquareOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import TableCanvas from "./components/Tables/TableCanvas/TableCanvas";
import SeatingAIChat from "./components/AIChat/SeatingAIChat";
import { useTableAssignmentContext, TableAssignmentProvider } from "./context/TableAssignmentContext";
import SidePanel from "./components/SideGuestPanel/SidePanel";
import { useTranslation } from "react-i18next";

const TableAssignmentPage = ({
  highlightTableId,
}: {
  highlightTableId?: string | null;
}) => {
  const { message: messageApi } = App.useApp();

  return (
    <TableAssignmentProvider
      messageApi={messageApi}
      initialSelectedTableId={highlightTableId}
    >
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
    zoomScale,
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
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [addTableForm] = Form.useForm();
  const { addTable } = useTableAssignmentContext() as any;

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
              {activeLayout.name} •{" "}
              {t("tableAssignment.tables", { count: tablesForActiveLayout.length })}{" "}
              •{" "}
              {t("tableAssignment.guests", { count: Array.from(guestsById.values()).length })}
            </Typography.Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddTableOpen(true)}
          >
            {t("tableAssignment.addTable", "Add Table")}
          </Button>
        </div>

        <div className={styles.contentGrid + " " + styles.contentGridFull}>
          <Card
            className={styles.canvasCard}
            title={
              <Space size={8} align="center">
                <TeamOutlined />
                <span>{t("tableAssignment.seatingChart")}</span>
                <Tag color="blue" className={styles["tagSpacing"]}>
                  {t("tableAssignment.guests", {
                    count: Array.from(guestsById.values()).length,
                  })}
                </Tag>
                <Tag color="orange" className={styles["tagSpacing"]}>
                  {t("tableAssignment.unassigned", {
                    count:
                      Array.from(guestsById.values()).length -
                      (assignedGuestIds?.size ?? 0),
                  })}
                </Tag>
              </Space>
            }
            extra={
              <Space align="center" size={8}>
                <Typography.Text type="secondary">
                  {t("tableAssignment.grid")}
                </Typography.Text>
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
                {Math.round(zoomScale * 100)}%
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
              <div className={styles.canvasScroll}>
                <TableCanvas
                  tableOrder={tableOrder}
                  tablesForActiveLayoutById={tablesForActiveLayoutById}
                  assignmentsByTable={assignmentsByTable}
                  selectedTableId={selectedTableId}
                  onSelectTable={onSelectTable}
                  guestsById={guestsById}
                  metersToPixels={metersToPixels}
                  activeLayout={activeLayout}
                  zoomScale={zoomScale}
                />
              </div>
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

      {/* Add Table modal */}
      <Modal
        title={t("tableAssignment.addTable", "Add Table")}
        open={addTableOpen}
        onCancel={() => { setAddTableOpen(false); addTableForm.resetFields(); }}
        onOk={() => addTableForm.submit()}
        okText={t("common.add", "Add")}
        forceRender
      >
        <Form
          form={addTableForm}
          layout="vertical"
          initialValues={{ shape: "round", seats: 8, xGrid: 5, yGrid: 5 }}
          onFinish={async (values) => {
            await addTable?.({
              shape: values.shape,
              seats: values.seats,
              xGrid: values.xGrid,
              yGrid: values.yGrid,
            });
            setAddTableOpen(false);
            addTableForm.resetFields();
          }}
        >
          <Form.Item name="shape" label={t("tableAssignment.tableShape", "Shape")} rules={[{ required: true }]}>
            <Select options={[
              { value: "round", label: t("tableAssignment.shapes.round", "Round") },
              { value: "rectangular", label: t("tableAssignment.shapes.rectangular", "Rectangular") },
              { value: "square", label: t("tableAssignment.shapes.square", "Square") },
            ]} />
          </Form.Item>
          <Form.Item name="seats" label={t("tableAssignment.numberOfSeats", "Number of seats")} rules={[{ required: true }]}>
            <InputNumber min={1} max={30} style={{ width: "100%" }} />
          </Form.Item>
          <Space style={{ width: "100%" }}>
            <Form.Item name="xGrid" label={t("tableAssignment.positionX", "Position X")} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="yGrid" label={t("tableAssignment.positionY", "Position Y")} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </DndContext>
  );
}

export default TableAssignmentPage;


