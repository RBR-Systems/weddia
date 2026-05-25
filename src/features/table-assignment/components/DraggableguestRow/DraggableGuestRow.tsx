import { memo, useMemo, type CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Tag, Typography, Select, Button } from "antd";
import styles from "./DraggableGuestRow.module.css";
import type { Guest, Table, TableAssignment } from "../../models/tableAssignment.models";
import { fullName, getNextAvailableSeatNumber, getTableLabel } from "../../utils/table.utils";
import { WarningOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
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
    guestsById,
    messageApi,
    moveGuestSeat,
    unassignGuest,
  } = useTableAssignmentContext();
  const { t } = useTranslation();

  const assignmentsMap = assignmentsByTable as Map<string, TableAssignment[]>;

  const assignedTableId = useMemo(() => {
    for (const [tableId, arr] of Array.from(assignmentsMap.entries())) {
      if (arr.some((a: TableAssignment) => a.guest_id === guest.guest_id)) return tableId;
    }
    return null;
  }, [assignmentsMap, guest.guest_id]);

  const assignedAssignment = useMemo(() => {
    for (const [, arr] of Array.from(assignmentsMap.entries())) {
      const a = arr.find((x: TableAssignment) => x.guest_id === guest.guest_id);
      if (a) return a;
    }
    return null;
  }, [assignmentsMap, guest.guest_id]);

  const partySize = guest.party_size ?? (guest.plus_one ? 2 : 1);

  const tableOptions = useMemo(() => {
    return tablesForActiveLayout
      .map((t: Table) => {
        const assignments = assignmentsByTable.get(t.table_id) ?? [];
        const usedOccupancy = assignments.reduce((sum: number, a: TableAssignment) => {
          const g = guestsById.get(a.guest_id);
          return sum + (g?.party_size ?? (g?.plus_one ? 2 : 1));
        }, 0);
        const isAssignedHere = assignments.some(
          (a: TableAssignment) => a.guest_id === guest.guest_id,
        );
        const selfOccupancy = isAssignedHere ? partySize : 0;
        const available = Math.max(
          0,
          t.total_number - usedOccupancy + selfOccupancy,
        );
        if (available >= partySize || isAssignedHere) {
          return { value: t.table_id, label: getTableLabel(t) };
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { guestId: guest.guest_id },
  });

  const style: CSSProperties = {};

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={[styles.guestCard, isDragging ? styles.dragging : ""].join(" ")}
    >
      {/* Row 1: drag handle + name + tags */}
      <div className={styles.nameRow}>
        <span className={styles.dragDot}>⠿</span>
        <div className={styles.nameAndTags}>
          <Typography.Text strong className={styles.guestName}>
            {!isAssigned && (
              <WarningOutlined className={styles.warningIcon} />
            )}
            {fullName(guest)}
          </Typography.Text>

          {!isDragging && (
            <div className={styles.tagRow}>
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
            </div>
          )}
        </div>
      </div>

      {/* Row 2: table select + unassign button */}
      {!isDragging && (
        <div className={styles.actionRow}>
          <Select
            placeholder={t("tableAssignment.assignToTable")}
            options={tableOptions}
            value={assignedTableId ?? undefined}
            className={styles.tableSelect}
            size="small"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(tableId: string) => {
              const targetTable = tablesForActiveLayout.find(
                (t: Table) => t.table_id === tableId,
              );
              if (!targetTable) return;
              if (tableId === assignedTableId) return;
              const usedSeatNumbers: number[] = [];
              for (const a of assignmentsByTable.get(tableId) ?? []) {
                if (a.guest_id === guest.guest_id) continue;
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
              moveGuestSeat?.(guest.guest_id, tableId, seat);
            }}
          />

          {isAssigned && (
            <Button
              danger
              type="text"
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                unassignGuest?.(guest.guest_id);
                messageApi?.success(t("tableAssignment.guestUnassigned"));
              }}
              icon={<DeleteOutlined />}
            />
          )}
        </div>
      )}
    </div>
  );
});

