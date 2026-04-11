import React, { memo, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Space, Tag, Typography, Select, Button } from "antd";
import type { CSSProperties } from "react";
import styles from "./DraggableGuestRow.module.css";
import type { Guest } from "../../models/types";
import {
  fullName,
  getNextAvailableSeatNumber,
  getTableLabel,
} from "../../utils/Table-Utils";
import { WarningOutlined } from "@ant-design/icons";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import { DeleteOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export default memo(function DraggableGuestRow({
  guest,
  relationName,
  isAssigned,
}: {
  guest: Guest;
  relationName?: string;
  isAssigned: boolean;
}) {
  const {
    tablesForActiveLayout,
    assignmentsByTable,
    dispatch,
    guestsById,
    messageApi,
  } = useTableAssignmentContext();
  const { t } = useTranslation();

  const assignedTableId = useMemo(() => {
    const assignmentsMap = assignmentsByTable as Map<string, any[]>;
    for (const [tableId, arr] of Array.from(assignmentsMap.entries())) {
      if (arr.some((a: any) => a.guest_id === guest.guest_id)) return tableId;
    }
    return null;
  }, [assignmentsByTable, guest.guest_id]);

  const assignedAssignment = useMemo(() => {
    const assignmentsMap = assignmentsByTable as Map<string, any[]>;
    for (const [, arr] of Array.from(assignmentsMap.entries())) {
      const a = arr.find((x: any) => x.guest_id === guest.guest_id);
      if (a) return a;
    }
    return null;
  }, [assignmentsByTable, guest.guest_id]);

  const partySize = guest.party_size ?? (guest.plus_one ? 2 : 1);

  const tableOptions = useMemo(() => {
    return tablesForActiveLayout
      .map((t: any) => {
        const assignments = assignmentsByTable.get(t.table_id) ?? [];
        const usedOccupancy = assignments.reduce((sum: number, a: any) => {
          const g = guestsById.get(a.guest_id);
          return sum + (g?.party_size ?? (g?.plus_one ? 2 : 1));
        }, 0);
        const isAssignedHere = assignments.some(
          (a: any) => a.guest_id === guest.guest_id,
        );
        // If already assigned here, subtract own party_size from used
        const selfOccupancy = isAssignedHere ? partySize : 0;
        const available = Math.max(
          0,
          t.total_number - usedOccupancy + selfOccupancy,
        );
        if (available >= partySize || isAssignedHere) {
          return {
            value: t.table_id,
            label: getTableLabel(t),
          };
        }
        return null;
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [
    tablesForActiveLayout,
    assignmentsByTable,
    guestsById,
    guest.party_size,
    guest.guest_id,
    partySize,
  ]);

  const dragId = `guest:${guest.guest_id}`;
  const { attributes, listeners, setNodeRef, /* transform, */ isDragging } =
    useDraggable({
      id: dragId,
      data: { guestId: guest.guest_id },
    });

  // We intentionally don't apply `transform` to the original row so the
  // DragOverlay is the only visual moving element. Original row remains
  // in place while dragging; non-name content is hidden below when active.
  const style: CSSProperties = {};

  return (
    <div
      ref={setNodeRef}
      // attach listeners/attributes to the whole row so drag can start
      // from anywhere on the component
      {...listeners}
      {...attributes}
      style={style}
      className={[
        styles.draggableGuest,
        isDragging ? styles.dragging : "",
      ].join(" ")}
    >
      <Space orientation="vertical" size={6} className={styles.fullWidth}>
        <Space size={8} wrap>
          <Typography.Text strong className={styles.dragHandle}>
            {!isAssigned ? (
              <>
                <WarningOutlined style={{ color: "orange", marginRight: 6 }} />
                {fullName(guest)}
              </>
            ) : (
              fullName(guest)
            )}
          </Typography.Text>
          {!isDragging && (
            <>
              {relationName ? (
                <Tag color="gold">{relationName}</Tag>
              ) : (
                <Tag>{t("tableAssignment.unknownRelation")}</Tag>
              )}
              {!isAssigned && <Tag>{t("tableAssignment.unassignedTag")}</Tag>}
              {guest.plus_one ? <Tag color="purple">+1</Tag> : null}
              {assignedAssignment ? (
                <Tag color="blue">
                  {t("tableAssignment.seatLabel", {
                    seats: Array.from(
                      { length: partySize },
                      (_, i) => assignedAssignment.seat_number + i,
                    ).join(", "),
                  })}
                </Tag>
              ) : null}
              {guest.dietary_restrictions ? (
                <Tag color="green">{guest.dietary_restrictions}</Tag>
              ) : null}
              {guest.accessibility_needs ? (
                <Tag color="red">{guest.accessibility_needs}</Tag>
              ) : null}
            </>
          )}
        </Space>

        <Space
          size={10}
          align="center"
          style={{ width: "100%", margin: "10px 0px 10px 0px" }}
        >
          <Select
            placeholder={t("tableAssignment.assignToTable")}
            options={tableOptions}
            value={assignedTableId ?? undefined}
            style={{ minWidth: 160, flex: 1 }}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(tableId: string) => {
              const targetTable = tablesForActiveLayout.find(
                (t: any) => t.table_id === tableId,
              );
              if (!targetTable) return;
              if (tableId === assignedTableId) return;
              // Build used-seat set accounting for party_size of each occupant
              const usedSeatNumbers: number[] = [];
              for (const a of assignmentsByTable.get(tableId) ?? []) {
                if (a.guest_id === guest.guest_id) continue; // exclude self when reassigning
                const g = guestsById.get(a.guest_id);
                const ps = g?.party_size ?? (g?.plus_one ? 2 : 1);
                for (let s = a.seat_number; s < a.seat_number + ps; s += 1) {
                  usedSeatNumbers.push(s);
                }
              }
              const seat = getNextAvailableSeatNumber(
                targetTable.total_number,
                usedSeatNumbers,
                partySize,
              );
              if (!seat) {
                messageApi?.warning(t("tableAssignment.tableFull"));
                return;
              }
              dispatch({
                type: "ASSIGN_GUEST",
                payload: { tableId, guestId: guest.guest_id, seatNumber: seat },
              });
              messageApi?.success(
                t("tableAssignment.reassigned", {
                  name: fullName(guest),
                  table: tableId,
                }),
              );
            }}
          />

          {isAssigned ? (
            !isDragging ? (
              <Button
                danger
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  dispatch({
                    type: "UNASSIGN_GUEST",
                    payload: { guestId: guest.guest_id },
                  });
                  messageApi?.success(t("tableAssignment.guestUnassigned"));
                }}
                icon={<DeleteOutlined />}
              ></Button>
            ) : null
          ) : null}
        </Space>
      </Space>
    </div>
  );
});
