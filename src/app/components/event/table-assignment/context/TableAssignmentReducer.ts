import {
  DEFAULT_VENUE_HEIGHT_METERS,
  DEFAULT_VENUE_WIDTH_METERS,
  SNAP_METERS,
} from "../constants/constants";
import type {
  Guest,
  Relation,
  State,
  Table,
  TableAssignment,
  TableLayout,
} from "../models/types";
import { getNextAvailableSeatNumber } from "../utils/Table-Utils";
import { Action } from "./actions";

export function tableToMeters(
  t: Table,
  xGridCount = 10,
  yGridCount = 6,
): Table {
  let width = 1.8,
    height = 1.8;
  if (t.shape === "rectangular") {
    width = 2.0;
    height = 1.0;
  } else if (t.shape === "square") {
    width = 1.5;
    height = 1.5;
  }
  return {
    ...t,
    x_m: t.x_m ?? t.x_grid * (DEFAULT_VENUE_WIDTH_METERS / xGridCount),
    y_m: t.y_m ?? t.y_grid * (DEFAULT_VENUE_HEIGHT_METERS / yGridCount),
    width_m: width,
    height_m: height,
  };
}

export function createInitialState(
  relations: Relation[],
  guests: Guest[],
  layouts: TableLayout[],
  tablesRaw: Table[],
  assignments: TableAssignment[],
  initialMetersToPixels: number,
): State {
  const active = layouts.find((l) => l.is_active) ?? layouts[0];
  const xGridCount = active?.x_grid_size ?? 10;
  const yGridCount = active?.y_grid_size ?? 6;

  return {
    relations,
    guests,
    layouts,
    tables: tablesRaw.map((t) => tableToMeters(t, xGridCount, yGridCount)),
    assignments,
    metersToPixels: initialMetersToPixels,
    pan: { x: 0, y: 0 },
    selectedTableId: null,
    guestSearch: "",
    relationFilter: undefined,
    assignedFilter: "all",
    sideView: "guests",
    sidePanelOpen: true,
    aiChatOpen: false,
    activeDragId: null,
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_METERS_TO_PIXELS":
      return { ...state, metersToPixels: action.payload, pan: { x: 0, y: 0 } };
    case "SET_PAN":
      return { ...state, pan: action.payload };
    case "SET_TABLES":
      return {
        ...state,
        tables: action.payload.map((t: Table) => {
          const activeLayout =
            state.layouts.find((l) => l.is_active) ?? state.layouts[0];
          const xCount = activeLayout?.x_grid_size ?? 10;
          const yCount = activeLayout?.y_grid_size ?? 6;
          return tableToMeters(t, xCount, yCount);
        }),
      };
    case "MOVE_TABLE": {
      const { tableId, x_m, y_m } = action.payload;
      const tbl = state.tables.find((t) => t.table_id === tableId);
      if (!tbl) return state;

      // Get actual grid size from active layout
      const activeLayout =
        state.layouts.find((l) => l.is_active) ?? state.layouts[0];
      const eventWidth =
        activeLayout?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS;
      const eventHeight =
        activeLayout?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS;

      // Account for table dimensions to prevent it from going outside bounds
      const tableWidth = tbl.width_m ?? 0;
      const tableHeight = tbl.height_m ?? 0;
      const maxX = Math.max(0, eventWidth - tableWidth);
      const maxY = Math.max(0, eventHeight - tableHeight);

      const snappedX = Math.max(
        0,
        Math.min(maxX, Math.round(x_m / SNAP_METERS) * SNAP_METERS),
      );
      const snappedY = Math.max(
        0,
        Math.min(maxY, Math.round(y_m / SNAP_METERS) * SNAP_METERS),
      );
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.table_id === tableId ? { ...t, x_m: snappedX, y_m: snappedY } : t,
        ),
      };
    }
    case "SET_ASSIGNMENTS":
      return { ...state, assignments: action.payload };
    case "ASSIGN_GUEST": {
      const without = state.assignments.filter(
        (a) => a.guest_id !== action.payload.guestId,
      );
      return {
        ...state,
        assignments: [
          ...without,
          {
            table_id: action.payload.tableId,
            guest_id: action.payload.guestId,
            seat_number: action.payload.seatNumber,
          },
        ],
      };
    }
    case "UNASSIGN_GUEST":
      return {
        ...state,
        assignments: state.assignments.filter(
          (a) => a.guest_id !== action.payload.guestId,
        ),
      };
    case "UNASSIGN_ALL":
      return {
        ...state,
        assignments: [],
      };
    case "SET_SELECTED_TABLE":
      return {
        ...state,
        selectedTableId: action.payload,
        sideView: action.payload ? "table" : state.sideView,
      };
    case "SET_GUEST_SEARCH":
      return { ...state, guestSearch: action.payload };
    case "SET_RELATION_FILTER":
      return { ...state, relationFilter: action.payload };
    case "SET_ASSIGNED_FILTER":
      return { ...state, assignedFilter: action.payload };
    case "SET_SIDE_VIEW":
      return { ...state, sideView: action.payload };
    case "SET_SIDE_PANEL_OPEN":
      return { ...state, sidePanelOpen: action.payload };
    case "SET_AI_CHAT_OPEN":
      return { ...state, aiChatOpen: action.payload };
    case "SET_ACTIVE_DRAG_ID":
      return { ...state, activeDragId: action.payload };
    case "APPLY_AI_SEATING": {
      const assignmentsFromAI = action.payload;
      const withoutAI = state.assignments.filter(
        (a) => !assignmentsFromAI.find((x) => x.guestId === a.guest_id),
      );
      const usedSeats = new Map<string, number[]>();
      for (const a of withoutAI) {
        const arr = usedSeats.get(a.table_id) ?? [];
        arr.push(a.seat_number);
        usedSeats.set(a.table_id, arr);
      }
      const newAssignments: TableAssignment[] = [];
      for (const ai of assignmentsFromAI) {
        const tableId = ai.tableId;
        const tbl = state.tables.find((t) => t.table_id === tableId);
        if (!tbl) continue;
        const used = usedSeats.get(tableId) ?? [];
        const seat = getNextAvailableSeatNumber(tbl.total_number, used) ?? 1;
        used.push(seat);
        usedSeats.set(tableId, used);
        newAssignments.push({
          table_id: tableId,
          guest_id: ai.guestId,
          seat_number: seat,
        });
      }
      return { ...state, assignments: [...withoutAI, ...newAssignments] };
    }
    case "SET_ACTIVE_LAYOUT_GRID": {
      const { x_grid_size, y_grid_size } = action.payload;
      return {
        ...state,
        layouts: state.layouts.map((l) =>
          l.is_active ? { ...l, x_grid_size, y_grid_size } : l,
        ),
      };
    }
    case "MOVE_GUEST_SEAT": {
      const { guestId, tableId, seatNumber } = (action as any).payload;
      const oldAssign = state.assignments.find((a) => a.guest_id === guestId);
      const movingSize =
        state.guests.find((g) => g.guest_id === guestId)?.party_size ?? 1;

      // If guest wasn't assigned previously, just assign (caller should have validated)
      if (!oldAssign) {
        const without = state.assignments.filter((a) => a.guest_id !== guestId);
        return {
          ...state,
          assignments: [
            ...without,
            { table_id: tableId, guest_id: guestId, seat_number: seatNumber },
          ],
        };
      }

      const oldStart = oldAssign.seat_number;
      const oldEnd = oldStart + movingSize - 1;
      const newStart = seatNumber;
      const newEnd = newStart + movingSize - 1;

      const capacity =
        state.tables.find((t) => t.table_id === tableId)?.total_number ?? 0;

      if (newEnd > capacity) {
        // cannot move: would overflow table capacity
        try {
          // eslint-disable-next-line no-console
          console.warn(
            "MOVE_GUEST_SEAT aborted: new end exceeds table capacity",
            { guestId, tableId, newStart, newEnd, capacity },
          );
        } catch (e) {}
        return state;
      }

      // If no change
      if (newStart === oldStart) return state;

      // Gather assignments on same table excluding the mover
      const tableAssignments = state.assignments
        .filter((a) => a.table_id === tableId && a.guest_id !== guestId)
        .map((a) => ({ ...a }))
        .sort((a, b) => a.seat_number - b.seat_number);

      // Helper to get party size for an assignment
      const getSize = (a: any) =>
        state.guests.find((g) => g.guest_id === a.guest_id)?.party_size ?? 1;

      // If moving earlier: shift affected assignments right by movingSize
      if (newStart < oldStart) {
        const intervalStart = newStart;
        const intervalEnd = oldStart - 1;
        const affected = tableAssignments.filter((a) => {
          const aSize = getSize(a);
          const aEnd = a.seat_number + aSize - 1;
          return a.seat_number <= intervalEnd && aEnd >= intervalStart;
        });

        // perform shift: remove affected from remaining, then place mover at newStart, then place shifted affected in order
        const remaining = state.assignments.filter(
          (a) =>
            !(
              a.table_id === tableId &&
              affected.some((x) => x.guest_id === a.guest_id)
            ) && a.guest_id !== guestId,
        );

        const newAssignments: any[] = [...remaining];

        // Add mover at newStart
        newAssignments.push({
          table_id: tableId,
          guest_id: guestId,
          seat_number: newStart,
        });

        // Shift affected in ascending order
        for (const a of affected.sort(
          (x, y) => x.seat_number - y.seat_number,
        )) {
          const aSize = getSize(a);
          const newAStart = a.seat_number + movingSize;
          // ensure within capacity
          if (newAStart + aSize - 1 > capacity) {
            // abort and return previous state
            return state;
          }
          newAssignments.push({
            table_id: tableId,
            guest_id: a.guest_id,
            seat_number: newAStart,
          });
        }

        // keep other table assignments (already in remaining)
        try {
          // eslint-disable-next-line no-console
          console.log("MOVE_GUEST_SEAT_SHIFT_RIGHT", {
            guestId,
            tableId,
            newStart,
            movingSize,
            newAssignments,
          });
        } catch (e) {}
        return { ...state, assignments: newAssignments };
      }

      // If moving later: shift affected assignments left by movingSize
      if (newStart > oldStart) {
        const intervalStart = oldEnd + 1;
        const intervalEnd = newEnd;
        const affected = tableAssignments.filter((a) => {
          const aSize = getSize(a);
          const aEnd = a.seat_number + aSize - 1;
          return a.seat_number <= intervalEnd && aEnd >= intervalStart;
        });

        const remaining = state.assignments.filter(
          (a) =>
            !(
              a.table_id === tableId &&
              affected.some((x) => x.guest_id === a.guest_id)
            ) && a.guest_id !== guestId,
        );
        const newAssignments: any[] = [...remaining];

        // Add mover at newStart
        newAssignments.push({
          table_id: tableId,
          guest_id: guestId,
          seat_number: newStart,
        });

        // Shift affected in ascending order (we need to preserve order but compute new starts left)
        for (const a of affected.sort(
          (x, y) => x.seat_number - y.seat_number,
        )) {
          const aSize = getSize(a);
          const newAStart = a.seat_number - movingSize;
          if (newAStart < 1) {
            return state;
          }
          newAssignments.push({
            table_id: tableId,
            guest_id: a.guest_id,
            seat_number: newAStart,
          });
        }

        try {
          // eslint-disable-next-line no-console
          console.log("MOVE_GUEST_SEAT_SHIFT_LEFT", {
            guestId,
            tableId,
            newStart,
            movingSize,
            newAssignments,
          });
        } catch (e) {}

        return { ...state, assignments: newAssignments };
      }

      return state;
    }
    default:
      return state;
  }
}
