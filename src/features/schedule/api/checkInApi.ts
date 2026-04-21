import { CheckInGuest, CheckInStats } from "../models/checkIn.models";
import { fetchGuests, fetchRelations } from "../../guest-list/api/guestApi";

const VIP_PATTERN = /maid of honor|best man|officiant|dama de honor|padrino/i;

const CHECK_IN_DEFAULTS: Pick<
  CheckInGuest,
  "checked_in" | "checked_in_at" | "actual_party_size" | "no_show" | "check_in_notes" | "table_id" | "seat_number"
> = {
  checked_in: false,
  checked_in_at: null,
  actual_party_size: null,
  no_show: false,
  check_in_notes: "",
  table_id: null,
  seat_number: null,
};

export async function fetchCheckInData(eventId: number = 1): Promise<{
  guests: CheckInGuest[];
  relations: { relation_id: string; name: string }[];
}> {
  try {
    const [rawGuests, relations] = await Promise.all([
      fetchGuests(eventId),
      fetchRelations(),
    ]);

    const guests: CheckInGuest[] = rawGuests.map((g) => ({
      ...g,
      event_id: g.event_id ?? "",
      relation_id: g.relation_id ?? "",
      plus_one: g.plus_one ?? null,
      dietary_restrictions: g.dietary_restrictions ?? [],
      ...CHECK_IN_DEFAULTS,
      is_vip: VIP_PATTERN.test(g.notes ?? ""),
      relation_name: relations.find((r) => r.relation_id === g.relation_id)?.name,
    }));

    return { guests, relations };
  } catch (err) {
    console.error("fetchCheckInData error", err);
    return { guests: [], relations: [] };
  }
}

export function computeStats(guests: CheckInGuest[]): CheckInStats {
  const expected = guests.filter((g) => g.rsvp_status !== "not_attending");
  const checkedIn = expected.filter((g) => g.checked_in).length;
  const notArrived = expected.filter((g) => !g.checked_in).length;
  const specialNeedsCount = expected.filter(
    (g) =>
      (g.dietary_restrictions && g.dietary_restrictions.length > 0) ||
      !!g.accesability_needs,
  ).length;

  return {
    totalGuests: expected.length,
    checkedIn,
    notArrived,
    attendanceRate:
      expected.length > 0
        ? Math.round((checkedIn / expected.length) * 100)
        : 0,
    specialNeedsCount,
  };
}
