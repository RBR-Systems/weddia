import { useState, useCallback, useEffect } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import { useEvent } from "@/shared/contexts/EventContext";
import type {
  Task,
  TaskSummary,
  TaskCategory,
  TeamMember,
  WeddingTemplate,
  TaskFormValues,
} from "../models/task.models";
import {
  fetchTasksByEvent,
  fetchTaskCategories,
  fetchAssignmentsByEvent,
  fetchUsers,
  createTaskApi,
  updateTaskApi,
  patchTaskStatusApi,
  deleteTaskApi,
  addAssignmentApi,
  removeAssignmentApi,
} from "../api/taskApi";
import type { TaskAssignee } from "../api/taskApi";
import {
  computeTaskSummary,
  generateTasksFromTemplate,
} from "../utils/task.utils";

const INITIAL_SUMMARY: TaskSummary = {
  total_tasks: 0,
  completed: 0,
  in_progress: 0,
  pending: 0,
  overdue: 0,
  this_week: 0,
  completion_percentage: 0,
};

export interface UseEventTasksResult {
  tasks: Task[];
  summary: TaskSummary;
  categories: TaskCategory[];
  members: TeamMember[];
  isLoading: boolean;
  detailTask: Task | null;
  detailOpen: boolean;
  formOpen: boolean;
  editTask: Task | null;
  handleQuickComplete: (task: Task) => void;
  handleTaskClick: (task: Task) => void;
  handleStatusChange: (taskId: string, status: Task["status"]) => void;
  handleDeleteTask: (taskId: string) => void;
  handleBulkDelete: (taskIds: string[]) => void;
  handleEditFromDetail: (task: Task) => void;
  handleFormSubmit: (values: TaskFormValues) => void;
  handleTemplateApply: (
    template: WeddingTemplate,
    weddingDate: Date,
    includeOptional: boolean,
  ) => void;
  openNewTaskForm: () => void;
  closeDetailModal: () => void;
  closeFormModal: () => void;
}

