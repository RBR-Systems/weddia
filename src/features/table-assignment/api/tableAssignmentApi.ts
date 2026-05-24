import { apiGet, apiDelete } from "@/shared/api/apiClient";
import { fetchGuests, fetchRelations } from "@/shared/api/guestApi";
import type { TableLayout, Table, TableAssignment } from "../models/tableAssignment.models";
import type { Guest as GuestListGuest } from "../../guest-list/models/guestList.models";
import type { Guest as TAGuest } from "../models/tableAssignment.models";

export interface ApiLayout {
  layoutId: number;
  eventId?: number;
  name: string;
  description?: string;
  isActive: boolean;
  xGridSize: number;
  yGridSize: number;
}

export interface ApiTable {
  tableId: number;
  layoutId: number;
  tableNumber: number;
  numberOfSeats: number;
  shape: string;
  xGrid: number;
  yGrid: number;
}

export interface ApiAssignment {
  tableId: number;
  guestId: number;
  seatNumber: number;
}

export function mapGuestListToTA(g: GuestListGuest): TAGuest {
  return {
    guest_id: g.guest_id,
    event_id: g.event_id ?? "",
    first_name: g.first_name,
    last_name: g.last_name,
    email: g.email ?? null,
    phone: g.phone ?? null,
    relation_id: g.relation_id ?? "",
    plus_one: g.plus_one == null ? false : Boolean(g.plus_one),
    rsvp_status: g.rsvp_status,
    party_size: g.party_size,
    dietary_restrictions: Array.isArray(g.dietary_restrictions)
      ? g.dietary_restrictions.join(", ")
      : null,
    accessibility_needs: g.accesability_needs ?? null,
    notes: g.notes ?? null,
  };
}

export function deleteAssignment(a: TableAssignment): void {
  apiDelete(`/api/tableassignments/${a.table_id}/${a.guest_id}`)
    .catch((e) => console.error("[unassignAll] delete failed:", e));
}

export async function loadTableAssignmentData(eventId: number, signal: AbortSignal) {
  const [layouts, rawGuests, relations] = await Promise.all([
    apiGet<ApiLayout[]>("/api/tablelayouts/active", { signal }),
    fetchGuests(eventId),
    fetchRelations(),
  ]);
  const guests = rawGuests.map(mapGuestListToTA);

  const mappedLayouts: TableLayout[] = (Array.isArray(layouts) ? layouts : []).map((l: ApiLayout) => ({
    layout_id: String(l.layoutId),
    event_id: l.eventId != null ? String(l.eventId) : String(eventId),
    name: l.name,
    description: l.description ?? null,
    is_active: l.isActive,
    x_grid_size: l.xGridSize,
    y_grid_size: l.yGridSize,
  }));

  const activeLayout = mappedLayouts.find((l) => l.is_active) ?? mappedLayouts[0];

  let tablesRaw: Table[] = [];
  let assignmentsRaw: TableAssignment[] = [];

  if (activeLayout) {
    const layoutId = activeLayout.layout_id;
    const [tables, assignments] = await Promise.all([
      apiGet<ApiTable[]>(`/api/eventtables/layout/${layoutId}`, { signal }),
      apiGet<ApiAssignment[]>(`/api/tableassignments/layout/${layoutId}`, { signal }),
    ]);
    tablesRaw = (Array.isArray(tables) ? tables : []).map((t: ApiTable) => ({
      table_id: String(t.tableId),
      layout_id: String(t.layoutId),
      table_number: t.tableNumber,
      total_number: t.numberOfSeats,
      shape: t.shape,
      x_grid: t.xGrid,
      y_grid: t.yGrid,
    }));
    assignmentsRaw = (Array.isArray(assignments) ? assignments : []).map((a: ApiAssignment) => ({
      table_id: String(a.tableId),
      guest_id: String(a.guestId),
      seat_number: a.seatNumber,
    }));
  }

  return { guests, relations, layouts: mappedLayouts, tables: tablesRaw, assignments: assignmentsRaw };
}
