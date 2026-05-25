export type Relation = {
  relation_id: string;
  name: string;
  description?: string | null;
};

export type Guest = {
  guest_id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  relation_id: string;
  plus_one: boolean;
  rsvp_status: string;
  party_size: number;
  dietary_restrictions?: string | null;
  accessibility_needs?: string | null;
  notes?: string | null;
};

export type TableLayout = {
  layout_id: string;
  event_id: string;
  x_grid_size: number;
  y_grid_size: number;
  name: string;
  description?: string | null;
  is_active: boolean;
};

export type Table = {
  table_id: string;
  layout_id: string;
  total_number: number;
  shape: "round" | "rectangular" | "square" | string;
  x_grid: number;
  y_grid: number;
  // Real-world units (meters)
  x_m?: number;
  y_m?: number;
  width_m?: number;
  height_m?: number;
};

export type TableAssignment = {
  table_id: string;
  guest_id: string;
  seat_number: number;
};

export type DragId = `guest:${string}` | `table:${string}` | "unassigned";

export type State = {
  relations: Relation[];
  guests: Guest[];
  layouts: TableLayout[];
  tables: Table[];
  assignments: TableAssignment[];
  metersToPixels: number;
  zoomScale: number;
  pan: { x: number; y: number };
  selectedTableId: string | null;
  guestSearch: string;
  relationFilter?: string;
  assignedFilter?: "all" | "assigned" | "unassigned";
  sideView: "guests" | "table";
  sidePanelOpen: boolean;
  aiChatOpen: boolean;
  activeDragId: DragId | null;
};
