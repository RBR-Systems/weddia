export interface HFGuest {
  id: string;
  name: string;
  tags?: string[];
  tableId?: string | null;
  partySize?: number;
}

export interface HFTable {
  id: string;
  name: string;
  shape: "round" | "square" | "rectangular" | string;
  capacity: number;
  position: { x: number; y: number };
}

export interface SeatingRequest {
  guests: HFGuest[];
  tables: HFTable[];
  userMessage: string;
  constraints?: string[];
}

export interface SeatingResponse {
  assignments: Array<{
    guestId: string;
    tableId: string;
    reasoning?: string;
  }>;
  explanation: string;
  conflicts?: string[];
}

function buildSeatingPrompt(request: SeatingRequest): string {
  const { guests, tables, userMessage, constraints } = request;

  const guestList = guests
    .map((g) => {
      const tags = g.tags?.join(", ") || "none";
      const current = g.tableId
        ? ` (currently at ${g.tableId})`
        : " (unassigned)";
      const party =
        g.partySize && g.partySize > 1 ? ` - Party size: ${g.partySize}` : "";
      return `- ${g.name} [ID: ${g.id}] - Tags: ${tags}${party}${current}`;
    })
    .join("\n");

  const tableList = tables
    .map((t) => {
      return `- ${t.name} [ID: ${t.id}] - Capacity: ${t.capacity}, Shape: ${t.shape}`;
    })
    .join("\n");

  const constraintText = constraints?.length
    ? `\n\nConstraints:\n${constraints.map((c) => `- ${c}`).join("\n")}`
    : "";

  return `You are a wedding seating arrangement assistant. Your job is to assign guests to tables
based on relationships, preferences, and strict capacity rules.

---

## Data Definitions

**Each guest object has:**
- id: unique identifier
- name: display name
- partySize: number of seats this guest occupies (always ≥ 1; a guest with a +1 has partySize 2, a family of 4 has partySize 4). Default to 1 if missing.
- tags: relationship tags (e.g., "bride_family", "groom_family", "children", "elderly", "coworker")
- currentTableId: table they are already assigned to, or null

**Each table object has:**
- id: unique identifier
- name: display name
- capacity: total number of seats at this table
- assignedGuests: array of guest objects already seated here

---

## Guests
${guestList}

## Available Tables
${tableList}
${constraintText}

## User Request
${userMessage}

---

## Mandatory Capacity Rule (enforce for every assignment)

For each table, compute: occupiedSeats = sum of partySize for every guest in assignedGuests remainingSeats = capacity - occupiedSeats

A guest may only be assigned to a table if: guest.partySize ≤ remainingSeats

A party must NEVER be split across tables. The entire party (guest.partySize seats)
must fit within the remaining seats of a single table.

If no table can fit a guest's party, add that guest to the "unassignable" list
with a reason. Do not assign them.

---

## Assignment Priority (resolve conflicts in this order)
1. Capacity rule above — always hard constraint, never break it
2. Explicit user instructions in the User Request
3. Keep existing assignments stable (avoid moving already-seated guests unless necessary)
4. Group guests by relationship tags: guests sharing tags should prefer the same table
5. Separate conflicting tags if specified (e.g., divorced couple)

---

## Edge Cases to Handle Explicitly
- If partySize is null or 0, treat it as 1.
- If a guest is already assigned (currentTableId is set), do not reassign unless the user explicitly asks to move them or a capacity violation exists.
- If the user request is ambiguous (e.g., "seat the Johnsons together" with multiple guests named Johnson), list the ambiguity in the "conflicts" field and do not guess.
- If two guests have conflicting tag-based rules (e.g., both tagged "seat_near_stage" but the stage table is full), honor capacity first and explain in conflicts.

---

## Response Format (strict JSON, no markdown, no extra text)

{
  "assignments": [
    {
      "guestId": "string",
      "tableId": "string",
      "seatsUsed": number,          // must equal guest.partySize
      "reasoning": "string"
    }
  ],
  "unassignable": [
    {
      "guestId": "string",
      "reason": "string"            // e.g., "partySize 5 exceeds remaining seats on all tables"
    }
  ],
  "tablesSummary": [
    {
      "tableId": "string",
      "capacityBefore": number,
      "seatsUsedAfter": number,
      "remainingAfter": number
    }
  ],
  "explanation": "string",
  "conflicts": [
    {
      "type": "capacity_violation | ambiguous_request | preference_conflict | other",
      "description": "string"
    }
  ]
}`;
}

async function hfFetch(prompt: string) {
  // Proxy the prompt through a server-side Next.js API route to avoid CORS
  // and keep the API key secret. The server route will call Hugging Face.
  const url = "/api/hf";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Hugging Face proxy error: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const data = await res.json().catch(() => null);
  return data;
}

