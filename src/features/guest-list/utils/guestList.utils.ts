import type { Guest, GuestFilters, RsvpStatus } from "../models/guestList.models";

export const escapeCsv = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replaceAll(/"/g, '""')}"`;
  }
  return s;
};

const handleQuote = (
  text: string,
  i: number,
  cur: string,
  inQuotes: boolean,
): [newI: number, newCur: string, newInQuotes: boolean] => {
  if (inQuotes && text[i + 1] === '"') {
    return [i + 1, cur + '"', inQuotes];
  }
  return [i, cur, !inQuotes];
};

export const parseCsv = (text: string): string[][] => {
  const normalized = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (ch === '"') {
      [i, cur, inQuotes] = handleQuote(normalized, i, cur, inQuotes);
      continue;
    }

    if (inQuotes) { cur += ch; continue; }

    if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n") {
      rows.push([...row, cur]);
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }

  if (cur !== "" || row.length) rows.push([...row, cur]);
  return rows;
};

const VALID_RSVP_STATUSES = new Set<RsvpStatus>(["pending", "attending", "not_attending", "maybe"]);

const toRsvpStatus = (val: string): RsvpStatus =>
  VALID_RSVP_STATUSES.has(val as RsvpStatus) ? (val as RsvpStatus) : "pending";

export const parseCsvToGuests = (text: string): Guest[] => {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("Empty CSV");
  const headers = rows[0].map((h) => h.trim());
  const col = (row: string[], key: string): string => {
    const i = headers.indexOf(key);
    return i >= 0 ? (row[i] ?? "") : "";
  };
  return rows.slice(1).map((r, idx) => {
    const status = toRsvpStatus(col(r, "rsvp_status") || "pending");
    const rawParty = Number(col(r, "party_size") || col(r, "party") || 1) || 1;
    const partySize = status === "not_attending" ? 0 : rawParty;
    const dietaryRaw = col(r, "dietary_restrictions");
    const dietary = dietaryRaw
      ? dietaryRaw.split(/,|;/).map((s) => s.trim()).filter(Boolean)
      : undefined;
    return {
      guest_id: col(r, "guest_id") || `import-${Date.now()}-${idx}`,
      first_name: col(r, "first_name") || col(r, "first"),
      last_name: col(r, "last_name") || col(r, "last"),
      email: col(r, "email") || undefined,
      phone: col(r, "phone") || undefined,
      relation_id: col(r, "relation_id") || undefined,
      rsvp_status: status,
      party_size: partySize,
      dietary_restrictions: dietary,
      accesability_needs: col(r, "accesability_needs") || col(r, "accessibility") || undefined,
      notes: col(r, "notes") || undefined,
      plus_one: col(r, "plus_one") || null,
    };
  });
};

const matchesStatus = (guest: Guest, status: GuestFilters["status"]): boolean => {
  if (!status || status === "all") return true;
  if (Array.isArray(status)) return status.includes(guest.rsvp_status);
  return guest.rsvp_status === status;
};

const matchesRelation = (guest: Guest, relationId: GuestFilters["relation_id"]): boolean => {
  if (!relationId) return true;
  if (Array.isArray(relationId)) return relationId.includes(guest.relation_id ?? "");
  return guest.relation_id === relationId;
};

const matchesSpecials = (guest: Guest, specials: GuestFilters["specials"]): boolean => {
  if (!specials || specials.length === 0) return true;
  const hasDiet = specials.some((s) => (guest.dietary_restrictions ?? []).includes(s));
  const hasAccessibility = specials.some((s) => guest.accesability_needs === s);
  return hasDiet || hasAccessibility;
};

const matchesQuery = (guest: Guest, query: GuestFilters["query"]): boolean => {
  if (!query || query.trim() === "") return true;
  const q = query.toLowerCase();
  const inName = `${guest.first_name} ${guest.last_name}`.toLowerCase().includes(q);
  const inEmail = (guest.email ?? "").toLowerCase().includes(q);
  return inName || inEmail;
};

export const applyGuestFilters = (guests: Guest[], filters: GuestFilters): Guest[] =>
  guests.filter(
    (g) =>
      matchesStatus(g, filters.status) &&
      matchesRelation(g, filters.relation_id) &&
      matchesSpecials(g, filters.specials) &&
      matchesQuery(g, filters.query),
  );
