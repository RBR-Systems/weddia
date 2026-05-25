import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import { apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import type { TableAssignment } from "../models/tableAssignment.models";

export function usePersistAssignment(
  message: MessageInstance,
  getAssignments: () => TableAssignment[],
) {
  return useCallback(
    (
      type: "assign" | "move" | "unassign",
      guestId: string,
      tableId: string,
      seatNumber?: number,
    ) => {
      if (tableId.startsWith("table-")) {
        console.warn("[persistAssignment] Temp table id — skipping API call", { tableId });
        return;
      }

      const prev = getAssignments().find((a) => a.guest_id === guestId);

      const handleError = (label: string) => (e: unknown) => {
        console.error(`[persistAssignment] ${label} failed:`, e);
        message.error(`Error al guardar asignación: ${label}`);
      };

      if (type === "unassign") {
        if (prev) {
          apiDelete(`/api/tableassignments/${prev.table_id}/${guestId}`)
            .catch(handleError("unassign"));
        }
      } else if (type === "assign") {
        apiPost(`/api/tableassignments?adminId=1`, {
          tableId: Number(tableId),
          guestId: Number(guestId),
          seatNumber: seatNumber ?? 1,
        }).catch(handleError("assign"));
      } else if (type === "move") {
        if (prev && prev.table_id === tableId) {
          apiPut(`/api/tableassignments/${tableId}/${guestId}?adminId=1`, {
            seatNumber: seatNumber ?? prev.seat_number,
          }).catch(handleError("move-same-table"));
        } else if (prev) {
          apiDelete(`/api/tableassignments/${prev.table_id}/${guestId}`)
            .then(() =>
              apiPost(`/api/tableassignments?adminId=1`, {
                tableId: Number(tableId),
                guestId: Number(guestId),
                seatNumber: seatNumber ?? 1,
              }),
            )
            .catch(handleError("move-cross-table"));
        } else {
          apiPost(`/api/tableassignments?adminId=1`, {
            tableId: Number(tableId),
            guestId: Number(guestId),
            seatNumber: seatNumber ?? 1,
          }).catch(handleError("assign-new"));
        }
      }
    },
    [message, getAssignments],
  );
}
