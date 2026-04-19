import type {
  HFGuest,
  HFTable,
  SeatingAssignment,
  SeatingResponse,
} from "../models/huggingface.models";
import { MIN_PARTY_SIZE } from "../constants/tableAssignment.constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * HF responses can nest the generated text in several shapes.
 * Check each known field in priority order.
 */
function extractTextFromCandidate(candidate: unknown): string | null {
  if (typeof candidate === "string" && candidate) return candidate;
  if (!isRecord(candidate)) return null;

  if (typeof candidate.generated_text === "string")
    return candidate.generated_text;

  if (isRecord(candidate.message)) {
    const { content } = candidate.message;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      const part = content.find(
        (p): p is Record<string, unknown> =>
          isRecord(p) && typeof p.text === "string",
      );
      if (part) return part.text as string;
    }
  }

  if (typeof candidate.text === "string") return candidate.text;
  if (typeof candidate.output_text === "string") return candidate.output_text;

  return null;
}

function extractTextFromChoices(choices: unknown[]): string | null {
  for (const choice of choices) {
    const text = extractTextFromCandidate(choice);
    if (text) return text;

    if (isRecord(choice)) {
      const msgText = extractTextFromCandidate(choice.message);
      if (msgText) return msgText;
      const deltaText = extractTextFromCandidate(choice.delta);
      if (deltaText) return deltaText;
    }
  }
  return null;
}

export function extractTextFromResponse(data: unknown): string {
  if (Array.isArray(data) && data.length > 0) {
    for (const item of data) {
      const text = extractTextFromCandidate(item);
      if (text) return text;
    }
  }

  if (isRecord(data) && Array.isArray(data.choices)) {
    const text = extractTextFromChoices(data.choices as unknown[]);
    if (text) return text;
  }

  if (isRecord(data)) {
    const text = extractTextFromCandidate(data);
    if (text) return text;
  }

  if (typeof data === "string" && data) return data;

  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

/**
 * Linear-time scan that is aware of JSON strings to safely find
 * the first top-level JSON object in arbitrary text.
 */
export function extractJsonObject(str: string): string | null {
  let inString = false;
  let stringChar = "";
  let escape = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (!inString) {
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        continue;
      }

      if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
        continue;
      }

      if (ch === "}") {
        if (depth > 0) {
          depth--;
          if (depth === 0 && start !== -1) {
            return str.slice(start, i + 1);
          }
        }
        continue;
      }
    } else {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        stringChar = "";
      }
    }
  }
  return null;
}

export function parseSeatingResponse(data: unknown): SeatingResponse {
  const text = extractTextFromResponse(data);
  const jsonText = extractJsonObject(text);

  if (!jsonText) {
    throw new Error("No JSON found in model response");
  }

  let result: SeatingResponse;
  try {
    result = JSON.parse(jsonText) as SeatingResponse;
  } catch {
    throw new Error("Failed to parse JSON from model response");
  }

  if (!result.assignments || !Array.isArray(result.assignments)) {
    throw new Error("Invalid response structure from model");
  }

  return result;
}

export function validateSeatingAssignments(
  assignments: SeatingAssignment[],
  guests: HFGuest[],
  tables: HFTable[],
): string[] {
  const conflicts: string[] = [];

  const guestSizeMap = new Map<string, number>();
  for (const g of guests) {
    guestSizeMap.set(
      g.id,
      g.partySize && g.partySize > 0 ? g.partySize : MIN_PARTY_SIZE,
    );
  }

  const tableCapacityMap = new Map<string, number>();
  for (const t of tables) {
    tableCapacityMap.set(t.id, t.capacity);
  }

  const tableSums = new Map<string, number>();
  const assignedGuests = new Set<string>();

  for (const a of assignments) {
    const size = guestSizeMap.get(a.guestId) ?? MIN_PARTY_SIZE;

    if (!guestSizeMap.has(a.guestId)) {
      conflicts.push(`Unknown guest assigned: ${a.guestId}`);
    }
    if (!tableCapacityMap.has(a.tableId)) {
      conflicts.push(`Unknown table assigned: ${a.tableId}`);
    }
    if (assignedGuests.has(a.guestId)) {
      conflicts.push(`Guest assigned more than once: ${a.guestId}`);
    }

    assignedGuests.add(a.guestId);
    tableSums.set(a.tableId, (tableSums.get(a.tableId) ?? 0) + size);
  }

  for (const [tableId, sum] of tableSums.entries()) {
    const cap = tableCapacityMap.get(tableId) ?? 0;
    if (sum > cap) {
      conflicts.push(
        `Table ${tableId} over capacity: assigned ${sum} seats but capacity is ${cap}`,
      );
    }
  }

  return conflicts;
}
