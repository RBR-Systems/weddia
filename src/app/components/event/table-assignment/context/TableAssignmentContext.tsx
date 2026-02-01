"use client";
import React, { useCallback, useMemo, useReducer } from "react";
import data from "@/data/tables-data.json";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { message } from "antd";
import {
  INITIAL_METERS_TO_PIXELS,
  DEFAULT_VENUE_WIDTH_METERS,
  DEFAULT_VENUE_HEIGHT_METERS,
} from "../constants/constants";
import type { Guest, Relation, TableLayout } from "../models/types";
import {
  fullName,
  getNextAvailableSeatNumber,
  parseGuestIdFromDragId,
} from "../utils/Table-Utils";

import type { DragId } from "../models/types";
import { reducer, createInitialState } from "./TableAssignmentReducer";

const TableAssignmentContext = React.createContext<any>(null);

export function TableAssignmentProvider({
  children,
  messageApi,
}: {
  children: React.ReactNode;
  messageApi?: any;
}) {
  const relations = data.relations as Relation[];
  const guests = data.guests as Guest[];
  const layouts = data.table_layouts as TableLayout[];
  const tablesRaw = data.tables as any;
  const assignmentsRaw = data.table_assignments as any;

  const initialState = useMemo(
    () =>
      createInitialState(
        relations,
        guests,
        layouts,
        tablesRaw,
        assignmentsRaw,
        INITIAL_METERS_TO_PIXELS,
      ),
    [relations, guests, layouts, tablesRaw, assignmentsRaw],
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const relationsById = useMemo(
    () => new Map(state.relations.map((r: any) => [r.relation_id, r])),
    [state.relations],
  );
  const guestsById = useMemo(
    () => new Map(state.guests.map((g: any) => [g.guest_id, g])),
    [state.guests],
  );

  const activeLayout = useMemo(
    () =>
      state.layouts.find((l: any) => l.is_active) ??
      (state.layouts.length ? state.layouts[0] : null),
    [state.layouts],
  );

  const tablesForActiveLayout = useMemo(() => {
    if (!activeLayout) return [];
    return state.tables
      .filter((t: any) => t.layout_id === activeLayout.layout_id)
      .slice()
      .sort((a: any, b: any) => a.table_id.localeCompare(b.table_id));
  }, [state.tables, activeLayout]);

  function seatsFitAt(
    tableId: string,
    startSeat: number,
    partySize: number,
    assignmentsList: typeof state.assignments,
    movingGuestId?: string,
  ) {
    const tbl = tablesForActiveLayout.find((t: any) => t.table_id === tableId);
    if (!tbl) return false;
    const capacity = tbl.total_number ?? 0;
    if (startSeat < 1 || startSeat + partySize - 1 > capacity) return false;
    const occupied = new Set<number>();
    for (const a of assignmentsList) {
      if (a.guest_id === movingGuestId) continue;
      if (a.table_id !== tableId) continue;
      const g = guestsById.get(a.guest_id);
      const ps = g?.party_size ?? (g?.plus_one ? 2 : 1);
      for (let s = a.seat_number; s < a.seat_number + ps; s += 1)
        occupied.add(s);
    }
    for (let s = startSeat; s < startSeat + partySize; s += 1) {
      if (occupied.has(s)) return false;
    }
    return true;
  }

  const tableOrder = useMemo(
    () => tablesForActiveLayout.map((t: any) => t.table_id),
    [tablesForActiveLayout],
  );
  const tablesForActiveLayoutById = useMemo(
    () => new Map(tablesForActiveLayout.map((t: any) => [t.table_id, t])),
    [tablesForActiveLayout],
  );

  const assignmentsByTable = useMemo(() => {
    // Deduplicate assignments by guest_id, preferring the last assignment
    const seen = new Set<string>();
    const map = new Map<string, typeof state.assignments>();
    // iterate from end so later assignments take precedence
    for (let i = state.assignments.length - 1; i >= 0; i -= 1) {
      const a = state.assignments[i];
      if (seen.has(a.guest_id)) continue;
      seen.add(a.guest_id);
      const arr = map.get(a.table_id) ?? [];
      // unshift so final order will be seat-sorted after
      arr.unshift(a);
      map.set(a.table_id, arr);
    }
    for (const [tableId, arr] of map.entries()) {
      arr.sort((a: any, b: any) => a.seat_number - b.seat_number);
      map.set(tableId, arr);
    }
    return map;
  }, [state.assignments]);

  const segmentedOptions = [
    { label: "Guests", value: "guests" as const },
    { label: "table", value: "table" as const },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragStart = (evt: DragStartEvent) =>
    dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: evt.active.id as DragId });

  const onDragEnd = (evt: DragEndEvent) => {
    dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null });
    if (
      typeof evt.active.id === "string" &&
      evt.active.id.startsWith("table:") &&
      evt.active.data.current?.type === "table"
    ) {
      const tableId = evt.active.id.slice("table:".length);
      const delta = evt.delta;
      const deltaMetersX = delta.x / state.metersToPixels;
      const deltaMetersY = delta.y / state.metersToPixels;
      const table = state.tables.find((t: any) => t.table_id === tableId);
      if (!table) return;
      dispatch({
        type: "MOVE_TABLE",
        payload: {
          tableId,
          x_m: (table.x_m ?? 0) + deltaMetersX,
          y_m: (table.y_m ?? 0) + deltaMetersY,
        },
      });
      const notifier = messageApi ?? message;
      notifier.success(`Table ${tableId} repositioned`);
      return;
    }

    const guestId = parseGuestIdFromDragId(evt.active.id);
    if (!guestId) return;
    const overId = evt.over?.id;
    if (!overId) return;

    if (overId === "unassigned") {
      dispatch({ type: "UNASSIGN_GUEST", payload: { guestId } });
      const notifier = messageApi ?? message;
      notifier.success("Guest unassigned");
      return;
    }

    // support seat-specific drops with id `table:{tableId}:seat:{n}`
    if (typeof overId === "string") {
      const seatMatch = overId.match(/^table:([^:]+):seat:(\d+)$/);
      if (seatMatch) {
        const tableId = seatMatch[1];
        const seatNumber = Number(seatMatch[2]);
        const targetTable = tablesForActiveLayout.find(
          (t: any) => t.table_id === tableId,
        );
        if (!targetTable) return;

        const occupant = state.assignments.find(
          (a: any) => a.table_id === tableId && a.seat_number === seatNumber,
        );
        const guestAssigned = state.assignments.find(
          (a: any) => a.guest_id === guestId,
        );

        const notifier = messageApi ?? message;

        // If seat is free -> move guest there, but validate party size fits
        if (!occupant) {
          const g = guestsById.get(guestId);
          const partySize = g?.party_size ?? (g?.plus_one ? 2 : 1);
          if (
            !seatsFitAt(
              tableId,
              seatNumber,
              partySize,
              state.assignments,
              guestId,
            )
          ) {
            notifier.error(
              "Not enough contiguous seats for that guest's party",
            );
            return;
          }
          dispatch({
            type: "MOVE_GUEST_SEAT",
            payload: { guestId, tableId, seatNumber },
          });
          notifier.success(
            g ? `${fullName(g)} assigned to ${tableId}` : "Assigned",
          );
          return;
        }

        // If occupied and moving guest already assigned somewhere -> swap seats
        if (occupant && guestAssigned) {
          const g = guestsById.get(guestId);
          const occGuest = guestsById.get(occupant.guest_id);
          const gSize = g?.party_size ?? (g?.plus_one ? 2 : 1);
          const occSize = occGuest?.party_size ?? (occGuest?.plus_one ? 2 : 1);
          // conservative: only allow swaps when both parties are single-seat
          if (gSize > 1 || occSize > 1) {
            notifier.error(
              "Cannot swap seats for multi-person parties. Unassign and reassign instead.",
            );
            return;
          }
          dispatch({
            type: "MOVE_GUEST_SEAT",
            payload: { guestId, tableId, seatNumber },
          });
          notifier.success(
            g ? `${fullName(g)} moved to seat ${seatNumber}` : "Moved",
          );
          return;
        }

        // If occupied and guest was unassigned, fallback to assigning to next available seat
        const g = guestsById.get(guestId);
        const partySize = g?.party_size ?? (g?.plus_one ? 2 : 1);
        // find first contiguous fit starting at 1..capacity
        const capacity = targetTable.total_number ?? 0;
        let foundSeat: number | null = null;
        for (let s = 1; s <= capacity; s += 1) {
          if (seatsFitAt(tableId, s, partySize, state.assignments, guestId)) {
            foundSeat = s;
            break;
          }
        }
        if (!foundSeat) {
          notifier.warning(
            "That table does not have enough contiguous seats for that party",
          );
          return;
        }
        dispatch({
          type: "ASSIGN_GUEST",
          payload: { tableId, guestId, seatNumber: foundSeat },
        });
        notifier.success(
          g
            ? `${fullName(g)} reassigned to ${tableId}`
            : `Reassigned to ${tableId}`,
        );
        return;
      }

      // support dropping onto the table body: id `table:{tableId}`
      const tableMatch = overId.match(/^table:([^:]+)$/);
      if (tableMatch) {
        const tableId = tableMatch[1];
        const targetTable = tablesForActiveLayout.find(
          (t: any) => t.table_id === tableId,
        );
        if (!targetTable) return;
        const g = guestsById.get(guestId);
        const partySize = g?.party_size ?? (g?.plus_one ? 2 : 1);
        const capacity = targetTable.total_number ?? 0;
        let foundSeat: number | null = null;
        for (let s = 1; s <= capacity; s += 1) {
          if (seatsFitAt(tableId, s, partySize, state.assignments, guestId)) {
            foundSeat = s;
            break;
          }
        }
        const notifier = messageApi ?? message;
        if (!foundSeat) {
          notifier.warning(
            "That table does not have enough contiguous seats for that party",
          );
          return;
        }
        const guestAssigned = state.assignments.find(
          (a: any) => a.guest_id === guestId,
        );
        if (guestAssigned) {
          dispatch({
            type: "MOVE_GUEST_SEAT",
            payload: { guestId, tableId, seatNumber: foundSeat },
          });
          notifier.success(g ? `${fullName(g)} moved to ${tableId}` : "Moved");
        } else {
          dispatch({
            type: "ASSIGN_GUEST",
            payload: { tableId, guestId, seatNumber: foundSeat },
          });
          notifier.success(
            g ? `${fullName(g)} assigned to ${tableId}` : "Assigned",
          );
        }
        return;
      }
    }
  };

  const onDragCancel = () =>
    dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null });

  const value = useMemo(
    () => ({
      state,
      dispatch,
      activeLayout,
      tablesForActiveLayout,
      assignmentsByTable,
      selectedTableId: state.selectedTableId,
      onSelectTable: (tableId: string) =>
        dispatch({ type: "SET_SELECTED_TABLE", payload: tableId }),
      guestsById,
      metersToPixels: state.metersToPixels,
      sensors,
      onDragStart,
      onDragEnd,
      onDragCancel,
      dragOverlayContent:
        state.activeDragId && state.activeDragId.startsWith("guest:")
          ? guestsById.get(state.activeDragId.slice("guest:".length))
            ? fullName(
                guestsById.get(state.activeDragId.slice("guest:".length))!,
              )
            : "Guest"
          : null,
      handleZoomIn: () =>
        dispatch({
          type: "SET_METERS_TO_PIXELS",
          payload: Math.min(state.metersToPixels * 1.2, 400),
        }),
      handleZoomOut: () =>
        dispatch({
          type: "SET_METERS_TO_PIXELS",
          payload: Math.max(state.metersToPixels / 1.2, 20),
        }),
      handleZoomFit: (containerWidth: number, containerHeight: number) => {
        const eventWidthMeters =
          activeLayout?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS;
        const eventHeightMeters =
          activeLayout?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS;
        if (!containerWidth || !containerHeight) return;
        const scale = Math.min(
          containerWidth / Math.max(1, eventWidthMeters),
          containerHeight / Math.max(1, eventHeightMeters),
        );
        const px = Math.max(20, Math.min(Math.floor(scale), 400));
        dispatch({ type: "SET_METERS_TO_PIXELS", payload: px });
      },
      handleZoomReset: () =>
        dispatch({
          type: "SET_METERS_TO_PIXELS",
          payload: INITIAL_METERS_TO_PIXELS,
        }),
      sideView: state.sideView,
      setSideView: (v: "guests" | "table") =>
        dispatch({ type: "SET_SIDE_VIEW", payload: v }),
      segmentedOptions,
      sidePanelOpen: state.sidePanelOpen,
      setSidePanelOpen: (v: boolean) =>
        dispatch({ type: "SET_SIDE_PANEL_OPEN", payload: v }),
      aiChatOpen: state.aiChatOpen,
      setAIChatOpen: (v: boolean) =>
        dispatch({ type: "SET_AI_CHAT_OPEN", payload: v }),
      hfGuests: state.guests.map((g: any) => ({
        id: g.guest_id,
        name: fullName(g),
        tags: [relationsById.get(g.relation_id)?.name ?? "unknown"],
        tableId:
          state.assignments.find((a: any) => a.guest_id === g.guest_id)
            ?.table_id ?? null,
        partySize: g.party_size ?? 1,
      })),
      hfTables: tablesForActiveLayout.map((t: any) => ({
        id: t.table_id,
        name: t.table_id,
        shape: t.shape,
        capacity: t.total_number,
        position: { x: t.x_grid, y: t.y_grid },
      })),
      handleApplyAISeating: (assignmentsFromAI: any) =>
        dispatch({ type: "APPLY_AI_SEATING", payload: assignmentsFromAI }),
      selectedTable:
        state.tables.find((t: any) => t.table_id === state.selectedTableId) ??
        null,
      selectedTableAssignments:
        assignmentsByTable.get(state.selectedTableId ?? "") ?? [],
      selectedTablePeopleCount: (
        assignmentsByTable.get(state.selectedTableId ?? "") ?? []
      ).reduce(
        (sum: number, a: any) =>
          sum + (guestsById.get(a.guest_id)?.party_size ?? 1),
        0,
      ),
      relationsById,
      assignedGuestIds: new Set(state.assignments.map((a: any) => a.guest_id)),
      filteredGuests: state.guests
        .filter((g: any) =>
          state.relationFilter ? g.relation_id === state.relationFilter : true,
        )
        .filter((g: any) => {
          const q = state.guestSearch.trim().toLowerCase();
          if (!q) return true;
          const name = fullName(g).toLowerCase();
          const email = (g.email ?? "").toLowerCase();
          return name.includes(q) || email.includes(q);
        })
        .filter((g: any) => {
          if (!state.assignedFilter || state.assignedFilter === "all")
            return true;
          const isAssigned = state.assignments.some(
            (a: any) => a.guest_id === g.guest_id,
          );
          return state.assignedFilter === "assigned" ? isAssigned : !isAssigned;
        })
        .slice()
        .sort((a: any, b: any) => fullName(a).localeCompare(fullName(b))),
      guestSearch: state.guestSearch,
      setGuestSearch: (s: string) =>
        dispatch({ type: "SET_GUEST_SEARCH", payload: s }),
      relationFilter: state.relationFilter,
      setRelationFilter: (r?: string) =>
        dispatch({ type: "SET_RELATION_FILTER", payload: r }),
      assignedFilter: state.assignedFilter,
      setAssignedFilter: (v: "all" | "assigned" | "unassigned") =>
        dispatch({ type: "SET_ASSIGNED_FILTER", payload: v }),
      relationOptions: state.relations.map((r: any) => ({
        value: r.relation_id,
        label: r.name,
      })),
      assignments: state.assignments,
      setAssignments: (a: typeof state.assignments) =>
        dispatch({ type: "SET_ASSIGNMENTS", payload: a }),
      guests: state.guests,
      moveGuestSeat: (guestId: string, tableId: string, seatNumber: number) => {
        const notifier = messageApi ?? message;
        const g = guestsById.get(guestId);
        const movingSize = g?.party_size ?? (g?.plus_one ? 2 : 1);
        const table = tablesForActiveLayout.find(
          (t: any) => t.table_id === tableId,
        );
        const capacity = table?.total_number ?? 0;

        const oldAssign = state.assignments.find(
          (a: any) => a.guest_id === guestId,
        );
        if (!oldAssign) {
          // unassigned -> try to find first contiguous block starting at seatNumber
          if (
            !seatsFitAt(
              tableId,
              seatNumber,
              movingSize,
              state.assignments,
              guestId,
            )
          ) {
            notifier.error(
              "Not enough contiguous seats for that guest's party",
            );
            return false;
          }
          dispatch({
            type: "ASSIGN_GUEST",
            payload: { tableId, guestId, seatNumber },
          });
          notifier.success(
            g ? `${fullName(g)} assigned to ${tableId}` : "Assigned",
          );
          return true;
        }

        const oldStart = oldAssign.seat_number;
        const oldEnd = oldStart + movingSize - 1;
        const targetStart = seatNumber;
        const targetEnd = targetStart + movingSize - 1;

        if (targetEnd > capacity) {
          notifier.error(
            "Not enough seats on table to place that party at the requested position",
          );
          return false;
        }

        if (targetStart === oldStart) {
          notifier.info("Already at requested seat");
          return true;
        }

        // determine affected assignments and check boundary feasibility
        if (targetStart < oldStart) {
          const intervalStart = targetStart;
          const intervalEnd = oldStart - 1;
          const affected = state.assignments.filter(
            (a: any) =>
              a.table_id === tableId &&
              !(a.guest_id === guestId) &&
              a.seat_number <= intervalEnd &&
              a.seat_number +
                (guestsById.get(a.guest_id)?.party_size ??
                  (guestsById.get(a.guest_id)?.plus_one ? 2 : 1)) -
                1 >=
                intervalStart,
          );
          // check capacity after shifting right by movingSize
          for (const a of affected) {
            const aSize =
              guestsById.get(a.guest_id)?.party_size ??
              (guestsById.get(a.guest_id)?.plus_one ? 2 : 1);
            const aEnd = a.seat_number + aSize - 1;
            if (aEnd + movingSize > capacity) {
              notifier.error(
                "Not enough room to shift adjacent guests to make space",
              );
              return false;
            }
          }
          dispatch({
            type: "MOVE_GUEST_SEAT",
            payload: { guestId, tableId, seatNumber },
          });
          notifier.success(g ? `${fullName(g)} moved to ${tableId}` : "Moved");
          return true;
        }

        // targetStart > oldStart -> shift left
        if (targetStart > oldStart) {
          const intervalStart = oldEnd + 1;
          const intervalEnd = targetEnd;
          const affected = state.assignments.filter(
            (a: any) =>
              a.table_id === tableId &&
              !(a.guest_id === guestId) &&
              a.seat_number <= intervalEnd &&
              a.seat_number +
                (guestsById.get(a.guest_id)?.party_size ??
                  (guestsById.get(a.guest_id)?.plus_one ? 2 : 1)) -
                1 >=
                intervalStart,
          );
          for (const a of affected) {
            const newStart = a.seat_number - movingSize;
            if (newStart < 1) {
              notifier.error(
                "Not enough room to shift adjacent guests to make space",
              );
              return false;
            }
          }
          dispatch({
            type: "MOVE_GUEST_SEAT",
            payload: { guestId, tableId, seatNumber },
          });
          notifier.success(g ? `${fullName(g)} moved to ${tableId}` : "Moved");
          return true;
        }

        return false;
      },
      tableOrder,
      tablesForActiveLayoutById,
      messageApi: messageApi ?? message,
    }),
    [
      state,
      dispatch,
      activeLayout,
      tablesForActiveLayout,
      assignmentsByTable,
      guestsById,
      sensors,
      relationsById,
      tableOrder,
      tablesForActiveLayoutById,
    ],
  );

  return (
    <TableAssignmentContext.Provider value={value}>
      {children}
    </TableAssignmentContext.Provider>
  );
}

export function useTableAssignmentContext() {
  const ctx = React.useContext(TableAssignmentContext);
  if (!ctx)
    throw new Error(
      "useTableAssignmentContext must be used within TableAssignmentProvider",
    );
  return ctx;
}

export default TableAssignmentContext;
