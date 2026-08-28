import type { Guest, GuestFilters, ImportWarning, RsvpStatus } from "../models/guestList.models";

interface RelationCatalogEntry {
  relation_id: string;
  name: string;
}

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

/** Vocabulario real de RSVP usado por el resto de la app (ver `Guest.rsvp_status` / `guestApi.ts`). */
const VALID_RSVP_STATUSES = new Set<RsvpStatus>(["pending", "attending", "not_attending", "maybe"]);

/**
 * Sinónimos aceptados en el CSV (vocabulario del backend en inglés y variantes en español),
 * todos normalizados (lowercase, sin acentos, trim) como clave.
 */
const RSVP_SYNONYMS: Record<string, RsvpStatus> = {
  confirmed: "attending",
  confirmado: "attending",
  confirmada: "attending",
  attending: "attending",
  asiste: "attending",
  declined: "not_attending",
  rechazado: "not_attending",
  rechazada: "not_attending",
  declinado: "not_attending",
  declinada: "not_attending",
  not_attending: "not_attending",
  "no asiste": "not_attending",
  pending: "pending",
  pendiente: "pending",
  maybe: "maybe",
  "tal vez": "maybe",
  talvez: "maybe",
  quiza: "maybe",
  quizas: "maybe",
};

/** lowercase + sin acentos + trim, para comparar texto sin depender de mayúsculas/acentos. */
export const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const toRsvpStatus = (
  rawVal: string,
  warnings: ImportWarning[],
  rowIndex: number,
): RsvpStatus => {
  const val = rawVal.trim();
  if (VALID_RSVP_STATUSES.has(val as RsvpStatus)) return val as RsvpStatus;

  const key = normalize(val);
  if (key in RSVP_SYNONYMS) return RSVP_SYNONYMS[key];

  if (val !== "") {
    warnings.push({ row: rowIndex, field: "rsvp_status", rawValue: rawVal });
  }
  return "pending";
};

const resolveRelationId = (
  rawValue: string,
  relations: RelationCatalogEntry[],
  warnings: ImportWarning[],
  rowIndex: number,
): string | undefined => {
  const val = rawValue.trim();
  if (!val) return undefined;

  // Retrocompatibilidad: ID numérico existente en el catálogo.
  if (relations.some((r) => r.relation_id === val)) return val;

  // Buscar por nombre (case-insensitive, sin acentos).
  const key = normalize(val);
  const match = relations.find((r) => normalize(r.name) === key);
  if (match) return match.relation_id;

  warnings.push({ row: rowIndex, field: "relation_id", rawValue });
  return undefined;
};

export const parseCsvToGuests = (
  text: string,
  relations: RelationCatalogEntry[] = [],
): { guests: Guest[]; warnings: ImportWarning[] } => {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("Empty CSV");
  const headers = rows[0].map((h) => h.trim());
  const col = (row: string[], key: string): string => {
    const i = headers.indexOf(key);
    return i >= 0 ? (row[i] ?? "") : "";
  };

  const warnings: ImportWarning[] = [];

  const guests = rows.slice(1).map((r, idx) => {
    const rowIndex = idx + 2; // +1 por header, +1 por índice 1-based para el usuario
    const status = toRsvpStatus(col(r, "rsvp_status") || "pending", warnings, rowIndex);
    const rawParty = Number(col(r, "party_size") || col(r, "party") || 1) || 1;
    const partySize = status === "not_attending" ? 0 : rawParty;
    const dietaryRaw = col(r, "dietary_restrictions");
    const dietary = dietaryRaw
      ? dietaryRaw.split(/,|;/).map((s) => s.trim()).filter(Boolean)
      : undefined;
    const relationRaw = col(r, "relation_id") || col(r, "grupo") || col(r, "group");
    return {
      guest_id: col(r, "guest_id") || `import-${Date.now()}-${idx}`,
      first_name: col(r, "first_name") || col(r, "first"),
      last_name: col(r, "last_name") || col(r, "last"),
      email: col(r, "email") || undefined,
      phone: col(r, "phone") || undefined,
      relation_id: resolveRelationId(relationRaw, relations, warnings, rowIndex),
      rsvp_status: status,
      party_size: partySize,
      dietary_restrictions: dietary,
      accesability_needs: col(r, "accesability_needs") || col(r, "accessibility") || undefined,
      notes: col(r, "notes") || undefined,
      plus_one: col(r, "plus_one") || null,
    };
  });

  return { guests, warnings };
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
