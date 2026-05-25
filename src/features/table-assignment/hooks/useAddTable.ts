import { useCallback } from "react";
import { apiPost } from "@/shared/api/apiClient";
import type { TableLayout, Table } from "../models/tableAssignment.models";
import type { ApiTable } from "../api/tableAssignmentApi";
import type { Action } from "../context/actions";
import { TABLE_SHAPE_DIMENSIONS, DEFAULT_TABLE_DIMENSION } from "../constants/tableAssignment.constants";

type Dispatch = React.Dispatch<Action>;

interface UseAddTableParams {
  activeLayout: TableLayout | null;
  getTables: () => Table[];
  dispatch: Dispatch;
}

export function useAddTable({ activeLayout, getTables, dispatch }: UseAddTableParams) {
  return useCallback(
    async (opts: { shape: string; seats: number; xGrid: number; yGrid: number; widthM: number; heightM: number }) => {
      if (!activeLayout) return;
      const tableNumber = (getTables().length ?? 0) + 1;
      const tempId = `table-${Date.now()}`;
      const newTable: Table = {
        table_id: tempId,
        layout_id: activeLayout.layout_id,
        total_number: opts.seats,
        shape: opts.shape,
        x_grid: opts.xGrid,
        y_grid: opts.yGrid,
        width_m: opts.widthM,
        height_m: opts.heightM,
      };
      dispatch({ type: "ADD_TABLE", payload: newTable });
      try {
        const created = await apiPost<ApiTable>(`/api/eventtables?adminId=1`, {
          layoutId: Number(activeLayout.layout_id),
          tableNumber,
          numberOfSeats: opts.seats,
          shape: opts.shape,
          xGrid: opts.xGrid,
          yGrid: opts.yGrid,
          widthM: opts.widthM,
          heightM: opts.heightM,
        });
        dispatch({
          type: "SET_TABLES",
          payload: getTables().map((t) =>
            t.table_id === tempId ? { ...t, table_id: String(created.tableId) } : t,
          ),
        });
      } catch (err) {
        console.error("addTable failed:", err);
        dispatch({ type: "REMOVE_TABLE", payload: tempId });
      }
    },
    [activeLayout, getTables, dispatch],
  );
}
