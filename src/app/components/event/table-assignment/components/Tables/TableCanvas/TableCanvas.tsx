import React, { memo } from "react";
import type {
  Table,
  TableAssignment,
  TableLayout,
  Guest,
} from "../../../models/types";
import DroppableTableTile from "../DroppableTableTile/DroppableTableTile";
import styles from "./TableCanvas.module.css";
import {
  DEFAULT_VENUE_WIDTH_METERS,
  DEFAULT_VENUE_HEIGHT_METERS,
} from "../../../constants/constants";

export default memo(function TablesCanvas({
  tableOrder,
  tablesForActiveLayoutById,
  assignmentsByTable,
  selectedTableId,
  onSelectTable,
  guestsById,
  metersToPixels,
  activeLayout,
}: {
  tableOrder: string[];
  tablesForActiveLayoutById: Map<string, Table>;
  assignmentsByTable: Map<string, TableAssignment[]>;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  guestsById: Map<string, Guest>;
  metersToPixels: number;
  activeLayout: TableLayout;
}) {
  const eventWidthMeters =
    activeLayout?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS;
  const eventHeightMeters =
    activeLayout?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS;
  const maxMeters = Math.max(eventWidthMeters, eventHeightMeters);
  const canvasSize = maxMeters * metersToPixels;

  return (
    <div className={styles.tablesCanvas}>
      <div
        className={styles.canvasInner}
        style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
      >
        <div
          className={styles.venueOutline}
          style={{
            width: `${eventWidthMeters * metersToPixels}px`,
            height: `${eventHeightMeters * metersToPixels}px`,
          }}
        />
        {tableOrder
          .map((id) => tablesForActiveLayoutById.get(id))
          .filter((t): t is Table => Boolean(t))
          .map((t) => {
            const occupancy = (assignmentsByTable.get(t.table_id) ?? []).reduce(
              (sum, a) => {
                const g = guestsById.get(a.guest_id);
                return sum + (g?.party_size ?? 1);
              },
              0,
            );
            const isSelected = t.table_id === selectedTableId;
            const full = occupancy >= t.total_number;
            return (
              <DroppableTableTile
                key={t.table_id}
                table={t}
                occupancy={occupancy}
                isSelected={isSelected}
                full={full}
                onSelect={() => onSelectTable(t.table_id)}
                metersToPixels={metersToPixels}
              />
            );
          })}
      </div>
    </div>
  );
});
