import { Guest } from "../models/types";
import { apiGet, apiPost, apiDelete, apiPatch, ApiError } from "@/lib/apiClient";

interface ApiGuest {
  guestId: number;
  eventId: number;
  firstName: string;
  lastName: string;
  relationId: number;
  email?: string;
  mobilePhone?: string;
  phone?: string;
  plusOne?: number | null;
  rsvpStatus: string;
  partySize: number;
  dietaryRestrictions?: string | null;
  accessibilityNeeds?: string | null;
  notes?: string | null;
  invitedAt?: string | null;
  rsvpAt?: string | null;
}

function mapRsvpStatus(status: string): Guest["rsvp_status"] {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "attending";
    case "declined":
      return "not_attending";
    case "maybe":
      return "maybe";
    default:
      return "pending";
  }
}

function mapApiGuest(g: ApiGuest): Guest {
  const status = mapRsvpStatus(g.rsvpStatus);
  const partySize = status === "not_attending" ? 0 : g.partySize ?? 1;

  const dietary = g.dietaryRestrictions
    ? g.dietaryRestrictions.split(/,|;/).map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    guest_id: String(g.guestId),
    event_id: String(g.eventId),
    first_name: g.firstName ?? "",
    last_name: g.lastName ?? "",
    relation_id: String(g.relationId),
    email: g.email ?? undefined,
    phone: g.mobilePhone ?? g.phone ?? undefined,
    plus_one: g.plusOne != null ? String(g.plusOne) : null,
    rsvp_status: status,
    party_size: partySize,
    dietary_restrictions: dietary,
    accesability_needs: g.accessibilityNeeds ?? undefined,
    notes: g.notes ?? undefined,
    invited_at: g.invitedAt ?? undefined,
    rsvp_at: g.rsvpAt ?? undefined,
  } as Guest;
}

export async function fetchGuests(eventId: number): Promise<Guest[]> {
  try {
    const raw = await apiGet<ApiGuest[]>(`/api/guests/event/${eventId}`);
    return raw.map(mapApiGuest);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    console.error("fetchGuests error", err);
    return [];
  }
}

export async function fetchRelations(): Promise<
  { relation_id: string; name: string }[]
> {
  try {
    const raw = await apiGet<{ relationId: number; name: string }[]>(
      "/api/relations",
    );
    return raw.map((r) => ({ relation_id: String(r.relationId), name: r.name }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    console.error("fetchRelations error", err);
    return [];
  }
}

export async function removeGuest(guestId: string): Promise<void> {
  await apiDelete(`/api/guests/${guestId}`);
}

export async function updateRsvp(
  guestId: string,
  rsvpStatus: string,
): Promise<void> {
  const apiStatus =
    rsvpStatus === "attending"
      ? "confirmed"
      : rsvpStatus === "not_attending"
        ? "declined"
        : rsvpStatus;
  await apiPatch(`/api/guests/${guestId}/rsvp?adminId=1`, { rsvpStatus: apiStatus });
}

export async function createGuest(
  eventId: number,
  data: Omit<Guest, "guest_id" | "event_id">,
): Promise<Guest> {
  const body = {
    eventId,
    firstName: data.first_name,
    lastName: data.last_name,
    relationId: data.relation_id ? Number(data.relation_id) : undefined,
    email: data.email ?? null,
    mobilePhone: data.phone ?? null,
    plusOne: data.plus_one != null ? Number(data.plus_one) : null,
    rsvpStatus:
      data.rsvp_status === "attending"
        ? "confirmed"
        : data.rsvp_status === "not_attending"
          ? "declined"
          : data.rsvp_status,
    partySize: data.party_size ?? 1,
    dietaryRestrictions: Array.isArray(data.dietary_restrictions)
      ? data.dietary_restrictions.join(", ")
      : data.dietary_restrictions ?? null,
    accessibilityNeeds: data.accesability_needs ?? null,
    notes: data.notes ?? null,
  };
  const created = await apiPost<ApiGuest>(`/api/guests?adminId=1`, body);
  return mapApiGuest(created);
}
