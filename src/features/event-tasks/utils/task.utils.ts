import dayjs from "dayjs";
import { getRandomId } from "@/shared/utils/rng";
import type {
  Task,
  TaskSummary,
  TaskCategory,
  TaskFormValues,
  WeddingTemplate,
} from "../models/task.models";
import {
  DEFAULT_SORT_ORDER,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_NAME,
  DEFAULT_VISIBILITY,
  SECTION_COLORS,
} from "../constants/task.constants";
import { createTask } from "./task.factory";

// ── Private helpers ──

function getLocalDay(value: string | Date) {
  return dayjs(value).startOf("day");
}

function createTaskId(prefix: string): string {
  return getRandomId(`${prefix}-`);
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

function isDueNextWeek(task: Task): boolean {
  if (task.status === "completed" || task.status === "cancelled") return false;
  const today = dayjs().startOf("day");
  const weekLater = today.add(7, "day");
  const twoWeeksLater = today.add(14, "day");
  const due = getLocalDay(task.due_date);
  return due.valueOf() > weekLater.valueOf() && due.valueOf() <= twoWeeksLater.valueOf();
}

function getSectionColor(order: number): string {
  return SECTION_COLORS[(order - 1) % SECTION_COLORS.length];
}

// ── Public pure functions ──

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

export function groupTasks(tasks: Task[]) {
  const overdue: Task[] = [];
  const thisWeek: Task[] = [];
  const nextWeek: Task[] = [];
  const later: Task[] = [];
  const completed: Task[] = [];

  for (const t of tasks) {
    if (t.status === "completed" || t.status === "cancelled") {
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

export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const target = getLocalDay(date).format("YYYY-MM-DD");
  return tasks.filter(
    (task) => getLocalDay(task.due_date).format("YYYY-MM-DD") === target,
  );
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("");
}

export function generateTasksFromTemplate(
  template: WeddingTemplate,
  weddingDate: Date,
  includeOptional: boolean,
  eventId: string,
): Task[] {
  const tasks: Task[] = [];
  const now = new Date().toISOString();
  let sortOrder = 1;

  for (const section of template.sections) {
    for (const tpl of section.tasks) {
      if (!includeOptional && tpl.is_optional) continue;

      const dueDate = new Date(weddingDate);
      dueDate.setDate(dueDate.getDate() - tpl.estimated_days_before_wedding);

      const task: Task = createTask({
        task_id: createTaskId(`generated-${tpl.template_id}`),
        event_id: eventId,
        category_id: `cat-${section.section_id}`,
        template_id: tpl.template_id,
        title: tpl.title,
        description: tpl.description,
        due_date: dueDate.toISOString(),
        priority: tpl.priority,
        is_milestone: tpl.is_milestone,
        estimated_cost: tpl.estimated_cost,
        estimated_hours: tpl.estimated_hours,
        sort_order: sortOrder++,
        tags: [section.section_name],
        notes: tpl.tips || null,
        category_name: section.section_name,
        category_color: getSectionColor(section.section_order),
        created_at: now,
        updated_at: now,
      });
      tasks.push(task);
    }
  }

  return tasks;
}

export function createTaskFromForm(values: TaskFormValues, eventId: string): Task {
  const now = new Date().toISOString();
  return createTask({
    task_id: createTaskId("task"),
    event_id: eventId,
    category_id: values.category_id,
    title: values.title,
    description: values.description ?? "",
    due_date: values.due_date,
    start_date: values.start_date ?? null,
    priority: values.priority,
    status: values.status,
    is_milestone: values.is_milestone ?? false,
    estimated_cost: values.estimated_cost ?? 0,
    actual_cost: values.actual_cost ?? null,
    estimated_hours: values.estimated_hours ?? 0,
    sort_order: DEFAULT_SORT_ORDER,
    tags: values.tags ?? [],
    visibility: values.visibility ?? DEFAULT_VISIBILITY,
    location: values.location ?? null,
    notes: values.notes ?? null,
    category_name: values.category_name ?? DEFAULT_CATEGORY_NAME,
    category_color: values.category_color ?? DEFAULT_CATEGORY_COLOR,
    assignees: values.assignees ?? [],
    created_at: now,
    updated_at: now,
  });
}
