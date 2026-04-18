import React, { memo, useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { CSSProperties } from "react";
import styles from "../TableTileContent/TableTile.module.css";
import { Popover } from "antd";
import type { Table, TableAssignment, Guest } from "../../../models/tableAssignment.models";
import TableTileContent from "../TableTileContent/TableTileContent";
import {
  getTableLabel,
  getBadgeColor,
  getTableShapeClass,
} from "../../../utils/table.utils";
import { useTranslation } from "react-i18next";

function SeatTile({
  tableId,
  num,
  assign,
  guest,
  indexInParty = 0,
}: {
  tableId: string;
  num: number;
  assign?: TableAssignment | undefined;
  guest?: Guest | null | undefined;
  indexInParty?: number;
}) {
  const { t } = useTranslation();
  const { setNodeRef: setSeatRef, isOver: seatOver } = useDroppable({
    id: `table:${tableId}:seat:${num}`,
    data: { tableId, seatNumber: num },
  });
  const nameLabel = guest
    ? `${guest.first_name}${indexInParty > 0 ? ` +${indexInParty}` : ""}`
    : "—";
  const titleLabel = guest
    ? `${guest.first_name} ${guest.last_name}`
    : t("tableAssignment.seatNumber", { number: num });
  return (
    <div
      ref={setSeatRef}
      key={num}
      className={[styles.seat, seatOver ? styles.seatOver : ""].join(" ")}
      title={titleLabel}
    >
      <div className={styles.seatNumber}>{num}</div>
      <div className={styles.seatName}>{nameLabel}</div>
    </div>
  );
}

export default memo(function DroppableTableTile({
  table,
  occupancy,
  isSelected,
  full,
  onSelect,
  metersToPixels,
  assignments = [],
  guestsById,
}: {
  table: Table;
  occupancy: number;
  isSelected: boolean;
  full: boolean;
  onSelect: () => void;
  metersToPixels: number;
  assignments?: TableAssignment[];
  guestsById?: Map<string, Guest>;
}) {
  const dropId = `table:${table.table_id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { tableId: table.table_id },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dropId,
    data: { tableId: table.table_id, type: "table" },
  });

  const left = (table.x_m ?? 0) * metersToPixels;
  const top = (table.y_m ?? 0) * metersToPixels;
  const width = (table.width_m ?? 0) * metersToPixels;
  const height = (table.height_m ?? 0) * metersToPixels;

  const style: CSSProperties = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    position: "absolute",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const setRefs = (el: HTMLButtonElement | null) => {
    setDropRef(el);
    setDragRef(el);
    tileRef.current = el;
  };

  const tileRef = useRef<HTMLButtonElement | null>(null);

  // Scroll into view when this tile is selected from an external source
  useEffect(() => {
    if (isSelected && tileRef.current) {
      tileRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [isSelected]);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const seatCount = table.total_number ?? 0;

  const popContent = (
    <div className={styles.popoverSeats}>
      {Array.from({ length: seatCount }, (_, i) => i + 1).map((n) => {
        const assign = assignments.find((a) => {
          const g = guestsById?.get(a.guest_id);
          const ps = g ? (g.party_size ?? (g.plus_one ? 2 : 1)) : 1;
          return n >= a.seat_number && n < a.seat_number + ps;
        });
        const guest = assign ? guestsById?.get(assign.guest_id) : null;
        const indexInParty = assign ? n - assign.seat_number : 0;
        return (
          <SeatTile
            key={`popover-seat-${n}`}
            tableId={table.table_id}
            num={n}
            assign={assign}
            guest={guest}
            indexInParty={indexInParty}
          />
        );
      })}
    </div>
  );

  return (
    <Popover
      content={popContent}
      open={popoverOpen}
      onOpenChange={(v) => setPopoverOpen(v)}
      placement="right"
      getPopupContainer={() => document.body}
    >
      <button
        ref={setRefs}
        type="button"
        style={style}
        className={[
          styles.tableTile,
          getTableShapeClass(table.shape),
          isSelected ? styles.tableTileSelected : "",
          isOver ? styles.tableTileOver : "",
        ].join(" ")}
        onClick={onSelect}
        onMouseEnter={() => setPopoverOpen(true)}
        onMouseLeave={() => setPopoverOpen(false)}
        {...attributes}
        {...listeners}
      >
        <TableTileContent
          table={table}
          occupancy={occupancy}
          capacity={table.total_number}
          label={getTableLabel(table)}
          badgeColor={getBadgeColor(occupancy, table.total_number)}
        />
      </button>
    </Popover>
  );
});
