"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { App } from "antd";
import {
  INITIAL_METERS_TO_PIXELS,
  DEFAULT_VENUE_WIDTH_METERS,
  DEFAULT_VENUE_HEIGHT_METERS,
} from "../constants/tableAssignment.constants";

import type { TableLayout } from "../models/tableAssignment.models";
import { fullName, parseGuestIdFromDragId } from "../utils/table.utils";
import { apiGet, apiPost, apiPut, apiDelete, isAbortError } from "@/shared/api/apiClient";
import { fetchGuests, fetchRelations } from "../../guest-list/api/guestApi";
import type { Guest as GuestListGuest } from "../../guest-list/models/guestList.models";
import type { Guest as TAGuest } from "../models/tableAssignment.models";

function mapGuestListToTA(g: GuestListGuest): TAGuest {
  return {
    guest_id: g.guest_id,
    event_id: g.event_id ?? "",
    first_name: g.first_name,
    last_name: g.last_name,
    email: g.email ?? null,
    phone: g.phone ?? null,
    relation_id: g.relation_id ?? "",
    plus_one: g.plus_one != null ? Boolean(g.plus_one) : false,
    rsvp_status: g.rsvp_status,
    party_size: g.party_size,
    dietary_restrictions: Array.isArray(g.dietary_restrictions)
      ? g.dietary_restrictions.join(", ")
      : null,
    accessibility_needs: g.accesability_needs ?? null,
    notes: g.notes ?? null,
  };
}
import { useEvent } from "@/shared/contexts/EventContext";

import type { DragId } from "../models/tableAssignment.models";
import { reducer, createInitialState } from "./tableAssignmentReducer";

const TableAssignmentContext = React.createContext<any>(null);

