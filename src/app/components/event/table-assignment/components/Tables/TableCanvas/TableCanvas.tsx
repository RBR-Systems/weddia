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
  zoomScale,
}: {
  tableOrder: string[];
  tablesForActiveLayoutById: Map<string, Table>;
  assignmentsByTable: Map<string, TableAssignment[]>;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  guestsById: Map<string, Guest>;
  metersToPixels: number;
  activeLayout: TableLayout;
  zoomScale: number;
}) {
  const eventWidthMeters =
    activeLayout?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS;
  const eventHeightMeters =
    activeLayout?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS;

  // Base dimensions at metersToPixels (no zoom)
  const baseWidth = eventWidthMeters * metersToPixels;
  const baseHeight = eventHeightMeters * metersToPixels;
  const padding = 16; // matches var(--spacing-sm) approx

  // Scaled dimensions for the sizer div so scrollbars reflect the zoomed size
  const scaledWidth = baseWidth * zoomScale + padding * 2;
  const scaledHeight = baseHeight * zoomScale + padding * 2;

  return (
    <div
      className={styles.canvasSizer}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
    >
      <div
        className={styles.tablesCanvas}
        style={
          {
            transform: `scale(${zoomScale})`,
            width: `${baseWidth + padding * 2}px`,
            height: `${baseHeight + padding * 2}px`,
          } as React.CSSProperties
        }
      >
        <div className={styles.canvasInner}>
          <div
            className={styles.venueWrap}
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
            }}
          >
            <div
              className={styles.venueOutline}
              style={{
                width: `${baseWidth}px`,
                height: `${baseHeight}px`,
              }}
            />

            {tableOrder
              .map((id) => tablesForActiveLayoutById.get(id))
              .filter((t): t is Table => Boolean(t))
              .map((t) => {
                const occupancy = (
                  assignmentsByTable.get(t.table_id) ?? []
                ).reduce((sum, a) => {
                  const g = guestsById.get(a.guest_id);
                  return sum + (g?.party_size ?? 1);
                }, 0);
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
                    assignments={assignmentsByTable.get(t.table_id) ?? []}
                    guestsById={guestsById}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
});
