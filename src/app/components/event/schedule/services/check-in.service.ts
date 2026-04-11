import { CheckInGuest, CheckInStats } from "../models/check-in-types";
import { fetchGuests, fetchRelations } from "../../guest-list/service/guest.service";

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
      guest_id: g.guest_id,
      event_id: g.event_id ?? "",
      first_name: g.first_name,
      last_name: g.last_name,
      relation_id: g.relation_id ?? "",
      email: g.email,
      phone: g.phone,
      plus_one: g.plus_one ?? null,
      rsvp_status: g.rsvp_status,
      party_size: g.party_size,
      dietary_restrictions: g.dietary_restrictions ?? [],
      accesability_needs: g.accesability_needs,
      notes: g.notes,
      invited_at: g.invited_at,
      rsvp_at: g.rsvp_at,
      // Check-in fields (client-only state)
      checked_in: false,
      checked_in_at: null,
      actual_party_size: null,
      no_show: false,
      check_in_notes: "",
      is_vip: g.notes
        ? /maid of honor|best man|officiant|dama de honor|padrino/i.test(g.notes)
        : false,
      table_id: null,
      seat_number: null,
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
