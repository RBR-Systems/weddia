import React from "react";
import { Card, Space, Input, Select, List, Tag, Empty } from "antd";
import { Segmented } from "antd";
import DraggableGuestRow from "../DraggableguestRow/DraggableGuestRow";
import UnassignedDropZone from "../UnassignedDropZone/UnassignedDropZone";
import styles from "./SidePanel.module.css";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
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
  filteredGuests: Guest[];
  relationsById: Map<string, any>;
  assignedGuestIds: Set<string>;
  selectedTable: any;
  selectedTableAssignments: TableAssignment[];
  selectedTablePeopleCount: number;
  guestsById: Map<string, Guest>;
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
    filteredGuests,
    relationsById,
    assignedGuestIds,
    selectedTable,
    selectedTableAssignments,
    selectedTablePeopleCount,
    guestsById,
  } = props;

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
                  <UserOutlined />
                  Guests
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
          </Space>
          <div className={styles.sideList + " " + styles.sideListHeight180}>
            <List
              size="small"
              dataSource={filteredGuests}
              renderItem={(g) => {
                const relation = relationsById.get(g.relation_id);
                const isAssigned = assignedGuestIds.has(g.guest_id);
                return (
                  <List.Item className={styles.guestRow}>
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
            <Empty description="Select a table to view details." />
          ) : (
            <>
              <div className={styles.tableDetailsHeader}>
                <Space size={10} align="center">
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
                      <List.Item>
                        <Space
                          direction="vertical"
                          size={6}
                          className={styles.fullWidth}
                        >
                          <Tag color="geekblue">Seat {a.seat_number}</Tag>
                          <DraggableGuestRow
                            guest={g}
                            relationName={relation?.name}
                            isAssigned={isAssigned}
                          />
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