export const useEventTasks = (): UseEventTasksResult => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { state } = useEvent();
  const eventId = state.events.selectedEvent?.id ?? null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary>(INITIAL_SUMMARY);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const recalcSummary = useCallback((allTasks: Task[]) => {
    setSummary(computeTaskSummary(allTasks));
  }, []);

  const loadTasks = useCallback(async () => {
    if (eventId == null) {
      setTasks([]);
      setSummary(INITIAL_SUMMARY);
      setCategories([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [rawCats, users] = await Promise.all([fetchTaskCategories(), fetchUsers()]);
      const catMap = new Map(rawCats.map((c) => [Number(c.id), { categoryId: Number(c.id), name: c.name, colorCode: c.color }]));
      const [data, assignments] = await Promise.all([
        fetchTasksByEvent(eventId, catMap),
        fetchAssignmentsByEvent(eventId),
      ]);

      // group assignments by task_id
      const assignmentsByTask = new Map<number, TaskAssignee[]>();
      for (const a of assignments) {
        if (a.task_id == null) continue;
        const list = assignmentsByTask.get(a.task_id) ?? [];
        list.push(a);
        assignmentsByTask.set(a.task_id, list);
      }

      // enrich tasks with assignees
      const enrichedTasks = data.tasks.map((t) => ({
        ...t,
        assignees: (assignmentsByTask.get(Number(t.task_id)) ?? []).map((a) => ({
          assignment_id: String(a.assignment_id),
          user_id: String(a.user_id),
          user_name: a.user_name,
          user_email: a.user_email,
          user_avatar: "",
          role: (a.role ?? "assignee") as import("../models/task.models").AssigneeRole,
          status: "accepted" as const,
          assigned_at: a.assigned_at,
        })),
      }));

      const enrichedCats = rawCats.map((cat) => ({
        ...cat,
        count: enrichedTasks.filter((t) => t.category_id === cat.id).length,
        completedCount: enrichedTasks.filter((t) => t.category_id === cat.id && t.status === "completed").length,
      }));

      setTasks(enrichedTasks);
      setSummary(computeTaskSummary(enrichedTasks));
      setCategories(enrichedCats);
      setMembers(users);
    } catch {
      setTasks([]);
      setSummary(INITIAL_SUMMARY);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleQuickComplete = useCallback(
    async (task: Task) => {
      const taskId = Number(task.task_id);
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.task_id === task.task_id
            ? { ...t, status: "completed" as const, completion_percentage: 100, completed_at: new Date().toISOString() }
            : t,
        );
        recalcSummary(updated);
        return updated;
      });
      try {
        await patchTaskStatusApi(taskId, "Completed");
      } catch {
        loadTasks();
      }
      message.success(t("tasks.messages.taskCompleted", { title: task.title }));
    },
    [loadTasks, message, recalcSummary, t],
  );

  const handleTaskClick = useCallback((task: Task) => {
    setDetailTask(task);
    setDetailOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, status: Task["status"]) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.task_id === taskId
            ? {
                ...t,
                status,
                completion_percentage: status === "completed" ? 100 : t.completion_percentage,
                completed_at: status === "completed" ? new Date().toISOString() : null,
              }
            : t,
        );
        recalcSummary(updated);
        return updated;
      });
      const apiStatus = status.charAt(0).toUpperCase() + status.slice(1);
      try {
        await patchTaskStatusApi(Number(taskId), apiStatus);
      } catch {
        loadTasks();
      }
    },
    [loadTasks, recalcSummary],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.task_id !== taskId);
        recalcSummary(updated);
        return updated;
      });
      setDetailOpen(false);
      try {
        await deleteTaskApi(Number(taskId));
      } catch {
        loadTasks();
      }
      message.success(t("tasks.messages.taskDeleted"));
    },
    [loadTasks, message, recalcSummary, t],
  );

  const handleBulkDelete = useCallback(
    async (taskIds: string[]) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => !taskIds.includes(t.task_id));
        recalcSummary(updated);
        return updated;
      });
      try {
        await Promise.all(taskIds.map((id) => deleteTaskApi(Number(id))));
      } catch {
        loadTasks();
      }
      message.success(t("tasks.messages.tasksDeleted", { count: taskIds.length }));
    },
    [loadTasks, message, recalcSummary, t],
  );

  const handleEditFromDetail = useCallback((task: Task) => {
    setDetailOpen(false);
    setEditTask(task);
    setFormOpen(true);
  }, []);

  const syncAssignments = useCallback(async (taskId: number, selectedUserIds: string[], currentTask?: Task) => {
    const currentIds = new Set((currentTask?.assignees ?? []).map((a) => a.user_id));
    const newIds = new Set(selectedUserIds);
    const toAdd = selectedUserIds.filter((id) => !currentIds.has(id));
    const toRemove = (currentTask?.assignees ?? []).filter((a) => !newIds.has(a.user_id));
    await Promise.all([
      ...toAdd.map((uid) => addAssignmentApi(taskId, Number(uid))),
      ...toRemove.map((a) => removeAssignmentApi(Number(a.assignment_id))),
    ]);
  }, []);

  const handleFormSubmit = useCallback(
    async (values: TaskFormValues) => {
      const categoryId = values.category_id ? Number(values.category_id) : null;
      const body = {
        eventId: eventId,
        categoryId: !isNaN(categoryId ?? NaN) ? categoryId : null,
        title: values.title,
        description: values.description ?? null,
        dueDate: values.due_date ?? null,
        startDate: values.start_date ?? null,
        priority: values.priority.charAt(0).toUpperCase() + values.priority.slice(1),
        status: values.status.charAt(0).toUpperCase() + values.status.slice(1),
        visibility: values.visibility ?? "shared",
        estimatedCost: values.estimated_cost ?? null,
        actualCost: values.actual_cost ?? null,
      };

      if (editTask) {
        const taskId = Number(editTask.task_id);
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.task_id === editTask.task_id
              ? { ...t, ...values, updated_at: new Date().toISOString() }
              : t,
          );
          recalcSummary(updated);
          return updated;
        });
        try {
          await updateTaskApi(taskId, body);
          await syncAssignments(taskId, values.assignee_ids ?? [], editTask);
          await loadTasks();
        } catch {
          loadTasks();
        }
        message.success(t("tasks.messages.taskUpdated"));
      } else {
        try {
          const newTask = await createTaskApi(body);
          await syncAssignments(Number(newTask.task_id), values.assignee_ids ?? []);
          setTasks((prev) => {
            const updated = [...prev, newTask];
            recalcSummary(updated);
            return updated;
          });
          message.success(t("tasks.messages.taskCreated"));
        } catch {
          message.error(t("tasks.messages.taskCreateError", "Error creating task"));
        }
      }
      setFormOpen(false);
      setEditTask(null);
    },
    [editTask, eventId, loadTasks, message, recalcSummary, syncAssignments, t],
  );

  const handleTemplateApply = useCallback(
    async (template: WeddingTemplate, weddingDate: Date, includeOptional: boolean) => {
      if (eventId == null) return;
      const generated = generateTasksFromTemplate(
        template,
        weddingDate,
        includeOptional,
        String(eventId),
      );

      const results = await Promise.allSettled(
        generated.map((task) =>
          createTaskApi({
            eventId,
            categoryId: null,
            title: task.title,
            description: task.description || null,
            dueDate: task.due_date,
            startDate: null,
            priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
            status: "Pending",
            visibility: "shared",
            estimatedCost: task.estimated_cost ?? null,
            actualCost: null,
          }),
        ),
      );

      const saved = results.filter((r) => r.status === "fulfilled").length;
      await loadTasks();
      message.success(t("tasks.messages.templateApplied", { count: saved }));
    },
    [eventId, loadTasks, message, t],
  );

  const openNewTaskForm = useCallback(() => {
    setEditTask(null);
    setFormOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => setDetailOpen(false), []);

  const closeFormModal = useCallback(() => {
    setFormOpen(false);
    setEditTask(null);
  }, []);

  return {
    tasks,
    summary,
    categories,
    members,
    isLoading,
    detailTask,
    detailOpen,
    formOpen,
    editTask,
    handleQuickComplete,
    handleTaskClick,
    handleStatusChange,
    handleDeleteTask,
    handleBulkDelete,
    handleEditFromDetail,
    handleFormSubmit,
    handleTemplateApply,
    openNewTaskForm,
    closeDetailModal,
    closeFormModal,
  };
};
