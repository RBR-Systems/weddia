"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Tabs, Spin, message, Typography } from "antd";
import { UnorderedListOutlined, DashboardOutlined, CalendarOutlined, FileAddOutlined } from "@ant-design/icons";
import type { Task, TaskSummary, TaskCategory, WeddingTemplate, TaskFormValues } from "./models/task.models";
import { fetchTasks, buildCategories, computeTaskSummary, generateTasksFromTemplate, createTaskFromForm } from "./api/taskApi";
import TaskList from "./components/TaskList";
import ProgressDashboard from "./components/ProgressDashboard";
import TaskCalendar from "./components/TaskCalendar";
import TaskDetailModal from "./components/TaskDetailModal";
import TaskFormModal from "./components/TaskFormModal";
import TemplateSelector from "./components/TemplateSelector";
import styles from "./EventTasks.module.css";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

const EventTasksDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary>({
    total_tasks: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    overdue: 0,
    this_week: 0,
    completion_percentage: 0,
  });
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  // ── Load tasks ──
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data.tasks);
      setSummary(data.summary);
      setCategories(buildCategories(data.tasks));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // recalc summary whenever tasks change
  const recalcSummary = useCallback((allTasks: Task[]) => {
    setSummary(computeTaskSummary(allTasks));
    setCategories(buildCategories(allTasks));
  }, []);

  // ── Quick complete ──
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

  // ── Task detail ──
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

  // ── Task form (create / edit) ──
  const handleEditFromDetail = useCallback((task: Task) => {
    setDetailOpen(false);
    setEditTask(task);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    (values: TaskFormValues) => {
      if (editTask) {
        // Update
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.task_id === editTask.task_id
              ? {
                  ...t,
                  ...values,
                  updated_at: new Date().toISOString(),
                }
              : t,
          );
          recalcSummary(updated);
          return updated;
        });
        messageApi.success(t("tasks.messages.taskUpdated"));
      } else {
        // Create
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

  // ── Template ──
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: "dashboard",
      label: (
        <span>
          <DashboardOutlined /> {t("tasks.tabs.dashboard")}
        </span>
      ),
      children: (
        <ProgressDashboard
          tasks={tasks}
          summary={summary}
          categories={categories}
        />
      ),
    },
    {
      key: "tasks",
      label: (
        <span>
          <UnorderedListOutlined /> {t("tasks.tabs.tasks")}
        </span>
      ),
      children: (
        <TaskList
          tasks={tasks}
          categories={categories}
          onTaskClick={handleTaskClick}
          onQuickComplete={handleQuickComplete}
          onNewTask={() => {
            setEditTask(null);
            setFormOpen(true);
          }}
        />
      ),
    },
    {
      key: "calendar",
      label: (
        <span>
          <CalendarOutlined /> {t("tasks.tabs.calendar")}
        </span>
      ),
      children: (
        <TaskCalendar
          tasks={tasks}
          categories={categories}
          onTaskClick={handleTaskClick}
          onQuickComplete={handleQuickComplete}
          onNewTask={() => {
            setEditTask(null);
            setFormOpen(true);
          }}
        />
      ),
    },
    {
      key: "templates",
      label: (
        <span>
          <FileAddOutlined /> {t("tasks.tabs.templates")}
        </span>
      ),
      children: <TemplateSelector onApply={handleTemplateApply} />,
    },
  ];

  return (
    <div className={styles.taskDashboard}>
      {contextHolder}

      <Title level={3} className={styles.dashboardTitle}>
        {t("tasks.title")}
      </Title>

      <Tabs defaultActiveKey="dashboard" items={tabItems} size="large" />

      <TaskDetailModal
        task={detailTask}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

      <TaskFormModal
        open={formOpen}
        task={editTask}
        categories={categories}
        onClose={() => {
          setFormOpen(false);
          setEditTask(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default EventTasksDashboard;

