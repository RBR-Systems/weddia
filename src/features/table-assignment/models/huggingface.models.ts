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

export interface SeatingAssignment {
  guestId: string;
  tableId: string;
  reasoning?: string;
}

export interface SeatingResponse {
  assignments: SeatingAssignment[];
  explanation: string;
  conflicts?: string[];
}
