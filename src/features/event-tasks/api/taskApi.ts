import type {
  Task,
  TaskSummary,
  WeddingTemplate,
  TaskFormValues,
  TaskCategory,
  TeamMember,
} from "../models/task.models";
import dayjs from "dayjs";

// ── helpers ──

function getLocalDay(value: string | Date) {
  return dayjs(value).startOf("day");
}

function createTaskId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isOverdue(task: Task): boolean {
  if (task.status === "completed" || task.status === "cancelled") return false;
  return getLocalDay(task.due_date).isBefore(dayjs().startOf("day"), "day");
}

function isDueThisWeek(task: Task): boolean {
  if (task.status === "completed" || task.status === "cancelled") return false;
  const today = dayjs().startOf("day");
  const weekLater = today.add(7, "day");
  const due = getLocalDay(task.due_date);
  return due.valueOf() >= today.valueOf() && due.valueOf() <= weekLater.valueOf();
}

export function computeTaskSummary(tasks: Task[]): TaskSummary {
  const completed = tasks.filter((task) => task.status === "completed").length;

  return {
    total_tasks: tasks.length,
    completed,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    pending: tasks.filter((task) => task.status === "pending").length,
    overdue: tasks.filter(isOverdue).length,
    this_week: tasks.filter(isDueThisWeek).length,
    completion_percentage:
      tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

// ── Fetch tasks from sample JSON ──

export async function fetchTasks(): Promise<{
  tasks: Task[];
  summary: TaskSummary;
}> {
  const res = await fetch("/data/sample_tasks_data.json");
  const data = await res.json();
  const tasks: Task[] = data.tasks ?? [];
  const summary = computeTaskSummary(tasks);
  return { tasks, summary };
}

// ── Fetch mexican template ──

export async function fetchMexicanTemplate(): Promise<WeddingTemplate> {
  const res = await fetch("/data/mexican_wedding_template.json");
  return res.json();
}

// ── Build categories from tasks ──

export function buildCategories(tasks: Task[]): TaskCategory[] {
  const map = new Map<
    string,
    { name: string; color: string; count: number; completedCount: number }
  >();

  for (const t of tasks) {
    const existing = map.get(t.category_id);
    if (existing) {
      existing.count += 1;
      if (t.status === "completed") existing.completedCount += 1;
    } else {
      map.set(t.category_id, {
        name: t.category_name,
        color: t.category_color,
        count: 1,
        completedCount: t.status === "completed" ? 1 : 0,
      });
    }
  }

  return Array.from(map.entries()).map(([id, v]) => ({
    id,
    name: v.name,
    color: v.color,
    count: v.count,
    completedCount: v.completedCount,
  }));
}

function isDueNextWeek(task: Task): boolean {
  if (task.status === "completed" || task.status === "cancelled") return false;
  const today = dayjs().startOf("day");
  const weekLater = today.add(7, "day");
  const twoWeeksLater = today.add(14, "day");
  const due = getLocalDay(task.due_date);

  return due.valueOf() > weekLater.valueOf() && due.valueOf() <= twoWeeksLater.valueOf();
}

// ── Group tasks by urgency ──

export function groupTasks(tasks: Task[]) {
  const overdue: Task[] = [];
  const thisWeek: Task[] = [];
  const nextWeek: Task[] = [];
  const later: Task[] = [];
  const completed: Task[] = [];

  for (const t of tasks) {
    if (t.status === "completed") {
      completed.push(t);
    } else if (t.status === "cancelled") {
      completed.push(t);
    } else if (isOverdue(t)) {
      overdue.push(t);
    } else if (isDueThisWeek(t)) {
      thisWeek.push(t);
    } else if (isDueNextWeek(t)) {
      nextWeek.push(t);
    } else {
      later.push(t);
    }
  }

  // sort each group by due_date asc
  const byDue = (a: Task, b: Task) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  overdue.sort(byDue);
  thisWeek.sort(byDue);
  nextWeek.sort(byDue);
  later.sort(byDue);
  completed.sort(
    (a, b) =>
      new Date(b.completed_at ?? b.updated_at).getTime() -
      new Date(a.completed_at ?? a.updated_at).getTime(),
  );

  return { overdue, thisWeek, nextWeek, later, completed };
}

// ── Get tasks for a specific date ──
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const target = getLocalDay(date).format("YYYY-MM-DD");
  return tasks.filter(
    (task) => getLocalDay(task.due_date).format("YYYY-MM-DD") === target,
  );
}

// ── Team members mock data ──
export type { TeamMember };

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

// ── Generate tasks from template ──

export function generateTasksFromTemplate(
  template: WeddingTemplate,
  weddingDate: Date,
  includeOptional: boolean,
  eventId: string,
): Task[] {
  const tasks: Task[] = [];
  let sortOrder = 1;

  for (const section of template.sections) {
    for (const tpl of section.tasks) {
      if (!includeOptional && tpl.is_optional) continue;

      const dueDate = new Date(weddingDate);
      dueDate.setDate(dueDate.getDate() - tpl.estimated_days_before_wedding);

      const task: Task = {
        task_id: createTaskId(`generated-${tpl.template_id}`),
        event_id: eventId,
        category_id: `cat-${section.section_id}`,
        template_id: tpl.template_id,
        title: tpl.title,
        description: tpl.description,
        due_date: dueDate.toISOString(),
        start_date: null,
        priority: tpl.priority,
        status: "pending",
        completion_percentage: 0,
        is_milestone: tpl.is_milestone,
        task_dependency_id: null,
        dependency_type: null,
        estimated_cost: tpl.estimated_cost,
        actual_cost: null,
        estimated_hours: tpl.estimated_hours,
        actual_hours: null,
        is_recurring: false,
        recurrence_pattern: null,
        parent_task_id: null,
        sort_order: sortOrder++,
        attachments: [],
        tags: [section.section_name],
        visibility: "shared",
        location: null,
        notes: tpl.tips || null,
        completed_at: null,
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "user-001",
        updated_by: "user-001",
        category_name: section.section_name,
        category_color: getSectionColor(section.section_order),
        assignees: [],
        comments_count: 0,
        subtasks_count: 0,
        subtasks_completed: 0,
      };
      tasks.push(task);
    }
  }

  return tasks;
}

function getSectionColor(order: number): string {
  const colors = [
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
  ];
  return colors[(order - 1) % colors.length];
}

// ── Create a task from form ──

export function createTaskFromForm(
  values: TaskFormValues,
  eventId: string,
): Task {
  const now = new Date().toISOString();
  return {
    task_id: createTaskId("task"),
    event_id: eventId,
    category_id: values.category_id,
    template_id: null,
    title: values.title,
    description: values.description ?? "",
    due_date: values.due_date,
    start_date: values.start_date ?? null,
    priority: values.priority,
    status: values.status,
    completion_percentage: 0,
    is_milestone: values.is_milestone ?? false,
    task_dependency_id: null,
    dependency_type: null,
    estimated_cost: values.estimated_cost ?? 0,
    actual_cost: values.actual_cost ?? null,
    estimated_hours: values.estimated_hours ?? 0,
    actual_hours: null,
    is_recurring: false,
    recurrence_pattern: null,
    parent_task_id: null,
    sort_order: 999,
    attachments: [],
    tags: values.tags ?? [],
    visibility: values.visibility ?? "shared",
    location: values.location ?? null,
    notes: values.notes ?? null,
    completed_at: null,
    archived_at: null,
    created_at: now,
    updated_at: now,
    created_by: "user-001",
    updated_by: "user-001",
    category_name: values.category_name ?? "General",
    category_color: values.category_color ?? "#9CA3AF",
    assignees: values.assignees ?? [],
    comments_count: 0,
    subtasks_count: 0,
    subtasks_completed: 0,
  };
}
