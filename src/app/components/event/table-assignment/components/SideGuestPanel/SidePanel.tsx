import React from "react";
import { Space, Input, Select, Tag, Empty, Button } from "antd";
import Card from "@/app/common/Card/card";
import { Segmented } from "antd";
import DraggableGuestRow from "../DraggableguestRow/DraggableGuestRow";
import UnassignedDropZone from "../UnassignedDropZone/UnassignedDropZone";
import styles from "./SidePanel.module.css";
import { UserOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import type { Guest, TableAssignment } from "../../models/types";
import { Progress } from "antd";
import { useTranslation } from "react-i18next";

type Props = {
  sideView: "guests" | "table";
  setSideView: (v: "guests" | "table") => void;
  sidePanelOpen: boolean;
  segmentedOptions: any;
  relationOptions: any;
  guestSearch: string;
  setGuestSearch: (s: string) => void;
  relationFilter?: string;
  setRelationFilter: (r?: string) => void;
  assignedFilter?: "all" | "assigned" | "unassigned";
  setAssignedFilter: (v: "all" | "assigned" | "unassigned") => void;
  filteredGuests: Guest[];
  relationsById: Map<string, any>;
  assignedGuestIds: Set<string>;
  selectedTable: any;
  selectedTableAssignments: TableAssignment[];
  selectedTablePeopleCount: number;
  guestsById: Map<string, Guest>;
  tableOrder?: string[];
  tablesForActiveLayoutById?: Map<string, any>;
  onSelectTable?: (tableId: string) => void;
  onClearSelectedTable?: () => void;
};

const SidePanel = (props: Props) => {
  const {
    sideView,
    setSideView,
    sidePanelOpen,
    segmentedOptions,
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
  const assignmentsByTable = (ctx as any).assignmentsByTable as Map<string, TableAssignment[]>;
  const { t } = useTranslation();
  const handleSelectTable = onSelectTable ?? (() => {});
  const unassignedCount =
    (guestsById?.size ?? 0) - (assignedGuestIds?.size ?? 0);

  return (
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
                <Space size={6}>
                  {unassignedCount > 0 ? (
                    <>
                      <WarningOutlined style={{ color: "orange" }} />
                      {t("tableAssignment.sidePanel.guestsTab")}
                    </>
                  ) : (
                    <>
                      <UserOutlined />
                      {t("tableAssignment.sidePanel.guestsTab")}
                    </>
                  )}
                </Space>
              ),
              value: "guests",
            },
            {
              label: (
                <Space size={6}>
                  <TeamOutlined />
                  {t("tableAssignment.sidePanel.tableTab")}
                </Space>
              ),
              value: "table",
            },
          ]}
        />
      }
      className={styles.sideCard + (sidePanelOpen ? "" : ` ${styles.closed}`)}
    >
      {sideView === "guests" ? (
        <div className={styles.sideBody}>
          <UnassignedDropZone />
          <div className={styles.sideFilters}>
          <Space orientation="vertical" size={10} className={styles.spaceMargin}>
            <Input.Search
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              placeholder={t("tableAssignment.sidePanel.searchPlaceholder")}
              allowClear
            />
            <Select
              value={relationFilter}
              onChange={(v) => setRelationFilter(v)}
              placeholder={t("tableAssignment.sidePanel.filterByRelation")}
              allowClear
              options={relationOptions}
            />
            <Segmented
              value={assignedFilter ?? "all"}
              onChange={(v) =>
                setAssignedFilter(v as "all" | "assigned" | "unassigned")
              }
              options={[
                { label: t("tableAssignment.sidePanel.all"), value: "all" },
                {
                  label: t("tableAssignment.sidePanel.assigned"),
                  value: "assigned",
                },
                {
                  label: t("tableAssignment.sidePanel.unassignedTab"),
                  value: "unassigned",
                },
              ]}
            />
            <div>
              <Button
                danger
                onClick={() => {
                  ctx.dispatch({ type: "UNASSIGN_ALL" });
                  ctx.messageApi?.success(
                    t("tableAssignment.sidePanel.allGuestsUnassigned"),
                  );
                }}
              >
                {t("tableAssignment.sidePanel.unassignAll")}
              </Button>
            </div>
          </Space>
          </div>
          <div className={styles.sideList}>
            {filteredGuests.map((g) => {
              const relation = relationsById.get(g.relation_id);
              const isAssigned = assignedGuestIds.has(g.guest_id);
              return (
                <div key={g.guest_id} className={styles.guestRow}>
                  <DraggableGuestRow
                    guest={g}
                    relationName={relation?.name}
                    isAssigned={isAssigned}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.sideBody}>
          {!selectedTable ? (
            <div>
              {tables.length === 0 ? (
                <Empty description={t("tableAssignment.sidePanel.noTables")} />
              ) : (
                <div className={styles.tableList}>
                  {tables.map((tableId) => {
                    const tbl = tablesById.get(tableId);
                    const capacity = tbl?.total_number ?? 0;
                    const assignments = assignmentsByTable?.get(tableId) ?? [];
                    const seated = assignments.reduce((sum: number, a: any) => {
                      const g = guestsById?.get(a.guest_id);
                      return sum + (g?.party_size ?? 1);
                    }, 0);
                    const pct = capacity > 0 ? Math.round((seated / capacity) * 100) : 0;
                    const isFull = seated >= capacity && capacity > 0;
                    const shapeIcon = tbl?.shape === "rectangular" ? "▬" : tbl?.shape === "square" ? "■" : "●";

                    return (
                      <div
                        key={tableId}
                        className={styles.tableListItem}
                        onClick={() => handleSelectTable(tableId)}
                      >
                        <div className={styles.tableListRow}>
                          <span className={styles.tableShapeIcon}>{shapeIcon}</span>
                          <div className={styles.tableListInfo}>
                            <div className={styles.tableListHeader}>
                              <span className={styles.tableTitle}>{tableId}</span>
                              <span className={styles.tableSeats} style={{ color: isFull ? "var(--status-canceled)" : "var(--text-color-secondary)" }}>
                                {seated}/{capacity}
                              </span>
                            </div>
                            <Progress
                              percent={pct}
                              size="small"
                              showInfo={false}
                              strokeColor={isFull ? "var(--status-canceled)" : pct > 75 ? "var(--status-delayed)" : "var(--primary)"}
                              style={{ margin: 0 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.tableDetailsHeader}>
                <Space size={10} align="center">
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={() =>
                      onClearSelectedTable && onClearSelectedTable()
                    }
                  />
                  <div>
                    <div className={styles.tableTitle}>
                      {selectedTable.table_id}
                    </div>
                    <div className={styles.tableSubtitle}>
                      {t("tableAssignment.sidePanel.capacityAndSeated", {
                        capacity: selectedTable.total_number,
                        seated: selectedTablePeopleCount,
                      })}
                    </div>
                  </div>
                </Space>
              </div>
              <div className={styles.sideList}>
                {selectedTableAssignments.length === 0 ? (
                  <Empty description={t("tableAssignment.sidePanel.noGuestsAssigned")} />
                ) : (
                  selectedTableAssignments.map((a) => {
                    const g = guestsById.get(a.guest_id);
                    if (!g) return null;
                    const relation = relationsById.get(g.relation_id);
                    const isAssigned = assignedGuestIds.has(g.guest_id);
                    const partySize = g.party_size ?? (g.plus_one ? 2 : 1);
                    const seatEnd = a.seat_number + partySize - 1;
                    const maxSeat = selectedTable.total_number - partySize + 1;
                    const seatLabel =
                      partySize > 1
                        ? t("tableAssignment.seatRange", {
                            from: a.seat_number,
                            to: seatEnd,
                          })
                        : t("tableAssignment.seatNumber", {
                            number: a.seat_number,
                          });
                    return (
                      <div key={a.guest_id}>
                        <Space
                          orientation="horizontal"
                          size={8}
                          align="center"
                          className={styles.fullWidth}
                        >
                          <DraggableGuestRow
                            guest={g}
                            relationName={relation?.name}
                            isAssigned={isAssigned}
                          />
                          <Space>
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
                          </Space>
                        </Space>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default SidePanel;
