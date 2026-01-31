import React, { memo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { CSSProperties } from "react";
import styles from "../TableTile.module.css";
import type { Table } from "../../../models/types";
import TableTileContent from "../TableTileContent/TableTileContent";
import {
  getTableLabel,
  getBadgeColor,
  getTableShapeClass,
} from "../../../utils/Table-Utils";

export default memo(function DroppableTableTile({
  table,
  occupancy,
  isSelected,
  full,
  onSelect,
  metersToPixels,
}: {
  table: Table;
  occupancy: number;
  isSelected: boolean;
  full: boolean;
  onSelect: () => void;
  metersToPixels: number;
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
  const width = (table.width_m ?? 1.8) * metersToPixels;
  const height = (table.height_m ?? 1.8) * metersToPixels;

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
  };

  return (
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
      {...attributes}
      {...listeners}
    >
      <TableTileContent
        table={table}
        occupancy={occupancy}
        capacity={table.total_number}
        label={getTableLabel(table)}
        badgeColor={getBadgeColor(occupancy, table.total_number)}
        metersToPixels={metersToPixels}
      />
    </button>
  );
});
