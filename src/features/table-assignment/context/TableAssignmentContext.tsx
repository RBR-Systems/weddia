"use client";
import React, { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { App } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { INITIAL_METERS_TO_PIXELS, DEFAULT_VENUE_WIDTH_METERS, DEFAULT_VENUE_HEIGHT_METERS } from "../constants/tableAssignment.constants";
import type { TableLayout, Table, Relation, Guest as TAGuest, TableAssignment } from "../models/tableAssignment.models";
import type { SeatingAssignment } from "../models/huggingface.models";
import { fullName } from "../utils/table.utils";
import { isAbortError } from "@/shared/api/apiClient";
import { apiDelete } from "@/shared/api/apiClient";
import { useEvent } from "@/shared/contexts/EventContext";
import { reducer, createInitialState } from "./tableAssignmentReducer";
import { useDragHandlers } from "../hooks/useDragHandlers";
import { loadTableAssignmentData, deleteAssignment } from "../api/tableAssignmentApi";
import { usePersistAssignment } from "../hooks/usePersistAssignment";
import { useMoveGuestSeat } from "../hooks/useMoveGuestSeat";
import { useAddTable } from "../hooks/useAddTable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableAssignmentContext = React.createContext<any>(null);

export function TableAssignmentProvider({
  children,
  messageApi,
  initialSelectedTableId,
}: {
  children: React.ReactNode;
  messageApi?: MessageInstance;
  initialSelectedTableId?: string | null;
}) {
  const { message } = App.useApp();
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = selectedEvent?.id ?? 1;

  const emptyState = useMemo(() => createInitialState([], [], [], [], [], INITIAL_METERS_TO_PIXELS), []);
  const [state, dispatch] = useReducer(reducer, emptyState);

  const reload = useCallback(async () => {
    const controller = new AbortController();
    try {
      const data = await loadTableAssignmentData(eventId, controller.signal);
      dispatch({ type: "INIT_DATA", payload: data });
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("TableAssignmentProvider: failed to load data", err);
    }
  }, [eventId]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await loadTableAssignmentData(eventId, controller.signal);
        if (!controller.signal.aborted) {
          dispatch({ type: "INIT_DATA", payload: data });
        }
      } catch (err) {
        if (isAbortError(err)) return;
        console.error("TableAssignmentProvider: failed to load data", err);
      }
    }
    load();
    return () => controller.abort();
  }, [eventId]);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  useEffect(() => {
    if (initialSelectedTableId) {
      dispatch({ type: "SET_SELECTED_TABLE", payload: initialSelectedTableId });
    }
  }, [initialSelectedTableId]);

  const relationsById = useMemo(
    () => new Map(state.relations.map((r: Relation) => [r.relation_id, r])),
    [state.relations],
  );
  const guestsById = useMemo(
    () => new Map(state.guests.map((g: TAGuest) => [g.guest_id, g])),
    [state.guests],
  );
  const activeLayout = useMemo(
    () => state.layouts.find((l: TableLayout) => l.is_active) ?? (state.layouts.length ? state.layouts[0] : null),
    [state.layouts],
  );
  const tablesForActiveLayout = useMemo(() => {
    if (!activeLayout) return [];
    return state.tables
      .filter((t: Table) => t.layout_id === activeLayout.layout_id)
      .slice()
      .sort((a: Table, b: Table) => a.table_id.localeCompare(b.table_id));
  }, [state.tables, activeLayout]);

  const seatsFitAt = useCallback(
    (tableId: string, startSeat: number, partySize: number, assignmentsList: TableAssignment[], movingGuestId?: string) => {
      const tbl = tablesForActiveLayout.find((t: Table) => t.table_id === tableId);
      if (!tbl) return false;
      const capacity = tbl.total_number ?? 0;
      if (startSeat < 1 || startSeat + partySize - 1 > capacity) return false;
      const occupied = new Set<number>();
      for (const a of assignmentsList) {
        if (a.guest_id === movingGuestId) continue;
        if (a.table_id !== tableId) continue;
        const g = guestsById.get(a.guest_id);
        const ps = g?.party_size ?? (g?.plus_one ? 2 : 1);
        for (let s = a.seat_number; s < a.seat_number + ps; s += 1) occupied.add(s);
      }
      for (let s = startSeat; s < startSeat + partySize; s += 1) {
        if (occupied.has(s)) return false;
      }
      return true;
    },
    [tablesForActiveLayout, guestsById],
  );

  const tableOrder = useMemo(() => tablesForActiveLayout.map((t: Table) => t.table_id), [tablesForActiveLayout]);
  const tablesForActiveLayoutById = useMemo(
    () => new Map(tablesForActiveLayout.map((t: Table) => [t.table_id, t])),
    [tablesForActiveLayout],
  );

  const assignmentsByTable = useMemo(() => {
    const seen = new Set<string>();
    const map = new Map<string, TableAssignment[]>();
    for (let i = state.assignments.length - 1; i >= 0; i -= 1) {
      const a = state.assignments[i];
      if (seen.has(a.guest_id)) continue;
      seen.add(a.guest_id);
      const arr = map.get(a.table_id) ?? [];
      arr.unshift(a);
      map.set(a.table_id, arr);
    }
    for (const [tableId, arr] of map.entries()) {
      arr.sort((a: TableAssignment, b: TableAssignment) => a.seat_number - b.seat_number);
      map.set(tableId, arr);
    }
    return map;
  }, [state.assignments]);

  const getAssignments = useCallback(() => stateRef.current.assignments, []);
  const getTables = useCallback(() => stateRef.current.tables, []);

  const notifier = useMemo(() => messageApi ?? message, [messageApi, message]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const persistAssignment = usePersistAssignment(message, getAssignments);
  const moveGuestSeat = useMoveGuestSeat({ notifier, guestsById, tablesForActiveLayout, seatsFitAt, persistAssignment, getAssignments, dispatch });
  const addTable = useAddTable({ activeLayout, getTables, dispatch });

  const { onDragStart, onDragEnd, onDragCancel } = useDragHandlers({
    dispatch,
    stateRef,
    tablesForActiveLayout,
    guestsById,
    seatsFitAt,
    persistAssignment,
    notifier,
  });

  const value = useMemo(() => ({
    state,
    dispatch,
    activeLayout,
    tablesForActiveLayout,
    assignmentsByTable,
    selectedTableId: state.selectedTableId,
    onSelectTable: (tableId: string) => dispatch({ type: "SET_SELECTED_TABLE", payload: tableId }),
    guestsById,
    metersToPixels: state.metersToPixels,
    zoomScale: state.zoomScale,
    sensors,
    onDragStart,
    onDragEnd,
    onDragCancel,
    dragOverlayContent:
      state.activeDragId && state.activeDragId.startsWith("guest:")
        ? guestsById.get(state.activeDragId.slice("guest:".length))
          ? fullName(guestsById.get(state.activeDragId.slice("guest:".length))!)
          : "Guest"
        : null,
    handleZoomIn: () => dispatch({ type: "SET_ZOOM_SCALE", payload: Math.min(state.zoomScale * 1.2, 5) }),
    handleZoomOut: () => dispatch({ type: "SET_ZOOM_SCALE", payload: Math.max(state.zoomScale / 1.2, 0.25) }),
    handleZoomFit: (containerWidth: number, containerHeight: number) => {
      const eventWidthMeters = activeLayout?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS;
      const eventHeightMeters = activeLayout?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS;
      if (!containerWidth || !containerHeight) return;
      const baseWidthPx = eventWidthMeters * INITIAL_METERS_TO_PIXELS;
      const baseHeightPx = eventHeightMeters * INITIAL_METERS_TO_PIXELS;
      const scale = Math.min(containerWidth / baseWidthPx, containerHeight / baseHeightPx);
      dispatch({ type: "SET_ZOOM_SCALE", payload: Math.max(0.25, Math.min(scale, 5)) });
    },
    handleZoomReset: () => dispatch({ type: "SET_ZOOM_SCALE", payload: 1 }),
    sideView: state.sideView,
    setSideView: (v: "guests" | "table") => dispatch({ type: "SET_SIDE_VIEW", payload: v }),
    segmentedOptions: [
      { label: "Guests", value: "guests" as const },
      { label: "table", value: "table" as const },
    ],
    sidePanelOpen: state.sidePanelOpen,
    setSidePanelOpen: (v: boolean) => dispatch({ type: "SET_SIDE_PANEL_OPEN", payload: v }),
    aiChatOpen: state.aiChatOpen,
    setAIChatOpen: (v: boolean) => dispatch({ type: "SET_AI_CHAT_OPEN", payload: v }),
    hfGuests: state.guests.map((g: TAGuest) => ({
      id: g.guest_id,
      name: fullName(g),
      tags: [relationsById.get(g.relation_id)?.name ?? "unknown"],
      tableId: state.assignments.find((a: TableAssignment) => a.guest_id === g.guest_id)?.table_id ?? null,
      partySize: g.party_size ?? 1,
    })),
    hfTables: tablesForActiveLayout.map((t: Table) => ({
      id: t.table_id, name: t.table_id, shape: t.shape, capacity: t.total_number,
      position: { x: t.x_grid, y: t.y_grid },
    })),
    handleApplyAISeating: (assignmentsFromAI: SeatingAssignment[]) =>
      dispatch({ type: "APPLY_AI_SEATING", payload: assignmentsFromAI }),
    selectedTable: state.tables.find((t: Table) => t.table_id === state.selectedTableId) ?? null,
    selectedTableAssignments: assignmentsByTable.get(state.selectedTableId ?? "") ?? [],
    selectedTablePeopleCount: (assignmentsByTable.get(state.selectedTableId ?? "") ?? [])
      .reduce((sum: number, a: TableAssignment) => sum + (guestsById.get(a.guest_id)?.party_size ?? 1), 0),
    relationsById,
    assignedGuestIds: new Set(state.assignments.map((a: TableAssignment) => a.guest_id)),
    filteredGuests: state.guests
      .filter((g: TAGuest) => state.relationFilter ? g.relation_id === state.relationFilter : true)
      .filter((g: TAGuest) => {
        const q = state.guestSearch.trim().toLowerCase();
        if (!q) return true;
        return fullName(g).toLowerCase().includes(q) || (g.email ?? "").toLowerCase().includes(q);
      })
      .filter((g: TAGuest) => {
        if (!state.assignedFilter || state.assignedFilter === "all") return true;
        const isAssigned = state.assignments.some((a: TableAssignment) => a.guest_id === g.guest_id);
        return state.assignedFilter === "assigned" ? isAssigned : !isAssigned;
      })
      .slice()
      .sort((a: TAGuest, b: TAGuest) => fullName(a).localeCompare(fullName(b))),
    guestSearch: state.guestSearch,
    setGuestSearch: (s: string) => dispatch({ type: "SET_GUEST_SEARCH", payload: s }),
    relationFilter: state.relationFilter,
    setRelationFilter: (r?: string) => dispatch({ type: "SET_RELATION_FILTER", payload: r }),
    assignedFilter: state.assignedFilter,
    setAssignedFilter: (v: "all" | "assigned" | "unassigned") => dispatch({ type: "SET_ASSIGNED_FILTER", payload: v }),
    relationOptions: state.relations.map((r: Relation) => ({ value: r.relation_id, label: r.name })),
    assignments: state.assignments,
    setAssignments: (a: typeof state.assignments) => dispatch({ type: "SET_ASSIGNMENTS", payload: a }),
    unassignAll: () => {
      const current = stateRef.current.assignments;
      dispatch({ type: "UNASSIGN_ALL" });
      current.forEach(deleteAssignment);
    },
    unassignGuest: (guestId: string) => {
      const prev = stateRef.current.assignments.find((a: TableAssignment) => a.guest_id === guestId);
      dispatch({ type: "UNASSIGN_GUEST", payload: { guestId } });
      if (prev) {
        apiDelete(`/api/tableassignments/${prev.table_id}/${guestId}`)
          .catch((e) => console.error("[unassignGuest] failed:", e));
      }
    },
    guests: state.guests,
    moveGuestSeat,
    tableOrder,
    tablesForActiveLayoutById,
    messageApi: notifier,
    addTable,
    eventId,
    reload,
  }), [
    state, dispatch, activeLayout, tablesForActiveLayout, assignmentsByTable,
    guestsById, sensors, relationsById, tableOrder, tablesForActiveLayoutById,
    onDragStart, onDragEnd, onDragCancel, moveGuestSeat, addTable, notifier, getAssignments,
    eventId, reload,
  ]);

  return (
    <TableAssignmentContext.Provider value={value}>
      {children}
    </TableAssignmentContext.Provider>
  );
}

export function useTableAssignmentContext() {
  const ctx = React.useContext(TableAssignmentContext);
  if (!ctx) throw new Error("useTableAssignmentContext must be used within TableAssignmentProvider");
  return ctx;
}

export default TableAssignmentContext;
