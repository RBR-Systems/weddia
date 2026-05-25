import { SNAP_METERS } from "../constants/tableAssignment.constants";
import type { Relation, State, Guest, Table, TableAssignment, TableLayout } from "../models/tableAssignment.models";
import { applyAiSeating, moveGuestSeat } from "../utils/assignment.utils";
import { getActiveGridSize } from "../utils/table.utils";
import type { Action } from "./actions";

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
    tables: tablesRaw,
    assignments,
    metersToPixels: initialMetersToPixels,
    zoomScale: 1,
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
    case "INIT_DATA": {
      const { relations, guests, layouts, tables, assignments } = action.payload;
      return {
        ...state,
        relations,
        guests,
        layouts,
        tables,
        assignments,
      };
    }
    case "ADD_TABLE":
      return {
        ...state,
        tables: [...state.tables, action.payload],
      };
    case "UPDATE_TABLE":
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.table_id === action.payload.table_id ? { ...t, ...action.payload } : t,
        ),
      };
    case "REMOVE_TABLE":
      return {
        ...state,
        tables: state.tables.filter((t) => t.table_id !== action.payload),
        assignments: state.assignments.filter((a) => a.table_id !== action.payload),
      };
    case "SET_METERS_TO_PIXELS":
      return { ...state, metersToPixels: action.payload, pan: { x: 0, y: 0 } };
    case "SET_ZOOM_SCALE":
      return { ...state, zoomScale: action.payload };
    case "SET_PAN":
      return { ...state, pan: action.payload };
    case "SET_TABLES":
      return { ...state, tables: action.payload };
    case "MOVE_TABLE": {
      const { tableId, x_grid, y_grid } = action.payload;
      const tbl = state.tables.find((t) => t.table_id === tableId);
      if (!tbl) return state;

      const { xGridSize, yGridSize } = getActiveGridSize(state.layouts);
      const maxX = Math.max(0, xGridSize - tbl.width_m);
      const maxY = Math.max(0, yGridSize - tbl.height_m);

      const snappedX = Math.max(
        0,
        Math.min(maxX, Math.round(x_grid / SNAP_METERS) * SNAP_METERS),
      );
      const snappedY = Math.max(
        0,
        Math.min(maxY, Math.round(y_grid / SNAP_METERS) * SNAP_METERS),
      );
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.table_id === tableId ? { ...t, x_grid: snappedX, y_grid: snappedY } : t,
        ),
      };
    }
    case "SET_ASSIGNMENTS":
      return { ...state, assignments: action.payload };
    case "ASSIGN_GUEST": {
      const { tableId, guestId, seatNumber } = action.payload;
      return {
        ...state,
        assignments: [
          ...state.assignments.filter((a) => a.guest_id !== guestId),
          { table_id: tableId, guest_id: guestId, seat_number: seatNumber },
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
      return { ...state, assignments: [] };
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
      const assignments = applyAiSeating(
        state.guests,
        state.tables,
        state.assignments,
        action.payload,
      );
      return { ...state, assignments };
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
      const result = moveGuestSeat(
        state.guests,
        state.tables,
        state.assignments,
        action.payload,
      );
      return result ? { ...state, assignments: result } : state;
    }
    default:
      return state;
  }
}

