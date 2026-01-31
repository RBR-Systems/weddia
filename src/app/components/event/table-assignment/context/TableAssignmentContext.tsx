"use client";
import React, { useCallback, useMemo, useReducer } from "react";
import data from "@/data/tables-data.json";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { message } from "antd";
import { INITIAL_METERS_TO_PIXELS } from "../constants/constants";
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
}: {
  children: React.ReactNode;
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

  const tableOrder = useMemo(
    () => tablesForActiveLayout.map((t: any) => t.table_id),
    [tablesForActiveLayout],
  );
  const tablesForActiveLayoutById = useMemo(
    () => new Map(tablesForActiveLayout.map((t: any) => [t.table_id, t])),
    [tablesForActiveLayout],
  );

  const assignmentsByTable = useMemo(() => {
    const map = new Map<string, typeof state.assignments>();
    for (const a of state.assignments) {
      const arr = map.get(a.table_id) ?? [];
      arr.push(a);
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
      message.success(`Table ${tableId} repositioned`);
      return;
    }

    const guestId = parseGuestIdFromDragId(evt.active.id);
    if (!guestId) return;
    const overId = evt.over?.id;
    if (!overId) return;

    if (overId === "unassigned") {
      dispatch({ type: "UNASSIGN_GUEST", payload: { guestId } });
      message.success("Guest unassigned");
      return;
    }

    if (typeof overId === "string" && overId.startsWith("table:")) {
      const tableId = overId.slice("table:".length);
      const targetTable = tablesForActiveLayout.find(
        (t: any) => t.table_id === tableId,
      );
      if (!targetTable) return;

      const withoutGuest = state.assignments.filter(
        (a: any) => a.guest_id !== guestId,
      );
      const usedSeatNumbers = withoutGuest
        .filter((a: any) => a.table_id === tableId)
        .map((a: any) => a.seat_number);
      const seat = getNextAvailableSeatNumber(
        targetTable.total_number,
        usedSeatNumbers,
      );
      if (!seat) {
        message.warning("That table is full");
        return;
      }
      dispatch({
        type: "ASSIGN_GUEST",
        payload: { tableId, guestId, seatNumber: seat },
      });
      dispatch({ type: "SET_SELECTED_TABLE", payload: tableId });
      const g = guestsById.get(guestId);
      message.success(
        g ? `${fullName(g)} assigned to ${tableId}` : `Assigned to ${tableId}`,
      );
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
        .slice()
        .sort((a: any, b: any) => fullName(a).localeCompare(fullName(b))),
      guestSearch: state.guestSearch,
      setGuestSearch: (s: string) =>
        dispatch({ type: "SET_GUEST_SEARCH", payload: s }),
      relationFilter: state.relationFilter,
      setRelationFilter: (r?: string) =>
        dispatch({ type: "SET_RELATION_FILTER", payload: r }),
      relationOptions: state.relations.map((r: any) => ({
        value: r.relation_id,
        label: r.name,
      })),
      assignments: state.assignments,
      setAssignments: (a: typeof state.assignments) =>
        dispatch({ type: "SET_ASSIGNMENTS", payload: a }),
      guests: state.guests,
      tableOrder,
      tablesForActiveLayoutById,
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
