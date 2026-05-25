import { apiGet, apiPost, apiPatch, apiDelete } from "@/shared/api/apiClient";
import type { VendorEvent, VendorEventStatus } from "../models/budget.models";
import type { ApiVendorEvent } from "../models/apiRaw.models";

function mapVendorEvent(raw: ApiVendorEvent, eventId: number): VendorEvent {
  return {
    vendor_id: String(raw.vendorId),
    event_id: eventId,
    contracted_amount: raw.contractedAmount ?? undefined,
    contracted_date: raw.contractedDate ?? undefined,
    status: ((raw.status ?? "active") as VendorEventStatus),
    notes: raw.notes ?? undefined,
  };
}

export async function getEventVendors(eventId: number, signal?: AbortSignal): Promise<VendorEvent[]> {
  const raw = await apiGet<ApiVendorEvent[]>(`/api/vendors-events/event/${eventId}`, { signal });
  return raw.map((v) => mapVendorEvent(v, eventId));
}

export async function assignVendorToEvent(
  eventId: number,
  vendorId: string,
  opts?: { contractedAmount?: number; contractedDate?: string; notes?: string },
): Promise<void> {
  await apiPost(`/api/vendors-events`, {
    vendorId: Number(vendorId),
    eventId,
    status: "active",
    contractedAmount: opts?.contractedAmount ?? null,
    contractedDate: opts?.contractedDate ?? null,
    notes: opts?.notes ?? null,
  });
}

export async function unassignVendorFromEvent(eventId: number, vendorId: string): Promise<void> {
  await apiDelete(`/api/vendors-events/${eventId}/${vendorId}`);
}

export async function updateVendorEvent(
  eventId: number,
  vendorId: string,
  data: { contractedAmount?: number; contractedDate?: string; status?: VendorEventStatus; notes?: string },
): Promise<void> {
  await apiPatch(`/api/vendors-events/${eventId}/${vendorId}`, data);
}
