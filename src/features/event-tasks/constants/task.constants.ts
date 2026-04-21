import type { TeamMember } from "../models/task.models";

export const DEFAULT_TASK_CREATOR = "user-001" as const;
export const DEFAULT_SORT_ORDER = 999;

export const SECTION_COLORS: readonly string[] = [
  "#9C27B0",
  "#2196F3",
  "#E91E63",
  "#00BCD4",
  "#FF9800",
  "#4CAF50",
  "#F59E0B",
  "#6366F1",
  "#F44336",
  "#22C55E",
  "#8B5CF6",
] as const;

export const DEFAULT_CATEGORY_COLOR = "#9CA3AF" as const;
export const DEFAULT_CATEGORY_NAME = "General" as const;

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: "red",
  high: "orange",
  medium: "gold",
  low: "green",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
  cancelled: "error",
  on_hold: "warning",
};

export const STATUS_BADGE_TYPES: Record<
  string,
  "success" | "processing" | "error" | "default" | "warning"
> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
  cancelled: "error",
  on_hold: "warning",
};

export const AVATAR_COLORS: readonly string[] = [
  "#c9a38c",
  "#5b6bc1",
  "#5cb68a",
  "#d4a29a",
  "#F59E0B",
  "#8B5CF6",
];

export const OVERDUE_COLOR = "#ef4444" as const;
export const MILESTONE_COLOR = "#F59E0B" as const;
export const PROGRESS_STROKE_COLOR = "#c9a38c" as const;
export const OVERFLOW_AVATAR_COLOR = "#9CA3AF" as const;
export const DEFAULT_VISIBILITY = "shared" as const;

export const SECTION_EMOJIS: Record<number, string> = {
  1: "📋",
  2: "🏢",
  3: "🎉",
  4: "💄",
  5: "💑",
  6: "📸",
  7: "⚖️",
  8: "⛪",
  9: "💃",
  10: "🍽️",
  11: "🎊",
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    user_id: "user-001",
    user_name: "María García",
    user_email: "maria@example.com",
    user_avatar: "",
    role: "Planner",
  },
  {
    user_id: "user-002",
    user_name: "Carlos López",
    user_email: "carlos@example.com",
    user_avatar: "",
    role: "Coordinator",
  },
  {
    user_id: "user-003",
    user_name: "Ana Rodríguez",
    user_email: "ana@example.com",
    user_avatar: "",
    role: "Designer",
  },
  {
    user_id: "user-004",
    user_name: "Juan Martínez",
    user_email: "juan@example.com",
    user_avatar: "",
    role: "Vendor Manager",
  },
  {
    user_id: "user-005",
    user_name: "Laura Hernández",
    user_email: "laura@example.com",
    user_avatar: "",
    role: "Assistant",
  },
  {
    user_id: "user-006",
    user_name: "Roberto Sánchez",
    user_email: "roberto@example.com",
    user_avatar: "",
    role: "Photographer",
  },
  {
    user_id: "user-007",
    user_name: "Sofia Morales",
    user_email: "sofia@example.com",
    user_avatar: "",
    role: "Florist",
  },
  {
    user_id: "user-008",
    user_name: "Diego Torres",
    user_email: "diego@example.com",
    user_avatar: "",
    role: "Caterer",
  },
];
