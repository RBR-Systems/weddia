import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import type { Vendor } from "@/shared/models/vendor.models";
import { ADMIN_QUERY_PARAM } from "@/shared/constants/api.constants";

interface ApiVendor {
  vendorId: number;
  vendorName: string;
  category: string;
  contactPerson?: string;
  email?: string;
  mobilePhone?: string;
  phone?: string;
  address?: string;
  notes?: string;
  rating: number;
  isActive: boolean;
}

interface VendorInput {
  vendorName: string;
  category: string;
  contactPerson?: string;
  email?: string;
  mobilePhone?: string;
  address?: string;
  notes?: string;
  rating?: number;
  isActive?: boolean;
}

function toVendorPayload(data: VendorInput) {
  return {
    vendorName:    data.vendorName,
    category:      data.category,
    contactPerson: data.contactPerson ?? null,
    email:         data.email ?? null,
    mobilePhone:   data.mobilePhone ?? null,
    address:       data.address ?? null,
    notes:         data.notes ?? null,
    rating:        data.rating ?? 0,
    isActive:      data.isActive ?? true,
  };
}

function mapVendor(v: ApiVendor): Vendor {
  return {
    vendor_id:     String(v.vendorId),
    name:          v.vendorName,
    category:      v.category,
    contact_name:  v.contactPerson ?? "",
    email:         v.email ?? "",
    phone:         v.mobilePhone ?? v.phone ?? "",
    address:       v.address ?? "",
    notes:         v.notes ?? "",
    rating:        v.rating,
    is_active:     v.isActive,
    total_spent:   0,
    expense_count: 0,
  };
}

export async function getVendors(): Promise<Vendor[]> {
  const vendors = await apiGet<ApiVendor[]>("/api/vendors");
  return vendors.map(mapVendor);
}

export async function createVendor(data: Omit<VendorInput, "isActive">): Promise<Vendor> {
  const created = await apiPost<ApiVendor>(`/api/vendors?${ADMIN_QUERY_PARAM}`, toVendorPayload(data));
  return { vendor_id: String(created.vendorId), name: created.vendorName };
}

export async function updateVendor(vendorId: string, data: VendorInput): Promise<void> {
  await apiPut(`/api/vendors/${vendorId}?${ADMIN_QUERY_PARAM}`, toVendorPayload(data));
}

export async function deleteVendor(vendorId: string): Promise<void> {
  await apiDelete(`/api/vendors/${vendorId}`);
}
