import { Guest } from "../../guest-list/models/types";

export interface CheckInGuest extends Guest {
  checked_in: boolean;
  checked_in_at: string | null;
  actual_party_size: number | null;
  no_show: boolean;
  check_in_notes: string;
  is_vip: boolean;
  // Joined data
  table_id?: string | null;
  seat_number?: number | null;
  relation_name?: string;
}

export type CheckInStatusFilter =
  | "all"
  | "checked_in"
  | "not_arrived"
  | "special_needs";

export interface CheckInStats {
  totalGuests: number;
  checkedIn: number;
  notArrived: number;
  attendanceRate: number;
  specialNeedsCount: number;
}

export interface TableAssignmentInfo {
  table_id: string;
  guest_id: string;
  seat_number: number;
}
