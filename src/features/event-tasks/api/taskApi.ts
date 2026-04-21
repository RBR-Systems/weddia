import type { Task, TaskSummary, WeddingTemplate } from "../models/task.models";
import { computeTaskSummary } from "../utils/task.utils";

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

export async function fetchMexicanTemplate(): Promise<WeddingTemplate> {
  const res = await fetch("/data/mexican_wedding_template.json");
  return res.json();
}

