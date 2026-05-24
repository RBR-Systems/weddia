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
  fetchUsers,
  createTaskApi,
  updateTaskApi,
  patchTaskStatusApi,
  deleteTaskApi,
} from "../api/taskApi";
import {
  buildCategories,
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
    setCategories(buildCategories(allTasks));
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
      const data = await fetchTasksByEvent(eventId, catMap);

      // populate count/completedCount on categories
      const enriched = rawCats.map((cat) => ({
        ...cat,
        count: data.tasks.filter((t) => t.category_id === cat.id).length,
        completedCount: data.tasks.filter((t) => t.category_id === cat.id && t.status === "completed").length,
      }));

      setTasks(data.tasks);
      setSummary(data.summary);
      setCategories(enriched);
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

  const handleEditFromDetail = useCallback((task: Task) => {
    setDetailOpen(false);
    setEditTask(task);
    setFormOpen(true);
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
        } catch {
          loadTasks();
        }
        message.success(t("tasks.messages.taskUpdated"));
      } else {
        try {
          const newTask = await createTaskApi(body);
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
    [editTask, eventId, loadTasks, message, recalcSummary, t],
  );

  const handleTemplateApply = useCallback(
    (template: WeddingTemplate, weddingDate: Date, includeOptional: boolean) => {
      const generated = generateTasksFromTemplate(
        template,
        weddingDate,
        includeOptional,
        eventId != null ? String(eventId) : "event-unknown",
      );
      setTasks((prev) => {
        const updated = [...prev, ...generated];
        recalcSummary(updated);
        return updated;
      });
      message.success(t("tasks.messages.templateApplied", { count: generated.length }));
    },
    [eventId, message, recalcSummary, t],
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
    handleEditFromDetail,
    handleFormSubmit,
    handleTemplateApply,
    openNewTaskForm,
    closeDetailModal,
    closeFormModal,
  };
};
