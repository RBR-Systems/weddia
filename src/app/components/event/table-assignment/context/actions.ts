import type { SeatingResponse as HFSeatingResponse } from "../services/huggingface.service";
import { DragId, Table, TableAssignment } from "../models/types";

export type Action =
  | { type: "SET_METERS_TO_PIXELS"; payload: number }
  | { type: "SET_PAN"; payload: { x: number; y: number } }
  | { type: "SET_TABLES"; payload: Table[] }
  | {
      type: "MOVE_TABLE";
      payload: { tableId: string; x_m: number; y_m: number };
    }
  | { type: "SET_ASSIGNMENTS"; payload: TableAssignment[] }
  | {
      type: "ASSIGN_GUEST";
      payload: { tableId: string; guestId: string; seatNumber: number };
    }
  | { type: "UNASSIGN_GUEST"; payload: { guestId: string } }
  | { type: "UNASSIGN_ALL" }
  | { type: "SET_SELECTED_TABLE"; payload: string | null }
  | { type: "SET_GUEST_SEARCH"; payload: string }
  | { type: "SET_RELATION_FILTER"; payload?: string }
  | { type: "SET_ASSIGNED_FILTER"; payload: "all" | "assigned" | "unassigned" }
  | { type: "SET_SIDE_VIEW"; payload: "guests" | "table" }
  | { type: "SET_SIDE_PANEL_OPEN"; payload: boolean }
  | { type: "SET_AI_CHAT_OPEN"; payload: boolean }
  | { type: "SET_ACTIVE_DRAG_ID"; payload: DragId | null }
  | { type: "APPLY_AI_SEATING"; payload: HFSeatingResponse["assignments"] }
  | {
      type: "SET_ACTIVE_LAYOUT_GRID";
      payload: { x_grid_size: number; y_grid_size: number };
    }
  | {
      type: "MOVE_GUEST_SEAT";
      payload: { guestId: string; tableId: string; seatNumber: number };
    };
