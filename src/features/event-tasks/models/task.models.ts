// ── Task Types ──

export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "on_hold";
export type TaskVisibility = "private" | "shared" | "public";
export type DependencyType =
  | "finish_to_start"
  | "start_to_start"
  | "finish_to_finish"
  | "start_to_finish";
export type AssigneeRole = "owner" | "assignee" | "collaborator" | "viewer";
export type AssigneeStatus = "pending" | "accepted" | "declined" | "completed";

export interface TaskAttachment {
  file_id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface TaskAssignee {
  assignment_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
  role: AssigneeRole;
  status: AssigneeStatus;
  assigned_at: string;
  completed_at?: string;
}

export interface Task {
  task_id: string;
  event_id: string;
  category_id: string;
  template_id: string | null;
  title: string;
  description: string;
  due_date: string;
  start_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completion_percentage: number;
  is_milestone: boolean;
  task_dependency_id: string | null;
  dependency_type: DependencyType | null;
  estimated_cost: number;
  actual_cost: number | null;
  estimated_hours: number;
  actual_hours: number | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  parent_task_id: string | null;
  sort_order: number;
  attachments: TaskAttachment[];
  tags: string[];
  visibility: TaskVisibility;
  location: string | null;
  notes: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  category_name: string;
  category_color: string;
  assignees: TaskAssignee[];
  comments_count: number;
  subtasks_count: number;
  subtasks_completed: number;
}

export interface TaskSummary {
  total_tasks: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  this_week: number;
  completion_percentage: number;
}

export interface TaskFormValues {
  title: string;
  description?: string;
  due_date: string;
  start_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category_id: string;
  category_name?: string;
  category_color?: string;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_hours?: number;
  tags?: string[];
  notes?: string;
  is_milestone?: boolean;
  visibility?: TaskVisibility;
  location?: string;
  assignees?: TaskAssignee[];
  assignee_ids?: string[];
}

// ── Template Types ──

export interface TemplateTask {
  template_id: string;
  order: number;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  estimated_days_before_wedding: number;
  estimated_hours: number;
  estimated_cost: number;
  is_optional: boolean;
  is_milestone: boolean;
  instructions: string;
  tips: string;
}

export interface TemplateSection {
  section_id: string;
  section_name: string;
  section_order: number;
  description: string;
  task_count: number;
  estimated_days_before_wedding: number;
  tasks: TemplateTask[];
}

export interface TemplateMetadata {
  template_id: string;
  template_name: string;
  template_type: string;
  cultural_context: string;
  description: string;
  total_tasks: number;
  required_tasks: number;
  optional_tasks: number;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface WeddingTemplate {
  template_metadata: TemplateMetadata;
  sections: TemplateSection[];
}

// ── Team Members ──

export interface TeamMember {
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
  role: string;
}

// ── Filter / Sort ──

export interface TaskFilters {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  category: string | "all";
  search: string;
  sortBy: "due_date" | "priority" | "created_at" | "title";
  sortOrder: "asc" | "desc";
}

// ── Category helpers ──

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  count: number;
  completedCount: number;
}

// ── Subtask ──

export type SubtaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
export type SubtaskPriority = "urgent" | "high" | "medium" | "low";

export interface Subtask {
  subtask_id: number;
  task_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: SubtaskPriority;
  status: SubtaskStatus;
}

// ── Task Comment ──

export interface TaskComment {
  comment_id: number;
  task_id: number | null;
  member_id: number | null;
  comment: string | null;
  created_at: string;
}
