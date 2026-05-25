import i18next from "i18next";
import {
  DEFAULT_VENUE_HEIGHT_METERS,
  DEFAULT_VENUE_WIDTH_METERS,
} from "../constants/tableAssignment.constants";
import type { Guest, Table, TableAssignment, TableLayout } from "../models/tableAssignment.models";
import styles from "../components/Tables/TableTileContent/TableTile.module.css";

export function getActiveGridSize(layouts: TableLayout[]): {
  xGridSize: number;
  yGridSize: number;
} {
  const active = layouts.find((l) => l.is_active) ?? layouts[0];
  return {
    xGridSize: active?.x_grid_size ?? DEFAULT_VENUE_WIDTH_METERS,
    yGridSize: active?.y_grid_size ?? DEFAULT_VENUE_HEIGHT_METERS,
  };
}

export function fullName(g: Pick<Guest, "first_name" | "last_name">) {
  return `${g.first_name} ${g.last_name}`.trim();
}

export function parseGuestIdFromDragId(id: unknown) {
  if (typeof id !== "string") return null;
  if (!id.startsWith("guest:")) return null;
  const guestId = id.slice("guest:".length);
  return guestId || null;
}

export function getNextAvailableSeatNumber(
  capacity: number,
  usedSeatNumbers: number[],
  partySize = 1,
) {
  const used = new Set(usedSeatNumbers);
  for (let seat = 1; seat <= capacity - partySize + 1; seat += 1) {
    let fits = true;
    for (let s = seat; s < seat + partySize; s += 1) {
      if (used.has(s)) {
        fits = false;
        break;
      }
    }
    if (fits) return seat;
  }
  return null;
}

export function getGuestPartySize(
  guest: Pick<Guest, "party_size" | "plus_one"> | undefined,
): number {
  return guest?.party_size ?? (guest?.plus_one ? 2 : 1);
}

export function parseSeatDropTarget(
  overId: string,
): { tableId: string; seatNumber: number } | null {
  const match = overId.match(/^table:([^:]+):seat:(\d+)$/);
  if (!match) return null;
  return { tableId: match[1], seatNumber: Number(match[2]) };
}

export function parseTableDropTarget(overId: string): string | null {
  const match = overId.match(/^table:([^:]+)$/);
  return match ? match[1] : null;
}

export function findFirstAvailableSeat(
  tableId: string,
  capacity: number,
  partySize: number,
  assignments: TableAssignment[],
  guestsById: Map<string, Guest>,
  excludeGuestId?: string,
): number | null {
  const occupied = new Set<number>();
  for (const a of assignments) {
    if (a.guest_id === excludeGuestId) continue;
    if (a.table_id !== tableId) continue;
    const g = guestsById.get(a.guest_id);
    const ps = getGuestPartySize(g);
    for (let s = a.seat_number; s < a.seat_number + ps; s += 1) {
      occupied.add(s);
    }
  }
  for (let s = 1; s <= capacity; s += 1) {
    let fits = true;
    for (let seat = s; seat < s + partySize; seat += 1) {
      if (occupied.has(seat) || seat > capacity) {
        fits = false;
        break;
      }
    }
    if (fits) return s;
  }
  return null;
}

export function getTableLabel(table: Table) {
  const m = table.table_id.match(/(?:table[-_]?)(\d+)/i);
  if (m) return i18next.t("tableAssignment.table", { number: Number(m[1]) });
  return table.table_id
    .replaceAll(/[-_]/g, " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

export function getBadgeColor(occupancy: number, capacity: number) {
  if (capacity <= 0) return "default";
  const ratio = occupancy / capacity;
  if (ratio >= 1) return "volcano";
  if (ratio >= 0.8) return "orange";
  if (ratio >= 0.5) return "gold";
  return "green";
}

export function getTableShapeClass(shape: Table["shape"]) {
  switch (shape) {
    case "round":
      return styles.tableRound;
    case "square":
      return styles.tableSquare;
    case "rectangular":
      return styles.tableRectangular;
    default:
      return styles.tableSquare;
  }
}
