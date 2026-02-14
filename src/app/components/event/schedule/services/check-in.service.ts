import { Guest } from "../../guest-list/models/types";
import {
  CheckInGuest,
  CheckInStats,
  TableAssignmentInfo,
} from "../models/check-in-types";

interface GuestListData {
  relations: { relation_id: string; name: string; description?: string }[];
  guests: any[];
  table_assignments: TableAssignmentInfo[];
}

/** Detect VIP guests based on notes (maid of honor, best man, etc.) */
function detectVip(notes?: string): boolean {
  if (!notes) return false;
  const lower = notes.toLowerCase();
  return (
    lower.includes("maid of honor") ||
    lower.includes("best man") ||
    lower.includes("officiant") ||
    lower.includes("dama de honor") ||
    lower.includes("padrino")
  );
}

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return [];
    return trimmed
      .split(/,|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function fetchCheckInData(): Promise<{
  guests: CheckInGuest[];
  relations: { relation_id: string; name: string }[];
}> {
  try {
    const res = await fetch("/data/guest-list-data.json");
    if (!res.ok) throw new Error("Failed to load guest data");
    const json: GuestListData = await res.json();

    const relations = Array.isArray(json.relations) ? json.relations : [];
    const rawGuests = Array.isArray(json.guests) ? json.guests : [];
    const assignments = Array.isArray(json.table_assignments)
      ? json.table_assignments
      : [];

    const relationsMap = new Map(
      relations.map((r) => [r.relation_id, r.name])
    );
    const assignmentMap = new Map(
      assignments.map((a) => [a.guest_id, a])
    );

    const guests: CheckInGuest[] = rawGuests.map((g: any) => {
      const assignment = assignmentMap.get(g.guest_id);
      const dietaryRestrictions = toStringArray(g.dietary_restrictions);

      return {
        guest_id: String(g.guest_id ?? ""),
        event_id: g.event_id,
        first_name: String(g.first_name ?? ""),
        last_name: String(g.last_name ?? ""),
        relation_id: g.relation_id,
        email: g.email,
        phone: g.phone,
        country: g.country || undefined,
        plus_one: g.plus_one ?? null,
        rsvp_status: g.rsvp_status ?? "pending",
        party_size: Number(g.party_size ?? 1) || 1,
        dietary_restrictions: dietaryRestrictions,
        accesability_needs: g.accesability_needs || g.accessibility || undefined,
        notes: g.notes || undefined,
        invited_at: g.invited_at,
        rsvp_at: g.rsvp_at,
        // Check-in fields
        checked_in: false,
        checked_in_at: null,
        actual_party_size: null,
        no_show: false,
        check_in_notes: "",
        is_vip: detectVip(g.notes),
        // Table data
        table_id: assignment?.table_id ?? null,
        seat_number: assignment?.seat_number ?? null,
        relation_name: relationsMap.get(g.relation_id) ?? undefined,
      };
    });

    return { guests, relations };
  } catch (err) {
    console.error("fetchCheckInData error", err);
    return { guests: [], relations: [] };
  }
}

export function computeStats(guests: CheckInGuest[]): CheckInStats {
  const expectedGuests = guests.filter(
    (g) => g.rsvp_status !== "not_attending"
  );
  const checkedIn = expectedGuests.filter((g) => g.checked_in).length;
  const notArrived = expectedGuests.filter((g) => !g.checked_in).length;
  const specialNeedsCount = expectedGuests.filter(
    (g) =>
      (g.dietary_restrictions && g.dietary_restrictions.length > 0) ||
      !!g.accesability_needs
  ).length;

  return {
    totalGuests: expectedGuests.length,
    checkedIn,
    notArrived,
    attendanceRate:
      expectedGuests.length > 0
        ? Math.round((checkedIn / expectedGuests.length) * 100)
        : 0,
    specialNeedsCount,
  };
}
