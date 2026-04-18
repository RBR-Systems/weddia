import { SeatingResponse } from "../../../api/huggingfaceApi";
export interface MessageItem {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: SeatingResponse;
}

export interface SeatingAIChatProps {
  guests: any[];
  tables: any[];
  onApplySeating: (assignments: SeatingResponse["assignments"]) => void;
}
