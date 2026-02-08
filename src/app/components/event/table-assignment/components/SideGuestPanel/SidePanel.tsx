import React from "react";
import { Space, Input, Select, List, Tag, Empty, Button } from "antd";
import Card from "@/app/common/Card/card";
import { Segmented } from "antd";
import DraggableGuestRow from "../DraggableguestRow/DraggableGuestRow";
import UnassignedDropZone from "../UnassignedDropZone/UnassignedDropZone";
import styles from "./SidePanel.module.css";
import { UserOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import type { Guest, TableAssignment } from "../../models/types";

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
                      Guests
                    </>
                  ) : (
                    <>
                      <UserOutlined />
                      Guests
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
                  Table
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
          <Space direction="vertical" size={10} className={styles.spaceMargin}>
            <Input.Search
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              placeholder="Search guests by name or email"
              allowClear
            />
            <Select
              value={relationFilter}
              onChange={(v) => setRelationFilter(v)}
              placeholder="Filter by relation"
              allowClear
              options={relationOptions}
            />
            <Segmented
              value={assignedFilter ?? "all"}
              onChange={(v) =>
                setAssignedFilter(v as "all" | "assigned" | "unassigned")
              }
              options={[
                { label: "All", value: "all" },
                { label: "Assigned", value: "assigned" },
                { label: "Unassigned", value: "unassigned" },
              ]}
            />
            <div>
              <Button
                danger
                onClick={() => {
                  ctx.dispatch({ type: "UNASSIGN_ALL" });
                  ctx.messageApi?.success("All guests unassigned");
                }}
              >
                Unassign all
              </Button>
            </div>
          </Space>
          <div className={styles.sideList + " " + styles.sideListHeight180}>
            <List
              size="small"
              dataSource={filteredGuests}
              renderItem={(g) => {
                const relation = relationsById.get(g.relation_id);
                const isAssigned = assignedGuestIds.has(g.guest_id);
                return (
                  <List.Item key={g.guest_id} className={styles.guestRow}>
                    <DraggableGuestRow
                      guest={g}
                      relationName={relation?.name}
                      isAssigned={isAssigned}
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.sideBody}>
          {!selectedTable ? (
            <div>
              {tables.length === 0 ? (
                <Empty description="No tables available." />
              ) : (
                <List
                  size="small"
                  dataSource={tables}
                  renderItem={(tableId) => {
                    const t = tablesById.get(tableId);
                    return (
                      <List.Item
                        key={tableId}
                        className={styles.tableListItem}
                        onClick={() => handleSelectTable(tableId)}
                      >
                        <div>
                          <div className={styles.tableTitle}>
                            {t?.table_id ?? tableId}
                          </div>
                          <div className={styles.tableSubtitle}>
                            Capacity {t?.total_number ?? "-"}
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
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
                      Capacity {selectedTable.total_number} •{" "}
                      {selectedTablePeopleCount} seated
                    </div>
                  </div>
                </Space>
              </div>
              <div className={styles.sideList + " " + styles.sideListHeight80}>
                <List
                  size="small"
                  locale={{ emptyText: "No guests assigned yet." }}
                  dataSource={selectedTableAssignments}
                  renderItem={(a) => {
                    const g = guestsById.get(a.guest_id);
                    if (!g) return null;
                    const relation = relationsById.get(g.relation_id);
                    const isAssigned = assignedGuestIds.has(g.guest_id);
                    return (
                      <List.Item key={a.guest_id}>
                        <Space
                          direction="horizontal"
                          size={8}
                          align="center"
                          className={styles.fullWidth}
                        >
                          <Tag color="geekblue">Seat {a.seat_number}</Tag>
                          <DraggableGuestRow
                            guest={g}
                            relationName={relation?.name}
                            isAssigned={isAssigned}
                          />
                          <Space>
                            <Button
                              size="small"
                              onClick={() => {
                                ctx.moveGuestSeat?.(
                                  a.guest_id,
                                  selectedTable.table_id,
                                  Math.max(1, a.seat_number - 1),
                                );
                                ctx.messageApi?.success("Seat moved");
                              }}
                              icon={<LeftOutlined />}
                            />
                            <Button
                              size="small"
                              onClick={() => {
                                ctx.moveGuestSeat?.(
                                  a.guest_id,
                                  selectedTable.table_id,
                                  Math.min(
                                    selectedTable.total_number,
                                    a.seat_number + 1,
                                  ),
                                );
                                ctx.messageApi?.success("Seat moved");
                              }}
                              icon={<RightOutlined />}
                            />
                          </Space>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default SidePanel;
