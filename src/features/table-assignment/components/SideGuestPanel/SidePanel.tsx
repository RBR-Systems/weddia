"use client";
import React, { useEffect, useState } from "react";
import { Input, Select, Empty, Button, Progress, Segmented, Form, InputNumber, Modal, Popconfirm, Space } from "antd";
import Card from "@/shared/components/Card/Card";
import DraggableGuestRow from "../DraggableguestRow/DraggableGuestRow";
import UnassignedDropZone from "../UnassignedDropZone/UnassignedDropZone";
import styles from "./SidePanel.module.css";
import { UserOutlined, TeamOutlined, WarningOutlined, LeftOutlined, RightOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import type { Guest, TableAssignment, Relation, Table } from "../../models/tableAssignment.models";
import { useTranslation } from "react-i18next";
import { TABLE_SHAPE_DIMENSIONS, DEFAULT_TABLE_DIMENSION } from "../../constants/tableAssignment.constants";

type Props = {
  sideView: "guests" | "table";
  setSideView: (v: "guests" | "table") => void;
  sidePanelOpen: boolean;
  segmentedOptions: { label: string; value: string }[];
  relationOptions: { value: string; label: string }[];
  guestSearch: string;
  setGuestSearch: (s: string) => void;
  relationFilter?: string;
  setRelationFilter: (r?: string) => void;
  assignedFilter?: "all" | "assigned" | "unassigned";
  setAssignedFilter: (v: "all" | "assigned" | "unassigned") => void;
  filteredGuests: Guest[];
  relationsById: Map<string, Relation>;
  assignedGuestIds: Set<string>;
  selectedTable: Table | null;
  selectedTableAssignments: TableAssignment[];
  selectedTablePeopleCount: number;
  guestsById: Map<string, Guest>;
  tableOrder?: string[];
  tablesForActiveLayoutById?: Map<string, Table>;
  onSelectTable?: (tableId: string) => void;
  onClearSelectedTable?: () => void;
};

const SidePanel = (props: Props) => {
  const {
    sideView,
    setSideView,
    sidePanelOpen,
    relationOptions,
    guestSearch,
    setGuestSearch,
    relationFilter,
    setRelationFilter,
    assignedFilter,
    setAssignedFilter,
    filteredGuests,
    relationsById,
    assignedGuestIds,
    selectedTable,
    selectedTableAssignments,
    selectedTablePeopleCount,
    guestsById,
    tableOrder,
    tablesForActiveLayoutById,
    onSelectTable,
    onClearSelectedTable,
  } = props;

  const tables = tableOrder ?? [];
  const tablesById = tablesForActiveLayoutById ?? new Map();
  const ctx = useTableAssignmentContext();
  const assignmentsByTable = ctx.assignmentsByTable as Map<string, TableAssignment[]>;
  const { t } = useTranslation();
  const handleSelectTable = onSelectTable ?? (() => {});

  const totalGuests = guestsById?.size ?? 0;
  const unassignedCount = totalGuests - (assignedGuestIds?.size ?? 0);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const editShape = Form.useWatch("shape", editForm) as string | undefined;

  useEffect(() => {
    if (!editOpen) return;
    const dims = TABLE_SHAPE_DIMENSIONS[editShape ?? ""] ?? DEFAULT_TABLE_DIMENSION;
    editForm.setFieldsValue({ widthM: dims.width_m, heightM: dims.height_m });
  }, [editShape, editForm, editOpen]);

  const openEdit = () => {
    if (!selectedTable) return;
    editForm.setFieldsValue({
      shape: selectedTable.shape,
      seats: selectedTable.total_number,
      xGrid: selectedTable.x_grid,
      yGrid: selectedTable.y_grid,
      widthM: selectedTable.width_m,
      heightM: selectedTable.height_m,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (values: { shape: string; seats: number; xGrid: number; yGrid: number; widthM: number; heightM: number }) => {
    if (!selectedTable) return;
    await ctx.updateTable?.(selectedTable.table_id, {
      shape: values.shape,
      seats: values.seats,
      xGrid: values.xGrid,
      yGrid: values.yGrid,
      widthM: values.widthM,
      heightM: values.heightM,
    });
    setEditOpen(false);
    ctx.messageApi?.success(t("tableAssignment.tableUpdated", "Table updated"));
  };

  const handleDelete = async () => {
    if (!selectedTable) return;
    await ctx.deleteTable?.(selectedTable.table_id);
    onClearSelectedTable?.();
    ctx.messageApi?.success(t("tableAssignment.tableDeleted", "Table deleted"));
  };

  return (
    <>
      <Card
        size="small"
        title={
          <Segmented
            block
            value={sideView}
            onChange={(v) => setSideView(v as typeof sideView)}
            options={[
              {
                label: (
                  <>
                    {unassignedCount > 0 ? (
                      <WarningOutlined style={{ color: "orange", marginRight: 6 }} />
                    ) : (
                      <UserOutlined style={{ marginRight: 6 }} />
                    )}
                    {t("tableAssignment.sidePanel.guestsTab")}
                  </>
                ),
                value: "guests",
              },
              {
                label: (
                  <>
                    <TeamOutlined style={{ marginRight: 6 }} />
                    {t("tableAssignment.sidePanel.tableTab")}
                  </>
                ),
                value: "table",
              },
            ]}
          />
        }
        className={styles.sideCard + (sidePanelOpen ? "" : ` ${styles.closed}`)}
        style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
        styles={{
          body: {
            flex: "1 1 0%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            padding: "10px",
            overflow: "hidden",
          },
        }}
      >
        {sideView === "guests" ? (
          <div className={styles.sideBody}>
            <UnassignedDropZone />

            <div className={styles.sideFilters}>
              <Input.Search
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                placeholder={t("tableAssignment.sidePanel.searchPlaceholder")}
                allowClear
                size="small"
              />
              <Select
                value={relationFilter ?? "__all__"}
                onChange={(v) => setRelationFilter(v === "__all__" ? undefined : v)}
                options={[
                  { value: "__all__", label: t("tableAssignment.sidePanel.all") },
                  ...relationOptions,
                ]}
                size="small"
                style={{ width: "100%" }}
              />
              <Segmented
                value={assignedFilter ?? "all"}
                onChange={(v) => setAssignedFilter(v as "all" | "assigned" | "unassigned")}
                size="small"
                block
                options={[
                  { label: t("tableAssignment.sidePanel.all"), value: "all" },
                  { label: t("tableAssignment.sidePanel.assigned"), value: "assigned" },
                  { label: t("tableAssignment.sidePanel.unassignedTab"), value: "unassigned" },
                ]}
              />
              <div className={styles.filterFooter}>
                <span className={styles.guestCount}>
                  {totalGuests} {t("tableAssignment.sidePanel.guestsTab").toLowerCase()}
                  {unassignedCount > 0 && (
                    <>
                      {" · "}
                      <span className={styles.unassignedBadge}>
                        {unassignedCount} {t("tableAssignment.sidePanel.unassignedTab").toLowerCase()}
                      </span>
                    </>
                  )}
                </span>
                <Button
                  danger
                  type="link"
                  size="small"
                  style={{ padding: 0, height: "auto", fontSize: "var(--fs-xs)" }}
                  onClick={() => {
                    ctx.unassignAll();
                    ctx.messageApi?.success(t("tableAssignment.sidePanel.allGuestsUnassigned"));
                  }}
                >
                  {t("tableAssignment.sidePanel.unassignAll")}
                </Button>
              </div>
            </div>

            <div className={styles.sideList}>
              {filteredGuests.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("tableAssignment.sidePanel.noGuests") ?? "Sin invitados"}
                  style={{ margin: "auto" }}
                />
              ) : (
                filteredGuests.map((g) => {
                  const relation = relationsById.get(g.relation_id);
                  const isAssigned = assignedGuestIds.has(g.guest_id);
                  return (
                    <DraggableGuestRow
                      key={g.guest_id}
                      guest={g}
                      relationName={relation?.name}
                      isAssigned={isAssigned}
                    />
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className={styles.sideBody}>
            {selectedTable ? (
              <>
                <div className={styles.tableDetailsHeader}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<LeftOutlined />}
                      onClick={() => onClearSelectedTable?.()}
                    >
                      {t("tableAssignment.sidePanel.tableTab")}
                    </Button>
                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={openEdit}
                      />
                      <Popconfirm
                        title={t("tableAssignment.deleteTable", "Delete table")}
                        description={
                          selectedTableAssignments.length > 0
                            ? t("tableAssignment.deleteTableWarning", "This will unassign {{count}} guest(s).", { count: selectedTablePeopleCount })
                            : t("tableAssignment.deleteTableConfirm", "Are you sure?")
                        }
                        onConfirm={handleDelete}
                        okText={t("common.delete", "Delete")}
                        cancelText={t("common.cancel", "Cancel")}
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                  <div className={styles.tableTitle}>{selectedTable.table_id}</div>
                  <div className={styles.tableSubtitle}>
                    {t("tableAssignment.sidePanel.capacityAndSeated", {
                      capacity: selectedTable.total_number,
                      seated: selectedTablePeopleCount,
                    })}
                    {" · "}
                    {selectedTable.width_m}×{selectedTable.height_m}m
                  </div>
                </div>

                <div className={styles.sideList}>
                  {selectedTableAssignments.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t("tableAssignment.sidePanel.noGuestsAssigned")}
                      style={{ margin: "auto" }}
                    />
                  ) : (
                    selectedTableAssignments.map((a) => {
                      const g = guestsById.get(a.guest_id);
                      if (!g) return null;
                      const relation = relationsById.get(g.relation_id);
                      const isAssigned = assignedGuestIds.has(g.guest_id);
                      const partySize = g.party_size ?? (g.plus_one ? 2 : 1);
                      const maxSeat = selectedTable.total_number - partySize + 1;

                      return (
                        <div key={a.guest_id} className={styles.tableDetailGuestRow}>
                          <DraggableGuestRow
                            guest={g}
                            relationName={relation?.name}
                            isAssigned={isAssigned}
                          />
                          <div className={styles.seatNavButtons}>
                            <Button
                              size="small"
                              disabled={a.seat_number <= 1}
                              onClick={() => {
                                ctx.moveGuestSeat?.(
                                  a.guest_id,
                                  selectedTable.table_id,
                                  Math.max(1, a.seat_number - 1),
                                );
                              }}
                              icon={<LeftOutlined />}
                            />
                            <Button
                              size="small"
                              disabled={a.seat_number >= maxSeat}
                              onClick={() => {
                                ctx.moveGuestSeat?.(
                                  a.guest_id,
                                  selectedTable.table_id,
                                  Math.min(maxSeat, a.seat_number + 1),
                                );
                              }}
                              icon={<RightOutlined />}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                {tables.length === 0 ? (
                  <Empty description={t("tableAssignment.sidePanel.noTables")} />
                ) : (
                  <div className={styles.tableList}>
                    {tables.map((tableId) => {
                      const tbl = tablesById.get(tableId);
                      const capacity = tbl?.total_number ?? 0;
                      const assignments = assignmentsByTable?.get(tableId) ?? [];
                      const seated = assignments.reduce((sum: number, a: TableAssignment) => {
                        const g = guestsById?.get(a.guest_id);
                        return sum + (g?.party_size ?? 1);
                      }, 0);
                      const pct = capacity > 0 ? Math.round((seated / capacity) * 100) : 0;
                      const isFull = seated >= capacity && capacity > 0;
                      const shapeIcon =
                        tbl?.shape === "rectangular" ? "▬" : tbl?.shape === "square" ? "■" : "●";

                      return (
                        <div
                          key={tableId}
                          className={styles.tableListItem}
                          onClick={() => handleSelectTable(tableId)}
                          role={onSelectTable ? "button" : undefined}
                          tabIndex={onSelectTable ? 0 : undefined}
                          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                            if ((e.key === "Enter" || e.key === " ") && onSelectTable) {
                              e.preventDefault();
                              handleSelectTable(tableId);
                            }
                          }}
                        >
                          <div className={styles.tableListRow}>
                            <span className={styles.tableShapeIcon}>{shapeIcon}</span>
                            <div className={styles.tableListInfo}>
                              <div className={styles.tableListHeader}>
                                <span className={styles.tableTitle}>{tableId}</span>
                                <span
                                  className={styles.tableSeats}
                                  style={{ color: isFull ? "var(--status-canceled)" : "var(--text-color-secondary)" }}
                                >
                                  {seated}/{capacity}
                                </span>
                              </div>
                              <Progress
                                percent={pct}
                                size="small"
                                showInfo={false}
                                strokeColor={
                                  isFull
                                    ? "var(--status-canceled)"
                                    : pct > 75
                                      ? "var(--status-delayed)"
                                      : "var(--primary)"
                                }
                                style={{ margin: 0 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Edit table modal */}
      <Modal
        title={t("tableAssignment.editTable", "Edit Table")}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        okText={t("common.save", "Save")}
        forceRender
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
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
            <Form.Item name="widthM" label={t("tableAssignment.widthM", "Width (m)")} style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0.5} max={10} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="heightM" label={t("tableAssignment.heightM", "Height (m)")} style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0.5} max={10} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
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
    </>
  );
};

export default SidePanel;
