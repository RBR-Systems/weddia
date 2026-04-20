import { MIN_PARTY_SIZE } from "../constants/tableAssignment.constants";
import type { SeatingAssignment } from "../models/huggingface.models";
import type { Guest, Table, TableAssignment } from "../models/tableAssignment.models";
import { getGuestPartySize, getNextAvailableSeatNumber } from "./table.utils";

function buildGuestMap(guests: Guest[]): Map<string, Guest> {
  return new Map(guests.map((g) => [g.guest_id, g]));
}

/**
 * Merges AI-generated seating assignments with existing assignments.
 * AI-assigned guests replace their previous seats; other guests are unchanged.
 * Uses a Set for O(n+m) guest lookup instead of nested .some() which is O(n*m).
 */
export function applyAiSeating(
  guests: Guest[],
  tables: Table[],
  currentAssignments: TableAssignment[],
  aiAssignments: ReadonlyArray<SeatingAssignment>,
): TableAssignment[] {
  const guestMap = buildGuestMap(guests);
  const aiGuestIds = new Set(aiAssignments.map((x) => x.guestId));
  const retained = currentAssignments.filter((a) => !aiGuestIds.has(a.guest_id));

  const usedSeats = new Map<string, number[]>();
  for (const a of retained) {
    const arr = usedSeats.get(a.table_id) ?? [];
    const ps = getGuestPartySize(guestMap.get(a.guest_id));
    for (let s = a.seat_number; s < a.seat_number + ps; s += 1) {
      arr.push(s);
    }
    usedSeats.set(a.table_id, arr);
  }

  const newAssignments: TableAssignment[] = [];
  for (const ai of aiAssignments) {
    const tbl = tables.find((t) => t.table_id === ai.tableId);
    if (!tbl) continue;
    const aiPartySize = getGuestPartySize(guestMap.get(ai.guestId));
    const used = usedSeats.get(ai.tableId) ?? [];
    const seat =
      getNextAvailableSeatNumber(tbl.total_number, used, aiPartySize) ?? 1;
    for (let s = seat; s < seat + aiPartySize; s += 1) {
      used.push(s);
    }
    usedSeats.set(ai.tableId, used);
    newAssignments.push({
      table_id: ai.tableId,
      guest_id: ai.guestId,
      seat_number: seat,
    });
  }

  return [...retained, ...newAssignments];
}

type GetSize = (a: TableAssignment) => number;

function partitionByOverlap(
  assignments: TableAssignment[],
  rangeStart: number,
  rangeEnd: number,
  getSize: GetSize,
): { displaced: TableAssignment[]; untouched: TableAssignment[] } {
  const displaced: TableAssignment[] = [];
  const untouched: TableAssignment[] = [];
  for (const a of assignments) {
    const end = a.seat_number + getSize(a) - 1;
    if (a.seat_number <= rangeEnd && end >= rangeStart) {
      displaced.push(a);
    } else {
      untouched.push(a);
    }
  }
  return { displaced, untouched };
}

function buildOccupied(
  fixed: TableAssignment[],
  moverStart: number,
  moverEnd: number,
  getSize: GetSize,
): Set<number> {
  const occupied = new Set<number>();
  for (const a of fixed) {
    for (let s = a.seat_number; s < a.seat_number + getSize(a); s += 1) {
      occupied.add(s);
    }
  }
  for (let s = moverStart; s <= moverEnd; s += 1) {
    occupied.add(s);
  }
  return occupied;
}

function seatsAreFree(start: number, size: number, occupied: ReadonlySet<number>): boolean {
  for (let s = start; s < start + size; s += 1) {
    if (occupied.has(s)) return false;
  }
  return true;
}

function findFirstFit(
  startCursor: number,
  size: number,
  occupied: ReadonlySet<number>,
  capacity: number,
): number | null {
  for (let cursor = startCursor; cursor <= capacity - size + 1; cursor += 1) {
    if (seatsAreFree(cursor, size, occupied)) return cursor;
  }
  return null;
}

function repackGuests(
  displaced: TableAssignment[],
  occupied: Set<number>,
  capacity: number,
  getSize: GetSize,
): TableAssignment[] | null {
  const sorted = [...displaced].sort((a, b) => a.seat_number - b.seat_number);
  const repacked: TableAssignment[] = [];
  let cursor = MIN_PARTY_SIZE;

  for (const a of sorted) {
    const size = getSize(a);
    const seat = findFirstFit(cursor, size, occupied, capacity);
    if (seat === null) return null;

    repacked.push({ ...a, seat_number: seat });
    for (let s = seat; s < seat + size; s += 1) {
      occupied.add(s);
    }
    cursor = seat + size;
  }

  return repacked;
}

/**
 * Moves a guest to a new seat, handling same-table displacement and cross-table moves.
 * Returns the new assignments array, or null if the move is invalid/rejected.
 */
export function moveGuestSeat(
  guests: Guest[],
  tables: Table[],
  assignments: TableAssignment[],
  payload: { guestId: string; tableId: string; seatNumber: number },
): TableAssignment[] | null {
  const { guestId, tableId, seatNumber: newStart } = payload;
  const guestMap = buildGuestMap(guests);
  const oldAssign = assignments.find((a) => a.guest_id === guestId);
  const movingSize = guestMap.get(guestId)?.party_size ?? MIN_PARTY_SIZE;

  // New guest or cross-table move — no displacement needed
  if (!oldAssign || oldAssign.table_id !== tableId) {
    return [
      ...assignments.filter((a) => a.guest_id !== guestId),
      { table_id: tableId, guest_id: guestId, seat_number: newStart },
    ];
  }

  if (newStart === oldAssign.seat_number) return null;

  const newEnd = newStart + movingSize - 1;
  const capacity = tables.find((t) => t.table_id === tableId)?.total_number ?? 0;

  if (newStart < MIN_PARTY_SIZE || newEnd > capacity) return null;

  const getSize: GetSize = (a) => guestMap.get(a.guest_id)?.party_size ?? MIN_PARTY_SIZE;

  const otherTables = assignments.filter((a) => a.table_id !== tableId);
  const sameTable = assignments
    .filter((a) => a.table_id === tableId && a.guest_id !== guestId)
    .sort((a, b) => a.seat_number - b.seat_number);

  const { displaced, untouched } = partitionByOverlap(sameTable, newStart, newEnd, getSize);

  if (displaced.length === 0) {
    return [
      ...otherTables,
      ...sameTable,
      { table_id: tableId, guest_id: guestId, seat_number: newStart },
    ];
  }

  const occupied = buildOccupied(untouched, newStart, newEnd, getSize);
  const repacked = repackGuests(displaced, occupied, capacity, getSize);
  if (repacked === null) return null;

  return [
    ...otherTables,
    ...untouched,
    { table_id: tableId, guest_id: guestId, seat_number: newStart },
    ...repacked,
  ];
}
