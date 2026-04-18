import React from "react";
import { Input, Select, Tag, Empty, Button } from "antd";
import Card from "@/shared/components/Card/Card";
import { Segmented } from "antd";
import DraggableGuestRow from "../DraggableguestRow/DraggableGuestRow";
import UnassignedDropZone from "../UnassignedDropZone/UnassignedDropZone";
import styles from "./SidePanel.module.css";
import { UserOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import type { Guest, TableAssignment } from "../../models/tableAssignment.models";
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

  const totalGuests = guestsById?.size ?? 0;
  const unassignedCount = totalGuests - (assignedGuestIds?.size ?? 0);

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

          {/* Filters */}
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
              onChange={(v) =>
                setAssignedFilter(v as "all" | "assigned" | "unassigned")
              }
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
                  ctx.messageApi?.success(
                    t("tableAssignment.sidePanel.allGuestsUnassigned"),
                  );
                }}
              >
                {t("tableAssignment.sidePanel.unassignAll")}
              </Button>
            </div>
          </div>

          {/* Guest list */}
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
          {!selectedTable ? (
            <>
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
                    const shapeIcon =
                      tbl?.shape === "rectangular" ? "▬"
                      : tbl?.shape === "square" ? "■"
                      : "●";

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
                              <span
                                className={styles.tableSeats}
                                style={{
                                  color: isFull
                                    ? "var(--status-canceled)"
                                    : "var(--text-color-secondary)",
                                }}
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
          ) : (
            <>
              <div className={styles.tableDetailsHeader}>
                <Button
                  type="text"
                  size="small"
                  icon={<LeftOutlined />}
                  onClick={() => onClearSelectedTable?.()}
                  style={{ marginBottom: 6 }}
                >
                  {t("tableAssignment.sidePanel.tableTab")}
                </Button>
                <div className={styles.tableTitle}>{selectedTable.table_id}</div>
                <div className={styles.tableSubtitle}>
                  {t("tableAssignment.sidePanel.capacityAndSeated", {
                    capacity: selectedTable.total_number,
                    seated: selectedTablePeopleCount,
                  })}
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
          )}
        </div>
      )}
    </Card>
  );
};

export default SidePanel;
