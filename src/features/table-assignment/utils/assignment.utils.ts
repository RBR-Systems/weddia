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
  const movingSize = guestMap.get(guestId)?.party_size ?? 1;

  const createSimpleMove = (): TableAssignment[] => [
    ...assignments.filter((a) => a.guest_id !== guestId),
    { table_id: tableId, guest_id: guestId, seat_number: newStart },
  ];

  // New or cross-table assignment
  if (!oldAssign || oldAssign.table_id !== tableId) {
    return createSimpleMove();
  }

  // Same-table move
  const oldStart = oldAssign.seat_number;
  if (newStart === oldStart) return null;

  const newEnd = newStart + movingSize - 1;
  const capacity =
    tables.find((t) => t.table_id === tableId)?.total_number ?? 0;

  if (newEnd > capacity || newStart < 1) return null;

  const getSizeForGuest = (a: { guest_id: string }) =>
    guestMap.get(a.guest_id)?.party_size ?? 1;

  const tableAssignments = assignments
    .filter((a) => a.table_id === tableId)
    .sort((a, b) => a.seat_number - b.seat_number);

  const otherTableAssignments = assignments.filter(
    (a) => a.table_id !== tableId,
  );
  const rest = tableAssignments.filter((a) => a.guest_id !== guestId);

  // Split into displaced (overlapping mover's new range) and untouched
  const displaced: TableAssignment[] = [];
  const untouched: TableAssignment[] = [];
  for (const a of rest) {
    const aEnd = a.seat_number + getSizeForGuest(a) - 1;
    if (a.seat_number <= newEnd && aEnd >= newStart) {
      displaced.push(a);
    } else {
      untouched.push(a);
    }
  }

  if (displaced.length === 0) {
    return [
      ...otherTableAssignments,
      ...rest,
      { table_id: tableId, guest_id: guestId, seat_number: newStart },
    ];
  }

  // Build occupied-seat set from untouched guests + mover at new position
  const occupied = new Set<number>();
  for (const a of untouched) {
    const aSize = getSizeForGuest(a);
    for (let s = a.seat_number; s < a.seat_number + aSize; s += 1) {
      occupied.add(s);
    }
  }
  for (let s = newStart; s <= newEnd; s += 1) {
    occupied.add(s);
  }

  // Repack displaced guests into free seats, preserving relative order
  displaced.sort((a, b) => a.seat_number - b.seat_number);
  const repacked: TableAssignment[] = [];
  let cursor = 1;
  for (const a of displaced) {
    const aSize = getSizeForGuest(a);
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
    if (cursor + aSize - 1 > capacity) return null;
    repacked.push({ ...a, seat_number: cursor });
    for (let s = cursor; s < cursor + aSize; s += 1) {
      occupied.add(s);
    }
    cursor += aSize;
  }

  return [
    ...otherTableAssignments,
    ...untouched,
    { table_id: tableId, guest_id: guestId, seat_number: newStart },
    ...repacked,
  ];
}