export function TableAssignmentProvider({
  children,
  messageApi,
  initialSelectedTableId,
}: {
  children: React.ReactNode;
  messageApi?: any;
  initialSelectedTableId?: string | null;
}) {
  const { message } = App.useApp();
  const { state: { events: { selectedEvent } } } = useEvent();
  const eventId = (selectedEvent as any)?.id ?? 1;

  const emptyState = useMemo(
    () => createInitialState([], [], [], [], [], INITIAL_METERS_TO_PIXELS),
    [],
  );

  const [state, dispatch] = useReducer(reducer, emptyState);

  // Load all data from API on mount / when event changes
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadData() {
      try {
        const [layouts, rawGuests, relations] = await Promise.all([
          apiGet<any[]>("/api/tablelayouts/active", { signal }),
          fetchGuests(eventId),
          fetchRelations(),
        ]);
        const guests = rawGuests.map(mapGuestListToTA);

        const mappedLayouts: TableLayout[] = (Array.isArray(layouts) ? layouts : []).map((l: any) => ({
          layout_id: String(l.layoutId),
          event_id: String(eventId),
          name: l.name,
          description: l.description ?? null,
          is_active: l.isActive,
          x_grid_size: l.xGridSize,
          y_grid_size: l.yGridSize,
        }));

        const activeLayout = mappedLayouts.find((l) => l.is_active) ?? mappedLayouts[0];

        let tablesRaw: any[] = [];
        let assignmentsRaw: any[] = [];

        if (activeLayout) {
          const layoutId = activeLayout.layout_id;
          const [tables, assignments] = await Promise.all([
            apiGet<any[]>(`/api/eventtables/layout/${layoutId}`, { signal }),
            apiGet<any[]>(`/api/tableassignments/layout/${layoutId}`, { signal }),
          ]);
          tablesRaw = (Array.isArray(tables) ? tables : []).map((t: any) => ({
            table_id: String(t.tableId),
            layout_id: String(t.layoutId),
            table_number: t.tableNumber,
            total_number: t.numberOfSeats,
            shape: t.shape,
            x_grid: t.xGrid,
            y_grid: t.yGrid,
          }));
          assignmentsRaw = (Array.isArray(assignments) ? assignments : []).map((a: any) => ({
            table_id: String(a.tableId),
            guest_id: String(a.guestId),
            seat_number: a.seatNumber,
          }));
        }

        if (!signal.aborted) {
          dispatch({
            type: "INIT_DATA",
            payload: {
              relations,
              guests,
              layouts: mappedLayouts,
              tables: tablesRaw,
              assignments: assignmentsRaw,
            },
          });
        }
      } catch (err) {
        if (isAbortError(err)) return;
        console.error("TableAssignmentProvider: failed to load data", err);
      }
    }

    loadData();
    return () => controller.abort();
  }, [eventId]);

  // Keep a ref to the latest state so callbacks always read fresh data
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // When an external component requests a table to be highlighted, select it
  useEffect(() => {
    if (initialSelectedTableId) {
      dispatch({ type: "SET_SELECTED_TABLE", payload: initialSelectedTableId });
    }
  }, [initialSelectedTableId]);

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

  const seatsFitAt = useCallback(
    function seatsFitAt(
      tableId: string,
      startSeat: number,
      partySize: number,
      assignmentsList: typeof state.assignments,
      movingGuestId?: string,
    ) {
      const tbl = tablesForActiveLayout.find(
        (t: any) => t.table_id === tableId,
      );
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
    },
    [tablesForActiveLayout, guestsById],
  );

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

  // Persist a guest assignment change to the API (fire-and-forget with logging)
  const persistAssignment = useCallback(
    (
      type: "assign" | "move" | "unassign",
      guestId: string,
      tableId: string,
      seatNumber?: number,
    ) => {
      // Skip only temporary table IDs (not yet persisted to API)
      if (tableId.startsWith("table-")) {
        console.warn("[persistAssignment] Temp table id — skipping API call", { tableId });
        return;
      }

      const prev = stateRef.current.assignments.find((a: any) => a.guest_id === guestId);

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
          // Same table — update seat
          apiPut(`/api/tableassignments/${tableId}/${guestId}?adminId=1`, {
            seatNumber: seatNumber ?? prev.seat_number,
          }).catch(handleError("move-same-table"));
        } else {
          // Different table — delete old, create new
          if (prev) {
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
      }
    },
    [message],
  );

  const segmentedOptions = [
    { label: "Guests", value: "guests" as const },
    { label: "table", value: "table" as const },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragStart = useCallback(
    (evt: DragStartEvent) =>
      dispatch({
        type: "SET_ACTIVE_DRAG_ID",
        payload: evt.active.id as DragId,
      }),
    [],
  );

  const onDragEnd = useCallback(
    (evt: DragEndEvent) => {
      dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null });
      // Read fresh state from ref to avoid stale closures
      const currentState = stateRef.current;

      if (
        typeof evt.active.id === "string" &&
        evt.active.id.startsWith("table:") &&
        evt.active.data.current?.type === "table"
      ) {
        const tableId = evt.active.id.slice("table:".length);
        const delta = evt.delta;
        const deltaMetersX =
          delta.x / (currentState.metersToPixels * currentState.zoomScale);
        const deltaMetersY =
          delta.y / (currentState.metersToPixels * currentState.zoomScale);
        const table = currentState.tables.find(
          (t: any) => t.table_id === tableId,
        );
        if (!table) return;
        const newX = (table.x_m ?? 0) + deltaMetersX;
        const newY = (table.y_m ?? 0) + deltaMetersY;
        dispatch({
          type: "MOVE_TABLE",
          payload: { tableId, x_m: newX, y_m: newY },
        });

        // Persist new grid position to API
        const activeLayout = currentState.layouts.find((l: any) => l.is_active) ?? currentState.layouts[0];
        if (activeLayout) {
          const xGrid = Math.max(0, Math.round(newX / (DEFAULT_VENUE_WIDTH_METERS / activeLayout.x_grid_size)));
          const yGrid = Math.max(0, Math.round(newY / (DEFAULT_VENUE_HEIGHT_METERS / activeLayout.y_grid_size)));
          apiPut(`/api/eventtables/${tableId}?adminId=1`, {
            layoutId: Number(activeLayout.layout_id),
            numberOfSeats: table.total_number ?? 8,
            shape: table.shape ?? "round",
            xGrid,
            yGrid,
          }).catch(console.error);
        }

        const notifier = messageApi ?? message;
        notifier.success(`Table ${tableId} repositioned`);
        return;
      }

      const guestId = parseGuestIdFromDragId(evt.active.id);
      if (!guestId) return;
      const overId = evt.over?.id;
      if (!overId) return;

      if (overId === "unassigned") {
        const prevAssignment = stateRef.current.assignments.find((a: any) => a.guest_id === guestId);
        dispatch({ type: "UNASSIGN_GUEST", payload: { guestId } });
        if (prevAssignment) {
          apiDelete(`/api/tableassignments/${prevAssignment.table_id}/${guestId}`).catch(console.error);
        }
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

          const currentAssignments = currentState.assignments;
          // Check occupant accounting for party_size range
          const occupant = currentAssignments.find((a: any) => {
            if (a.table_id !== tableId) return false;
            const g = guestsById.get(a.guest_id);
            const ps = g?.party_size ?? (g?.plus_one ? 2 : 1);
            return (
              seatNumber >= a.seat_number && seatNumber < a.seat_number + ps
            );
          });
          const guestAssigned = currentAssignments.find(
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
                currentAssignments,
                guestId,
              )
            ) {
              notifier.error(
                "Not enough contiguous seats for that guest's party",
              );
              return;
            }
            persistAssignment("move", guestId, tableId, seatNumber);
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
            const occSize =
              occGuest?.party_size ?? (occGuest?.plus_one ? 2 : 1);
            // conservative: only allow swaps when both parties are single-seat
            if (gSize > 1 || occSize > 1) {
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
            if (
              seatsFitAt(tableId, s, partySize, currentAssignments, guestId)
            ) {
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
          persistAssignment("assign", guestId, tableId, foundSeat);
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
          const currentAssignments = currentState.assignments;
          const capacity = targetTable.total_number ?? 0;
          let foundSeat: number | null = null;
          for (let s = 1; s <= capacity; s += 1) {
            if (
              seatsFitAt(tableId, s, partySize, currentAssignments, guestId)
            ) {
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
          const guestAssigned = currentAssignments.find(
            (a: any) => a.guest_id === guestId,
          );
          if (guestAssigned) {
            persistAssignment("move", guestId, tableId, foundSeat);
            dispatch({
              type: "MOVE_GUEST_SEAT",
              payload: { guestId, tableId, seatNumber: foundSeat },
            });
            notifier.success(
              g ? `${fullName(g)} moved to ${tableId}` : "Moved",
            );
          } else {
            persistAssignment("assign", guestId, tableId, foundSeat);
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
    },
    [tablesForActiveLayout, guestsById, seatsFitAt, messageApi, message],
  );

  const onDragCancel = useCallback(
    () => dispatch({ type: "SET_ACTIVE_DRAG_ID", payload: null }),
    [],
  );

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
      zoomScale: state.zoomScale,
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
          type: "SET_ZOOM_SCALE",
          payload: Math.min(state.zoomScale * 1.2, 5),
        }),
      handleZoomOut: () =>
        dispatch({
          type: "SET_ZOOM_SCALE",
          payload: Math.max(state.zoomScale / 1.2, 0.25),
        }),
      handleZoomFit: (containerWidth: number, containerHeight: number) => {
        const eventWidthMeters =
          activeLayout?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS;
        const eventHeightMeters =
          activeLayout?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS;
        if (!containerWidth || !containerHeight) return;
        const baseWidthPx = eventWidthMeters * INITIAL_METERS_TO_PIXELS;
        const baseHeightPx = eventHeightMeters * INITIAL_METERS_TO_PIXELS;
        const scale = Math.min(
          containerWidth / baseWidthPx,
          containerHeight / baseHeightPx,
        );
        dispatch({
          type: "SET_ZOOM_SCALE",
          payload: Math.max(0.25, Math.min(scale, 5)),
        });
      },
      handleZoomReset: () =>
        dispatch({
          type: "SET_ZOOM_SCALE",
          payload: 1,
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
      unassignAll: () => {
        const currentAssignments = stateRef.current.assignments;
        dispatch({ type: "UNASSIGN_ALL" });
        currentAssignments.forEach((a: any) => {
          apiDelete(`/api/tableassignments/${a.table_id}/${a.guest_id}`)
            .catch((e) => console.error("[unassignAll] delete failed:", e));
        });
      },
      unassignGuest: (guestId: string) => {
        const prev = stateRef.current.assignments.find((a: any) => a.guest_id === guestId);
        dispatch({ type: "UNASSIGN_GUEST", payload: { guestId } });
        if (prev) {
          apiDelete(`/api/tableassignments/${prev.table_id}/${guestId}`)
            .catch((e) => console.error("[unassignGuest] failed:", e));
        }
      },
      guests: state.guests,
      moveGuestSeat: (guestId: string, tableId: string, seatNumber: number) => {
        const notifier = messageApi ?? message;
        const g = guestsById.get(guestId);
        const movingSize = g?.party_size ?? (g?.plus_one ? 2 : 1);
        const table = tablesForActiveLayout.find(
          (t: any) => t.table_id === tableId,
        );
        const capacity = table?.total_number ?? 0;

        // Use stateRef for fresh assignments to avoid stale closure bugs
        const currentAssignments = stateRef.current.assignments;

        const oldAssign = currentAssignments.find(
          (a: any) => a.guest_id === guestId,
        );
        if (!oldAssign) {
          // unassigned -> try to find first contiguous block starting at seatNumber
          if (
            !seatsFitAt(
              tableId,
              seatNumber,
              movingSize,
              currentAssignments,
              guestId,
            )
          ) {
            notifier.error(
              "Not enough contiguous seats for that guest's party",
            );
            return false;
          }
          persistAssignment("assign", guestId, tableId, seatNumber);
          dispatch({
            type: "ASSIGN_GUEST",
            payload: { tableId, guestId, seatNumber },
          });
          notifier.success(
            g ? `${fullName(g)} assigned to ${tableId}` : "Assigned",
          );
          return true;
        }

        // Cross-table move: validate seats fit on target and dispatch
        if (oldAssign.table_id !== tableId) {
          if (
            !seatsFitAt(
              tableId,
              seatNumber,
              movingSize,
              currentAssignments,
              guestId,
            )
          ) {
            notifier.error(
              "Not enough contiguous seats for that guest's party on the target table",
            );
            return false;
          }
          persistAssignment("move", guestId, tableId, seatNumber);
          dispatch({
            type: "MOVE_GUEST_SEAT",
            payload: { guestId, tableId, seatNumber },
          });
          notifier.success(g ? `${fullName(g)} moved to ${tableId}` : "Moved");
          return true;
        }

        // Same-table move — basic boundary check
        const targetEnd = seatNumber + movingSize - 1;

        if (seatNumber < 1 || targetEnd > capacity) {
          notifier.error(
            "Not enough seats on table to place that party at the requested position",
          );
          return false;
        }

        if (seatNumber === oldAssign.seat_number) {
          notifier.info("Already at requested seat");
          return true;
        }

        // Dispatch to the reducer, which handles repacking displaced guests.
        // The reducer returns unchanged state if it can't fit everyone.
        persistAssignment("move", guestId, tableId, seatNumber);
        dispatch({
          type: "MOVE_GUEST_SEAT",
          payload: { guestId, tableId, seatNumber },
        });

        // Since dispatch is synchronous with useReducer, check if state changed
        // by scheduling the check. We optimistically assume success here;
        // the reducer will silently abort if packing fails.
        notifier.success(g ? `${fullName(g)} moved` : "Moved");
        return true;
      },
      tableOrder,
      tablesForActiveLayoutById,
      messageApi: messageApi ?? message,
      addTable: async (opts: { shape: string; seats: number; xGrid: number; yGrid: number }) => {
        if (!activeLayout) return;
        const tableNumber = (stateRef.current.tables.length ?? 0) + 1;
        const tempId = `table-${Date.now()}`;
        const newTable = {
          table_id: tempId,
          layout_id: activeLayout.layout_id,
          table_number: tableNumber,
          total_number: opts.seats,
          shape: opts.shape,
          x_grid: opts.xGrid,
          y_grid: opts.yGrid,
        };
        dispatch({ type: "ADD_TABLE", payload: newTable });
        try {
          const created = await apiPost<any>(`/api/eventtables?adminId=1`, {
            layoutId: Number(activeLayout.layout_id),
            tableNumber,
            numberOfSeats: opts.seats,
            shape: opts.shape,
            xGrid: opts.xGrid,
            yGrid: opts.yGrid,
          });
          // Replace temp id with real one from API
          dispatch({
            type: "SET_TABLES",
            payload: stateRef.current.tables.map((t: any) =>
              t.table_id === tempId
                ? { ...t, table_id: String(created.tableId) }
                : t,
            ),
          });
        } catch (err) {
          console.error("addTable failed:", err);
          dispatch({ type: "REMOVE_TABLE", payload: tempId });
        }
      },
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