export async function getSeatingRecommendation(
  request: SeatingRequest,
): Promise<SeatingResponse> {
  try {
    const prompt = buildSeatingPrompt(request);
    const { guests, tables } = request;
    const data: unknown = await hfFetch(prompt);

    // Try to extract the generated text or message content from common HF shapes
    let text = "";
    const trySetText = (candidate: unknown) => {
      if (!candidate) return false;
      if (typeof candidate === "string") {
        text = candidate;
        return true;
      }
      if (typeof candidate === "object") {
        const c = candidate as any;
        if (typeof c.generated_text === "string") {
          text = c.generated_text;
          return true;
        }
        if (c.message) {
          // message.content can be string or object with parts
          if (typeof c.message.content === "string") {
            text = c.message.content;
            return true;
          }
          if (Array.isArray(c.message.content)) {
            // sometimes content is an array of {type, text}
            const part = c.message.content.find((p: any) => p?.text);
            if (part && typeof part.text === "string") {
              text = part.text;
              return true;
            }
          }
        }
        if (typeof c.text === "string") {
          text = c.text;
          return true;
        }
        if (typeof c.output_text === "string") {
          text = c.output_text;
          return true;
        }
      }
      return false;
    };

    // 1) Direct array response
    if (Array.isArray(data) && data.length > 0) {
      for (const itm of data) {
        if (trySetText(itm)) break;
      }
    }

    // 2) choices array shape (e.g., { choices: [ { message: { content: ... } } ] })
    if (!text && typeof data === "object" && data !== null) {
      const d = data as any;
      if (Array.isArray(d.choices) && d.choices.length > 0) {
        for (const choice of d.choices) {
          // choice may contain message, text, output_text, generated_text
          if (trySetText(choice)) break;
          if (choice.message && trySetText(choice.message)) break;
          if (choice.delta && trySetText(choice.delta)) break;
        }
      }
    }

    // 3) fallback: object with direct fields
    if (!text && typeof data === "object" && data !== null) {
      trySetText(data);
    }

    // 4) string fallback
    if (!text && typeof data === "string") text = data;
    if (!text) {
      // Fallback: try to stringify
      try {
        text = JSON.stringify(data);
      } catch {
        text = String(data);
      }
    }

    // Extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in model response");
    }
    let result: SeatingResponse;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse JSON from model response");
    }
    if (!result.assignments || !Array.isArray(result.assignments)) {
      console.debug("getSeatingRecommendation: parsed JSON:", result);
      console.debug("getSeatingRecommendation: raw text:", text);
      throw new Error("Invalid response structure from model");
    }

    // Post-validate assignments against table capacities considering party sizes
    const conflicts: string[] = [];
    const guestSizeMap = new Map<string, number>();
    for (const g of guests) {
      guestSizeMap.set(g.id, g.partySize && g.partySize > 0 ? g.partySize : 1);
    }

    const tableCapacityMap = new Map<string, number>();
    for (const t of tables) {
      tableCapacityMap.set(t.id, t.capacity);
    }

    const tableSums = new Map<string, number>();
    const assignedGuests = new Set<string>();
    for (const a of result.assignments) {
      const size = guestSizeMap.get(a.guestId) ?? 1;
      if (!guestSizeMap.has(a.guestId)) {
        conflicts.push(`Unknown guest assigned: ${a.guestId}`);
      }
      if (!tableCapacityMap.has(a.tableId)) {
        conflicts.push(`Unknown table assigned: ${a.tableId}`);
      }
      const prev = tableSums.get(a.tableId) ?? 0;
      tableSums.set(a.tableId, prev + size);

      if (assignedGuests.has(a.guestId)) {
        conflicts.push(`Guest assigned more than once: ${a.guestId}`);
      }
      assignedGuests.add(a.guestId);
    }

    for (const [tableId, sum] of tableSums.entries()) {
      const cap = tableCapacityMap.get(tableId) ?? 0;
      if (sum > cap) {
        conflicts.push(
          `Table ${tableId} over capacity: assigned ${sum} seats but capacity is ${cap}`,
        );
      }
    }

    if (conflicts.length > 0) {
      result.conflicts = Array.from(
        new Set([...(result.conflicts || []), ...conflicts]),
      );
    }
    return result;
  } catch (err) {
    console.error("getSeatingRecommendation error:", err);
    throw err;
  }
}

export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const prompt = "Hello, this is a quick connectivity test.";
    const data: unknown = await hfFetch(prompt);
    if (!data) return false;

    if (Array.isArray(data) && data.length > 0) return true;
    if (typeof data === "object") return true;
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}
