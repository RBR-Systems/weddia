import type {
  SeatingRequest,
  SeatingResponse,
} from "../models/huggingface.models";
import { buildSeatingPrompt } from "../utils/seatingPrompt.utils";
import {
  parseSeatingResponse,
  validateSeatingAssignments,
} from "../utils/seatingResponse.utils";

const HF_PROXY_URL = "/api/hf";

async function hfFetch(prompt: string): Promise<unknown> {
  const res = await fetch(HF_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Hugging Face proxy error: ${res.status} ${res.statusText} ${text}`,
    );
  }

  return res.json().catch(() => null);
}

export async function getSeatingRecommendation(
  request: SeatingRequest,
): Promise<SeatingResponse> {
  const prompt = buildSeatingPrompt(request);
  const data = await hfFetch(prompt);
  const result = parseSeatingResponse(data);

  const conflicts = validateSeatingAssignments(
    result.assignments,
    request.guests,
    request.tables,
  );

  if (conflicts.length > 0) {
    result.conflicts = Array.from(
      new Set([...(result.conflicts ?? []), ...conflicts]),
    );
  }

  return result;
}

export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const data = await hfFetch("Hello, this is a quick connectivity test.");
    if (!data) return false;
    if (Array.isArray(data) && data.length > 0) return true;
    if (typeof data === "object") return true;
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}