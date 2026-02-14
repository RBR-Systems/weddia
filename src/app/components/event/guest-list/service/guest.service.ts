import { Guest } from "../models/types";

function toArrayOfStrings(value: any): string[] | undefined {
  if (!value && value !== "") return undefined;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    return trimmed
      .split(/,|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

function normalizeStatus(s: any): Guest["rsvp_status"] {
  const v = String(s || "").toLowerCase();
  if (v === "attending") return "attending";
  if (v === "not_attending" || v === "not attending" || v === "declined")
    return "not_attending";
  if (v === "maybe") return "maybe";
  return "pending";
}

export async function fetchGuests(): Promise<Guest[]> {
  try {
    const res = await fetch("/data/guest-list-data.json");
    if (!res.ok) throw new Error("Failed to load guest data");
    const json = await res.json();
    const rawGuests = Array.isArray(json?.guests) ? json.guests : [];

    const guests: Guest[] = rawGuests.map((g: any) => {
      const status = normalizeStatus(g.rsvp_status);
      let party = Number(g.party_size ?? g.party ?? 1) || 1;
      if (status === "not_attending") party = 0;

      return {
        guest_id: String(g.guest_id ?? g.id ?? ""),
        event_id: g.event_id,
        first_name: String(g.first_name ?? ""),
        last_name: String(g.last_name ?? ""),
        relation_id: g.relation_id,
        email: g.email,
        phone: g.phone,
        plus_one: g.plus_one ?? null,
        rsvp_status: status,
        party_size: party,
        dietary_restrictions: toArrayOfStrings(g.dietary_restrictions),
        accesability_needs:
          g.accesability_needs || g.accessibility || undefined,
        notes: g.notes || undefined,
        invited_at: g.invited_at || undefined,
        rsvp_at: g.rsvp_at || undefined,
      } as Guest;
    });

    return guests;
  } catch (err) {
    console.error("fetchGuests error", err);
    return [];
  }
}

export async function fetchRelations(): Promise<
  { relation_id: string; name: string }[]
> {
  try {
    const res = await fetch("/data/guest-list-data.json");
    if (!res.ok) throw new Error("Failed to load guest data");
    const json = await res.json();
    const rel = Array.isArray(json?.relations) ? json.relations : [];
    return rel.map((r: any) => ({
      relation_id: String(r.relation_id),
      name: String(r.name),
    }));
  } catch (err) {
    console.error("fetchRelations error", err);
    return [];
  }
}

export async function removeGuest(guest_id: string): Promise<void> {
  // Data is static in this demo app; just resolve immediately.
  // In a real app this would call an API to remove the guest.
  return Promise.resolve();
}
