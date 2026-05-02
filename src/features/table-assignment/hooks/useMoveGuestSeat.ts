import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { Table, Guest as TAGuest, TableAssignment } from "../models/tableAssignment.models";
import type { Action } from "../context/actions";
import { fullName } from "../utils/table.utils";

type Dispatch = React.Dispatch<Action>;
type SeatsFitAt = (tableId: string, startSeat: number, partySize: number, assignments: TableAssignment[], movingGuestId?: string) => boolean;
type PersistAssignment = (type: "assign" | "move" | "unassign", guestId: string, tableId: string, seatNumber?: number) => void;

interface UseMoveGuestSeatParams {
  notifier: MessageInstance;
  guestsById: Map<string, TAGuest>;
  tablesForActiveLayout: Table[];
  seatsFitAt: SeatsFitAt;
  persistAssignment: PersistAssignment;
  getAssignments: () => TableAssignment[];
  dispatch: Dispatch;
}

export function useMoveGuestSeat({
  notifier,
  guestsById,
  tablesForActiveLayout,
  seatsFitAt,
  persistAssignment,
  getAssignments,
  dispatch,
}: UseMoveGuestSeatParams) {
  return useCallback(
    (guestId: string, tableId: string, seatNumber: number): boolean => {
      const g = guestsById.get(guestId);
      const movingSize = g?.party_size ?? (g?.plus_one ? 2 : 1);
      const table = tablesForActiveLayout.find((t) => t.table_id === tableId);
      const capacity = table?.total_number ?? 0;
      const currentAssignments = getAssignments();
      const oldAssign = currentAssignments.find((a) => a.guest_id === guestId);

      if (!oldAssign) {
        if (!seatsFitAt(tableId, seatNumber, movingSize, currentAssignments, guestId)) {
          notifier.error("Not enough contiguous seats for that guest's party");
          return false;
        }
        persistAssignment("assign", guestId, tableId, seatNumber);
        dispatch({ type: "ASSIGN_GUEST", payload: { tableId, guestId, seatNumber } });
        notifier.success(g ? `${fullName(g)} assigned to ${tableId}` : "Assigned");
        return true;
      }

      if (oldAssign.table_id !== tableId) {
        if (!seatsFitAt(tableId, seatNumber, movingSize, currentAssignments, guestId)) {
          notifier.error("Not enough contiguous seats for that guest's party on the target table");
          return false;
        }
        persistAssignment("move", guestId, tableId, seatNumber);
        dispatch({ type: "MOVE_GUEST_SEAT", payload: { guestId, tableId, seatNumber } });
        notifier.success(g ? `${fullName(g)} moved to ${tableId}` : "Moved");
        return true;
      }

      const targetEnd = seatNumber + movingSize - 1;
      if (seatNumber < 1 || targetEnd > capacity) {
        notifier.error("Not enough seats on table to place that party at the requested position");
        return false;
      }
      if (seatNumber === oldAssign.seat_number) {
        notifier.info("Already at requested seat");
        return true;
      }

      persistAssignment("move", guestId, tableId, seatNumber);
      dispatch({ type: "MOVE_GUEST_SEAT", payload: { guestId, tableId, seatNumber } });
      notifier.success(g ? `${fullName(g)} moved` : "Moved");
      return true;
    },
    [notifier, guestsById, tablesForActiveLayout, seatsFitAt, persistAssignment, getAssignments, dispatch],
  );
}
