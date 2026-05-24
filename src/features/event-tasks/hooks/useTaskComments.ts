import { useState, useCallback, useEffect } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import type { TaskComment } from "../models/task.models";
import { fetchCommentsByTask, createCommentApi, deleteCommentApi } from "../api/taskApi";

export interface UseTaskCommentsResult {
  comments: TaskComment[];
  isLoading: boolean;
  postComment: (text: string) => Promise<void>;
  removeComment: (commentId: number) => Promise<void>;
}

export function useTaskComments(taskId: number | null): UseTaskCommentsResult {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (taskId == null) {
      setComments([]);
      return;
    }
    setIsLoading(true);
    fetchCommentsByTask(taskId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setIsLoading(false));
  }, [taskId]);

  const postComment = useCallback(
    async (text: string) => {
      if (taskId == null || !text.trim()) return;
      const created = await createCommentApi({ taskId, comment: text.trim() });
      setComments((prev) => [created, ...prev]);
    },
    [taskId],
  );

  const removeComment = useCallback(
    async (commentId: number) => {
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
      try {
        await deleteCommentApi(commentId);
      } catch {
        message.error(t("tasks.comments.deleteError", "Failed to delete comment"));
      }
    },
    [message, t],
  );

  return { comments, isLoading, postComment, removeComment };
}
