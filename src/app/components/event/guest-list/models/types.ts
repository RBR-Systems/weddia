export type RsvpStatus = "pending" | "attending" | "not_attending" | "maybe";

export interface Guest {
  guest_id: string;
  event_id?: string;
  first_name: string;
  last_name: string;
  relation_id?: string;
  email?: string;
  phone?: string;
  country?: string;
  plus_one?: string | null;
  rsvp_status: RsvpStatus;
  party_size: number;
  dietary_restrictions?: string[];
  accesability_needs?: string;
  notes?: string;
  invited_at?: string;
  rsvp_at?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  attending: "Attending",
  maybe: "Maybe",
  not_attending: "Not Attending",
};

export const STATUS_COLORS: Record<string, string> = {
  attending: "green",
  pending: "gold",
  maybe: "blue",
  not_attending: "default",
};

export function formatStatusLabel(s: string) {
  return STATUS_LABELS[s] ?? s;
}

export function statusColor(s: string) {
  return STATUS_COLORS[s] ?? "default";
}
