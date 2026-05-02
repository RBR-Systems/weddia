import type { SeatingResponse } from "../../../models/huggingface.models";

export interface MessageItem {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: SeatingResponse;
}

export interface HfGuest {
  id: string;
  name: string;
  tags: string[];
  tableId: string | null;
  partySize: number;
}

export interface HfTable {
  id: string;
  name: string;
  shape: string;
  capacity: number;
  position: { x: number; y: number };
}

export interface SeatingAIChatProps {
  guests: HfGuest[];
  tables: HfTable[];
  onApplySeating: (assignments: SeatingResponse["assignments"]) => void;
}
