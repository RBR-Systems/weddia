import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import type {
  Task,
  TaskSummary,
  TaskCategory,
  WeddingTemplate,
  TaskFormValues,
} from "../models/task.models";
import { fetchTasks } from "../api/taskApi";
import {
  buildCategories,
  computeTaskSummary,
  generateTasksFromTemplate,
  createTaskFromForm,
} from "../utils/task.utils";
import type React from "react";

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
  isLoading: boolean;
  detailTask: Task | null;
  detailOpen: boolean;
  formOpen: boolean;
  editTask: Task | null;
  messageContextHolder: React.ReactNode;
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
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary>(INITIAL_SUMMARY);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [messageApi, messageContextHolder] = message.useMessage();

  const recalcSummary = useCallback((allTasks: Task[]) => {
    setSummary(computeTaskSummary(allTasks));
    setCategories(buildCategories(allTasks));
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data.tasks);
      setSummary(data.summary);
      setCategories(buildCategories(data.tasks));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleQuickComplete = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.task_id === task.task_id
            ? {
                ...t,
                status: "completed" as const,
                completion_percentage: 100,
                completed_at: new Date().toISOString(),
              }
            : t,
        );
        recalcSummary(updated);
        return updated;
      });
      messageApi.success(
        t("tasks.messages.taskCompleted", { title: task.title }),
      );
    },
    [messageApi, recalcSummary, t],
  );

  const handleTaskClick = useCallback((task: Task) => {
    setDetailTask(task);
    setDetailOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    (taskId: string, status: Task["status"]) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.task_id === taskId
            ? {
                ...t,
                status,
                completion_percentage:
                  status === "completed" ? 100 : t.completion_percentage,
                completed_at:
                  status === "completed" ? new Date().toISOString() : null,
              }
            : t,
        );
        recalcSummary(updated);
        return updated;
      });
    },
    [recalcSummary],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.task_id !== taskId);
        recalcSummary(updated);
        return updated;
      });
      setDetailOpen(false);
      messageApi.success(t("tasks.messages.taskDeleted"));
    },
    [messageApi, recalcSummary, t],
  );

  const handleEditFromDetail = useCallback((task: Task) => {
    setDetailOpen(false);
    setEditTask(task);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    (values: TaskFormValues) => {
      if (editTask) {
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.task_id === editTask.task_id
              ? { ...t, ...values, updated_at: new Date().toISOString() }
              : t,
          );
          recalcSummary(updated);
          return updated;
        });
        messageApi.success(t("tasks.messages.taskUpdated"));
      } else {
        const newTask = createTaskFromForm(values, "event-123");
        setTasks((prev) => {
          const updated = [...prev, newTask];
          recalcSummary(updated);
          return updated;
        });
        messageApi.success(t("tasks.messages.taskCreated"));
      }
      setFormOpen(false);
      setEditTask(null);
    },
    [editTask, messageApi, recalcSummary, t],
  );

  const handleTemplateApply = useCallback(
    (
      template: WeddingTemplate,
      weddingDate: Date,
      includeOptional: boolean,
    ) => {
      const generated = generateTasksFromTemplate(
        template,
        weddingDate,
        includeOptional,
        "event-123",
      );
      setTasks((prev) => {
        const updated = [...prev, ...generated];
        recalcSummary(updated);
        return updated;
      });
      messageApi.success(
        t("tasks.messages.templateApplied", { count: generated.length }),
      );
    },
    [messageApi, recalcSummary, t],
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
    isLoading,
    detailTask,
    detailOpen,
    formOpen,
    editTask,
    messageContextHolder,
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
