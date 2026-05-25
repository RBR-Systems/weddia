import { useCallback } from "react";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type {
  DragId,
  Guest,
  State,
  Table,
  TableAssignment,
} from "../models/tableAssignment.models";
import {
  DEFAULT_VENUE_WIDTH_METERS,
  DEFAULT_VENUE_HEIGHT_METERS,
} from "../constants/tableAssignment.constants";
import {
  fullName,
  getGuestPartySize,
  parseGuestIdFromDragId,
  parseSeatDropTarget,
  parseTableDropTarget,
  findFirstAvailableSeat,
} from "../utils/table.utils";
import { apiPut } from "@/shared/api/apiClient";
import type { Action } from "../context/actions";

interface Notifier {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
}

interface DragHandlersDeps {
  dispatch: React.Dispatch<Action>;
  stateRef: React.MutableRefObject<State>;
  tablesForActiveLayout: Table[];
  guestsById: Map<string, Guest>;
  seatsFitAt: (
    tableId: string,
    startSeat: number,
    partySize: number,
    assignments: TableAssignment[],
    movingGuestId?: string,
  ) => boolean;
  persistAssignment: (
    type: "assign" | "move" | "unassign",
    guestId: string,
    tableId: string,
    seatNumber?: number,
  ) => void;
  notifier: Notifier;
}

interface DragContext {
  currentState: State;
  tablesForActiveLayout: Table[];
  guestsById: Map<string, Guest>;
  seatsFitAt: DragHandlersDeps["seatsFitAt"];
  persistAssignment: DragHandlersDeps["persistAssignment"];
  dispatch: React.Dispatch<Action>;
  notifier: Notifier;
}

function handleTableDrag(evt: DragEndEvent, ctx: DragContext): void {
  const tableId = (evt.active.id as string).slice("table:".length);
  const { currentState, dispatch, notifier } = ctx;

  const deltaMetersX =
    evt.delta.x / (currentState.metersToPixels * currentState.zoomScale);
  const deltaMetersY =
    evt.delta.y / (currentState.metersToPixels * currentState.zoomScale);

  const table = currentState.tables.find((t) => t.table_id === tableId);
  if (!table) return;

  const newX = (table.x_m ?? 0) + deltaMetersX;
  const newY = (table.y_m ?? 0) + deltaMetersY;
  dispatch({ type: "MOVE_TABLE", payload: { tableId, x_m: newX, y_m: newY } });

  const activeLayout =
    currentState.layouts.find((l) => l.is_active) ?? currentState.layouts[0];
  if (activeLayout) {
    const xGrid = Math.max(
      0,
      Math.round(newX / (DEFAULT_VENUE_WIDTH_METERS / activeLayout.x_grid_size)),
    );
    const yGrid = Math.max(
      0,
      Math.round(newY / (DEFAULT_VENUE_HEIGHT_METERS / activeLayout.y_grid_size)),
    );
    apiPut(`/api/eventtables/${tableId}?adminId=1`, {
      layoutId: Number(activeLayout.layout_id),
      numberOfSeats: table.total_number ?? 8,
      shape: table.shape ?? "round",
      xGrid,
      yGrid,
    }).catch(console.error);
  }

  notifier.success(`Table ${tableId} repositioned`);
}

function handleGuestUnassign(
  guestId: string,
  ctx: DragContext,
): void {
  const prevAssignment = ctx.currentState.assignments.find(
    (a) => a.guest_id === guestId,
  );
  ctx.dispatch({ type: "UNASSIGN_GUEST", payload: { guestId } });
  if (prevAssignment) {
    ctx.persistAssignment("unassign", guestId, prevAssignment.table_id);
  }
  ctx.notifier.success("Guest unassigned");
}

