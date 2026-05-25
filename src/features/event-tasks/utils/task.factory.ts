import type { Task } from "../models/task.models";
import {
  DEFAULT_TASK_CREATOR,
  DEFAULT_SORT_ORDER,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_NAME,
  DEFAULT_VISIBILITY,
} from "../constants/task.constants";

const FACTORY_DEFAULTS: Task = {
  task_id: "task-default",
  event_id: "",
  category_id: "",
  template_id: null,
  title: "",
  description: "",
  due_date: new Date().toISOString(),
  start_date: null,
  priority: "medium",
  status: "pending",
  completion_percentage: 0,
  is_milestone: false,
  task_dependency_id: null,
  dependency_type: null,
  estimated_cost: 0,
  actual_cost: null,
  estimated_hours: 0,
  actual_hours: null,
  is_recurring: false,
  recurrence_pattern: null,
  parent_task_id: null,
  sort_order: DEFAULT_SORT_ORDER,
  attachments: [],
  tags: [],
  visibility: DEFAULT_VISIBILITY,
  location: null,
  notes: null,
  completed_at: null,
  archived_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: DEFAULT_TASK_CREATOR,
  updated_by: DEFAULT_TASK_CREATOR,
  category_name: DEFAULT_CATEGORY_NAME,
  category_color: DEFAULT_CATEGORY_COLOR,
  assignees: [],
  comments_count: 0,
  subtasks_count: 0,
  subtasks_completed: 0,
};

/**
 * Creates a fully-typed Task with all defaults applied.
 * Pass overrides for only the fields you care about — usable in both
 * production builders and tests.
 *
 * @example
 * // Production
 * createTask({ task_id: id, event_id: eventId, title: "Book venue" })
 *
 * // Test
 * const overdue = createTask({ due_date: "2020-01-01", status: "pending" });
 */
export function createTask(overrides: Partial<Task> = {}): Task {
  return { ...FACTORY_DEFAULTS, ...overrides };
}
