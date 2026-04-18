import {
  DEFAULT_VENUE_HEIGHT_METERS,
  DEFAULT_VENUE_WIDTH_METERS,
  SNAP_METERS,
} from "../constants/tableAssignment.constants";
import type {
  Guest,
  Relation,
  State,
  Table,
  TableAssignment,
  TableLayout,
} from "../models/tableAssignment.models";
import { getNextAvailableSeatNumber } from "../utils/table.utils";
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
      const active = layouts.find((l) => l.is_active) ?? layouts[0];
      const xGridCount = active?.x_grid_size ?? 10;
      const yGridCount = active?.y_grid_size ?? 6;
      return {
        ...state,
        relations,
        guests,
        layouts,
        tables: tables.map((t) => tableToMeters(t as any, xGridCount, yGridCount)),
        assignments,
      };
    }
    case "ADD_TABLE": {
      const active = state.layouts.find((l) => l.is_active) ?? state.layouts[0];
      const xGridCount = active?.x_grid_size ?? 10;
      const yGridCount = active?.y_grid_size ?? 6;
      return {
        ...state,
        tables: [...state.tables, tableToMeters(action.payload, xGridCount, yGridCount)],
      };
    }
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
        // Account for party_size: mark all occupied seats
        const g = state.guests.find((g) => g.guest_id === a.guest_id);
        const ps = g?.party_size ?? (g?.plus_one ? 2 : 1);
        for (let s = a.seat_number; s < a.seat_number + ps; s += 1) {
          arr.push(s);
        }
        usedSeats.set(a.table_id, arr);
      }
      const newAssignments: TableAssignment[] = [];
      for (const ai of assignmentsFromAI) {
        const tableId = ai.tableId;
        const tbl = state.tables.find((t) => t.table_id === tableId);
        if (!tbl) continue;
        const aiGuest = state.guests.find((g) => g.guest_id === ai.guestId);
        const aiPartySize = aiGuest?.party_size ?? (aiGuest?.plus_one ? 2 : 1);
        const used = usedSeats.get(tableId) ?? [];
        const seat =
          getNextAvailableSeatNumber(tbl.total_number, used, aiPartySize) ?? 1;
        // Mark all seats occupied by this party
        for (let s = seat; s < seat + aiPartySize; s += 1) {
          used.push(s);
        }
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

      // Cross-table move: simply remove old assignment and place at new table/seat
      if (oldAssign.table_id !== tableId) {
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
      const newStart = seatNumber;
      const newEnd = newStart + movingSize - 1;

      const capacity =
        state.tables.find((t) => t.table_id === tableId)?.total_number ?? 0;

      if (newEnd > capacity || newStart < 1) {
        return state;
      }

      // If no change
      if (newStart === oldStart) return state;

      // Helper to get party size for an assignment
      const getSize = (a: { guest_id: string }) =>
        state.guests.find((g) => g.guest_id === a.guest_id)?.party_size ?? 1;

      // Gather all assignments on this table, sorted by seat_number
      const tableAssignments = state.assignments
        .filter((a) => a.table_id === tableId)
        .map((a) => ({ ...a }))
        .sort((a, b) => a.seat_number - b.seat_number);

      // Non-table assignments (other tables)
      const otherTableAssignments = state.assignments.filter(
        (a) => a.table_id !== tableId,
      );

      // Separate the mover from the rest
      const rest = tableAssignments.filter((a) => a.guest_id !== guestId);

      // Determine which guests in `rest` overlap with the mover's NEW range
      // These are the "displaced" guests that need to be repacked
      const displaced: typeof rest = [];
      const untouched: typeof rest = [];
      for (const a of rest) {
        const aSize = getSize(a);
        const aEnd = a.seat_number + aSize - 1;
        // Check if this assignment overlaps the mover's new range [newStart, newEnd]
        if (a.seat_number <= newEnd && aEnd >= newStart) {
          displaced.push(a);
        } else {
          untouched.push(a);
        }
      }

      // If no displacement, just place the mover at the new seat
      if (displaced.length === 0) {
        const newAssignments = [
          ...otherTableAssignments,
          ...rest,
          { table_id: tableId, guest_id: guestId, seat_number: newStart },
        ];
        return { ...state, assignments: newAssignments };
      }

      // Repack displaced guests into the space vacated by the mover
      // When moving left: mover frees [oldStart, oldStart+movingSize-1], displaced go to old mover range onward
      // When moving right: mover frees [oldStart, oldStart+movingSize-1], displaced go to old mover range onward
      // General approach: pack displaced guests into the gap left by the mover,
      // starting from the earliest free seat in the mover's old range.

      // Build the occupied-seat set from untouched guests + mover at new position
      const occupied = new Set<number>();
      for (const a of untouched) {
        const aSize = getSize(a);
        for (let s = a.seat_number; s < a.seat_number + aSize; s += 1) {
          occupied.add(s);
        }
      }
      // Mark mover's new range as occupied
      for (let s = newStart; s <= newEnd; s += 1) {
        occupied.add(s);
      }

      // Sort displaced by their original seat order (preserve relative ordering)
      displaced.sort((a, b) => a.seat_number - b.seat_number);

      // Pack displaced guests into free seats anywhere on the table.
      // Search from seat 1 so we consider the entire table, not just
      // the area around the mover.
      const repackedAssignments: typeof rest = [];
      let cursor = 1;
      for (const a of displaced) {
        const aSize = getSize(a);
        // Find next contiguous free block of `aSize` seats starting from cursor
        while (cursor <= capacity - aSize + 1) {
          let fits = true;
          for (let s = cursor; s < cursor + aSize; s += 1) {
            if (occupied.has(s)) {
              fits = false;
              break;
            }
          }
          if (fits) break;
          cursor += 1;
        }
        // Check if we found a valid spot
        if (cursor + aSize - 1 > capacity) {
          // Can't fit — abort the move entirely
          return state;
        }
        repackedAssignments.push({
          ...a,
          seat_number: cursor,
        });
        // Mark these seats as occupied
        for (let s = cursor; s < cursor + aSize; s += 1) {
          occupied.add(s);
        }
        cursor += aSize;
      }

      const newAssignments = [
        ...otherTableAssignments,
        ...untouched,
        { table_id: tableId, guest_id: guestId, seat_number: newStart },
        ...repackedAssignments,
      ];

      return { ...state, assignments: newAssignments };
    }
    default:
      return state;
  }
}
