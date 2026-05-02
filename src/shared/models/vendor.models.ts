export interface Vendor {
  vendor_id: string;
  name: string;
  category?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  rating?: number;
  is_active?: boolean;
  total_spent?: number;
  expense_count?: number;
}