function handleSeatDrop(
  guestId: string,
  target: { tableId: string; seatNumber: number },
  ctx: DragContext,
): void {
  const { tableId, seatNumber } = target;
  const {
    tablesForActiveLayout,
    guestsById,
    seatsFitAt,
    persistAssignment,
    dispatch,
    notifier,
    currentState,
  } = ctx;
  const assignments = currentState.assignments;

  const targetTable = tablesForActiveLayout.find(
    (t) => t.table_id === tableId,
  );
  if (!targetTable) return;

  const occupant = assignments.find((a) => {
    if (a.table_id !== tableId) return false;
    const g = guestsById.get(a.guest_id);
    const ps = getGuestPartySize(g);
    return seatNumber >= a.seat_number && seatNumber < a.seat_number + ps;
  });

  const guestAssigned = assignments.find((a) => a.guest_id === guestId);
  const guest = guestsById.get(guestId);
  const partySize = getGuestPartySize(guest);

  if (!occupant) {
    if (!seatsFitAt(tableId, seatNumber, partySize, assignments, guestId)) {
      notifier.error("Not enough contiguous seats for that guest's party");
      return;
    }
    persistAssignment("move", guestId, tableId, seatNumber);
    dispatch({
      type: "MOVE_GUEST_SEAT",
      payload: { guestId, tableId, seatNumber },
    });
    notifier.success(
      guest ? `${fullName(guest)} assigned to ${tableId}` : "Assigned",
    );
    return;
  }

  // Occupied seat and guest already assigned → swap
  if (guestAssigned) {
    const occGuest = guestsById.get(occupant.guest_id);
    const occSize = getGuestPartySize(occGuest);
    if (partySize > 1 || occSize > 1) {
      notifier.error(
        "Cannot swap seats for multi-person parties. Unassign and reassign instead.",
      );
      return;
    }
    persistAssignment("move", guestId, tableId, seatNumber);
    dispatch({
      type: "MOVE_GUEST_SEAT",
      payload: { guestId, tableId, seatNumber },
    });
    notifier.success(
      guest ? `${fullName(guest)} moved to seat ${seatNumber}` : "Moved",
    );
    return;
  }

  // Occupied seat and guest unassigned → find next available seat
  const capacity = targetTable.total_number ?? 0;
  const foundSeat = findFirstAvailableSeat(
    tableId,
    capacity,
    partySize,
    assignments,
    guestsById,
    guestId,
  );
  if (!foundSeat) {
    notifier.warning(
      "That table does not have enough contiguous seats for that party",
    );
    return;
  }
  persistAssignment("assign", guestId, tableId, foundSeat);
  dispatch({
    type: "ASSIGN_GUEST",
    payload: { tableId, guestId, seatNumber: foundSeat },
  });
  notifier.success(
    guest
      ? `${fullName(guest)} reassigned to ${tableId}`
      : `Reassigned to ${tableId}`,
  );
}

function handleTableBodyDrop(
  guestId: string,
  tableId: string,
  ctx: DragContext,
): void {
  const {
    tablesForActiveLayout,
    guestsById,
    persistAssignment,
    dispatch,
    notifier,
    currentState,
  } = ctx;
  const assignments = currentState.assignments;

  const targetTable = tablesForActiveLayout.find(
    (t) => t.table_id === tableId,
  );
  if (!targetTable) return;

  const guest = guestsById.get(guestId);
  const partySize = getGuestPartySize(guest);
  const capacity = targetTable.total_number ?? 0;

  const foundSeat = findFirstAvailableSeat(
    tableId,
    capacity,
    partySize,
    assignments,
    guestsById,
    guestId,
  );
  if (!foundSeat) {
    notifier.warning(
      "That table does not have enough contiguous seats for that party",
    );
    return;
  }

  const guestAssigned = assignments.find((a) => a.guest_id === guestId);
  if (guestAssigned) {
    persistAssignment("move", guestId, tableId, foundSeat);
    dispatch({
      type: "MOVE_GUEST_SEAT",
      payload: { guestId, tableId, seatNumber: foundSeat },
    });
    notifier.success(
      guest ? `${fullName(guest)} moved to ${tableId}` : "Moved",
    );
  } else {
    persistAssignment("assign", guestId, tableId, foundSeat);
    dispatch({
      type: "ASSIGN_GUEST",
      payload: { tableId, guestId, seatNumber: foundSeat },
    });
    notifier.success(
      guest ? `${fullName(guest)} assigned to ${tableId}` : "Assigned",
    );
  }
}

function isTableDrag(evt: DragEndEvent): boolean {
  return (
    typeof evt.active.id === "string" &&
    evt.active.id.startsWith("table:") &&
    evt.active.data.current?.type === "table"
  );
}

export function useDragHandlers(deps: DragHandlersDeps) {
  const {
    dispatch,
    stateRef,
    tablesForActiveLayout,
    guestsById,
    seatsFitAt,
    persistAssignment,
    notifier,
  } = deps;

  const onDragStart = useCallback(
    (evt: DragStartEvent) =>
      dispatch({
        type: "SET_ACTIVE_DRAG_ID",
        payload: evt.active.id as DragId,
      }),
    [dispatch],
  );

  const onDragCancel = useCallback(
    () => dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null }),
    [dispatch],
  );

  const onDragEnd = useCallback(
    (evt: DragEndEvent) => {
      dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null });
      const ctx: DragContext = {
        currentState: stateRef.current,
        tablesForActiveLayout,
        guestsById,
        seatsFitAt,
        persistAssignment,
        dispatch,
        notifier,
      };

      if (isTableDrag(evt)) {
        handleTableDrag(evt, ctx);
        return;
      }

      const guestId = parseGuestIdFromDragId(evt.active.id);
      if (!guestId) return;
      const overId = evt.over?.id;
      if (!overId) return;

      if (overId === "unassigned") {
        handleGuestUnassign(guestId, ctx);
        return;
      }

      if (typeof overId === "string") {
        const seatTarget = parseSeatDropTarget(overId);
        if (seatTarget) {
          handleSeatDrop(guestId, seatTarget, ctx);
          return;
        }

        const tableTarget = parseTableDropTarget(overId);
        if (tableTarget) {
          handleTableBodyDrop(guestId, tableTarget, ctx);
        }
      }
    },
    [
      dispatch,
      stateRef,
      tablesForActiveLayout,
      guestsById,
      seatsFitAt,
      persistAssignment,
      notifier,
    ],
  );

  return { onDragStart, onDragEnd, onDragCancel };
}
