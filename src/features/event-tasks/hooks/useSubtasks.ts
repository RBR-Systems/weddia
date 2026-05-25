import { useState, useCallback, useEffect } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import type { Subtask } from "../models/task.models";
import {
  fetchSubtasksByTask,
  createSubtaskApi,
  updateSubtaskStatusApi,
  deleteSubtaskApi,
} from "../api/taskApi";

export interface UseSubtasksResult {
  subtasks: Subtask[];
  isLoading: boolean;
  addSubtask: (title: string) => Promise<void>;
  toggleSubtask: (subtask: Subtask) => Promise<void>;
  removeSubtask: (subtaskId: number) => Promise<void>;
}

export function useSubtasks(taskId: number | null): UseSubtasksResult {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (taskId == null) {
      setSubtasks([]);
      return;
    }
    setIsLoading(true);
    fetchSubtasksByTask(taskId)
      .then(setSubtasks)
      .catch(() => setSubtasks([]))
      .finally(() => setIsLoading(false));
  }, [taskId]);

  const addSubtask = useCallback(
    async (title: string) => {
      if (taskId == null || !title.trim()) return;
      const created = await createSubtaskApi({ taskId, title: title.trim(), priority: "Medium", status: "Pending" });
      setSubtasks((prev) => [...prev, created]);
      message.success(t("tasks.subtasks.added", "Subtask added"));
    },
    [message, t, taskId],
  );

  const toggleSubtask = useCallback(
    async (subtask: Subtask) => {
      const newStatus: Subtask["status"] = subtask.status === "completed" ? "pending" : "completed";
      setSubtasks((prev) =>
        prev.map((s) => (s.subtask_id === subtask.subtask_id ? { ...s, status: newStatus } : s)),
      );
      const apiStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      try {
        await updateSubtaskStatusApi(subtask.subtask_id, {
          taskId: subtask.task_id,
          title: subtask.title,
          priority: subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1),
          status: apiStatus,
        });
      } catch {
        setSubtasks((prev) =>
          prev.map((s) => (s.subtask_id === subtask.subtask_id ? subtask : s)),
        );
      }
    },
    [],
  );

  const removeSubtask = useCallback(
    async (subtaskId: number) => {
      setSubtasks((prev) => prev.filter((s) => s.subtask_id !== subtaskId));
      try {
        await deleteSubtaskApi(subtaskId);
      } catch {
        message.error(t("tasks.subtasks.deleteError", "Failed to delete subtask"));
      }
    },
    [message, t],
  );

  return { subtasks, isLoading, addSubtask, toggleSubtask, removeSubtask };
}
