import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/shared/api/apiClient";
import type { Task, TaskCategory, TaskSummary, TeamMember, WeddingTemplate, Subtask, TaskComment } from "../models/task.models";
import { computeTaskSummary } from "../utils/task.utils";

// ── Backend shape ──

interface ApiTask {
  taskId: number;
  eventId: number | null;
  categoryId: number | null;
  memberId: number | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  startDate: string | null;
  priority: string;
  status: string;
  taskDependencyId: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
}

interface ApiTaskCategory {
  categoryId: number;
  name: string;
  colorCode: string;
}

interface ApiSubtask {
  subtaskId: number;
  taskId: number | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
}

interface ApiComment {
  commentId: number;
  taskId: number | null;
  memberId: number | null;
  comment: string | null;
  createdAt: string;
}

const now = () => new Date().toISOString();

function mapApiTask(t: ApiTask, catMap: Map<number, ApiTaskCategory>): Task {
  const cat = t.categoryId != null ? catMap.get(t.categoryId) : undefined;
  return {
    task_id: String(t.taskId),
    event_id: t.eventId != null ? String(t.eventId) : "",
    category_id: t.categoryId != null ? String(t.categoryId) : "",
    template_id: null,
    title: t.title,
    description: t.description ?? "",
    due_date: t.dueDate ?? now(),
    start_date: t.startDate ?? null,
    priority: (t.priority?.toLowerCase() ?? "medium") as Task["priority"],
    status: (t.status?.toLowerCase() ?? "pending") as Task["status"],
    completion_percentage: t.status?.toLowerCase() === "completed" ? 100 : 0,
    is_milestone: false,
    task_dependency_id: t.taskDependencyId != null ? String(t.taskDependencyId) : null,
    dependency_type: null,
    estimated_cost: t.estimatedCost ?? 0,
    actual_cost: t.actualCost ?? null,
    estimated_hours: 0,
    actual_hours: null,
    is_recurring: false,
    recurrence_pattern: null,
    parent_task_id: null,
    sort_order: 0,
    attachments: [],
    tags: [],
    visibility: "shared",
    location: null,
    notes: null,
    completed_at: t.status?.toLowerCase() === "completed" ? now() : null,
    archived_at: null,
    created_at: now(),
    updated_at: now(),
    created_by: "",
    updated_by: "",
    category_name: cat?.name ?? "",
    category_color: cat?.colorCode ?? "#6366f1",
    assignees: [],
    comments_count: 0,
    subtasks_count: 0,
    subtasks_completed: 0,
  };
}

function mapApiSubtask(s: ApiSubtask): Subtask {
  return {
    subtask_id: s.subtaskId,
    task_id: s.taskId,
    title: s.title,
    description: s.description,
    due_date: s.dueDate,
    priority: (s.priority?.toLowerCase() ?? "medium") as Subtask["priority"],
    status: (s.status?.toLowerCase() ?? "pending") as Subtask["status"],
  };
}

function mapApiComment(c: ApiComment): TaskComment {
  return {
    comment_id: c.commentId,
    task_id: c.taskId,
    member_id: c.memberId,
    comment: c.comment,
    created_at: c.createdAt,
  };
}

// ── Task Categories ──

export async function fetchTaskCategories(): Promise<TaskCategory[]> {
  const raw = await apiGet<ApiTaskCategory[]>("/api/taskcategories");
  return (Array.isArray(raw) ? raw : []).map((c) => ({
    id: String(c.categoryId),
    name: c.name,
    color: c.colorCode,
    count: 0,
    completedCount: 0,
  }));
}

// ── Tasks ──

export async function fetchTasksByEvent(
  eventId: number,
  catMap: Map<number, ApiTaskCategory> = new Map(),
): Promise<{ tasks: Task[]; summary: TaskSummary }> {
  const raw = await apiGet<ApiTask[]>(`/api/tasks/event/${eventId}`);
  const tasks = (Array.isArray(raw) ? raw : []).map((t) => mapApiTask(t, catMap));
  const summary = computeTaskSummary(tasks);
  return { tasks, summary };
}


interface TaskWriteBody {
  eventId?: number | null;
  categoryId?: number | null;
  memberId?: number | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  priority: string;
  status: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
}

export async function createTaskApi(body: TaskWriteBody): Promise<Task> {
  const raw = await apiPost<ApiTask>("/api/tasks?adminId=1", body);
  return mapApiTask(raw, new Map());
}

export async function updateTaskApi(taskId: number, body: TaskWriteBody): Promise<void> {
  await apiPut(`/api/tasks/${taskId}?adminId=1`, body);
}

export async function patchTaskStatusApi(taskId: number, status: string): Promise<void> {
  await apiPatch(`/api/tasks/${taskId}/status?adminId=1`, { status });
}

export async function deleteTaskApi(taskId: number): Promise<void> {
  await apiDelete(`/api/tasks/${taskId}`);
}

// ── Subtasks ──

export async function fetchSubtasksByTask(taskId: number): Promise<Subtask[]> {
  const raw = await apiGet<ApiSubtask[]>(`/api/subtasks/task/${taskId}`);
  return (Array.isArray(raw) ? raw : []).map(mapApiSubtask);
}

export async function createSubtaskApi(body: {
  taskId: number;
  title: string;
  priority: string;
  status: string;
}): Promise<Subtask> {
  const raw = await apiPost<ApiSubtask>("/api/subtasks?adminId=1", body);
  return mapApiSubtask(raw);
}

export async function updateSubtaskStatusApi(subtaskId: number, body: {
  taskId: number | null;
  title: string;
  priority: string;
  status: string;
}): Promise<void> {
  await apiPut(`/api/subtasks/${subtaskId}?adminId=1`, body);
}

export async function deleteSubtaskApi(subtaskId: number): Promise<void> {
  await apiDelete(`/api/subtasks/${subtaskId}`);
}

// ── Comments ──

export async function fetchCommentsByTask(taskId: number): Promise<TaskComment[]> {
  const raw = await apiGet<ApiComment[]>(`/api/taskcomments/task/${taskId}`);
  return (Array.isArray(raw) ? raw : []).map(mapApiComment);
}

export async function createCommentApi(body: {
  taskId: number;
  comment: string;
}): Promise<TaskComment> {
  const raw = await apiPost<ApiComment>("/api/taskcomments", body);
  return mapApiComment(raw);
}

export async function deleteCommentApi(commentId: number): Promise<void> {
  await apiDelete(`/api/taskcomments/${commentId}`);
}

// ── Users ──

interface ApiUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export async function fetchUsers(): Promise<TeamMember[]> {
  const raw = await apiGet<ApiUser[]>("/api/users");
  return (Array.isArray(raw) ? raw : [])
    .filter((u) => u.isActive)
    .map((u) => ({
      user_id: String(u.userId),
      user_name: `${u.firstName} ${u.lastName}`.trim(),
      user_email: u.email,
      user_avatar: "",
      role: "",
    }));
}

// ── Template (keep mock) ──

export async function fetchMexicanTemplate(): Promise<WeddingTemplate> {
  const res = await fetch("/data/mexican_wedding_template.json");
  return res.json();
}
