import { Guest, Table } from "../models/types";
import styles from "../components/Tables/TableTile.module.css";

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
) {
  const used = new Set(usedSeatNumbers);
  for (let seat = 1; seat <= capacity; seat += 1) {
    if (!used.has(seat)) return seat;
  }
  return null;
}

export function getTableLabel(table: Table) {
  const m = table.table_id.match(/(?:table[-_]?)(\d+)/i);
  if (m) return `Table ${Number(m[1])}`;
  return table.table_id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
