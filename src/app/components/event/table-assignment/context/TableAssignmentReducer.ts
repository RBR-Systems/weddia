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

export function tableToMeters(t: Table): Table {
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
    x_m: t.x_m ?? t.x_grid * (DEFAULT_VENUE_WIDTH_METERS / 10),
    y_m: t.y_m ?? t.y_grid * (DEFAULT_VENUE_HEIGHT_METERS / 6),
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
  return {
    relations,
    guests,
    layouts,
    tables: tablesRaw.map(tableToMeters),
    assignments,
    metersToPixels: initialMetersToPixels,
    pan: { x: 0, y: 0 },
    selectedTableId: null,
    guestSearch: "",
    relationFilter: undefined,
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
      return { ...state, tables: action.payload.map(tableToMeters) };
    case "MOVE_TABLE": {
      const { tableId, x_m, y_m } = action.payload;
      const tbl = state.tables.find((t) => t.table_id === tableId);
      if (!tbl) return state;
      const eventWidth =
        state.layouts.find((l) => l.is_active)?.x_grid_size ??
        DEFAULT_VENUE_WIDTH_METERS;
      const eventHeight =
        state.layouts.find((l) => l.is_active)?.y_grid_size ??
        DEFAULT_VENUE_HEIGHT_METERS;
      const snappedX = Math.max(
        0,
        Math.min(
          eventWidth - (tbl.width_m ?? 1.8),
          Math.round(x_m / SNAP_METERS) * SNAP_METERS,
        ),
      );
      const snappedY = Math.max(
        0,
        Math.min(
          eventHeight - (tbl.height_m ?? 1.8),
          Math.round(y_m / SNAP_METERS) * SNAP_METERS,
        ),
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
    default:
      return state;
  }
}
