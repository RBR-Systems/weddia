"use client";
import React from "react";
import { Tabs, Spin, Typography } from "antd";
import {
  UnorderedListOutlined,
  DashboardOutlined,
  CalendarOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEventTasks } from "./hooks/useEventTasks";
import TaskList from "./components/TaskList/TaskList";
import ProgressDashboard from "./components/ProgressDashboard/ProgressDashboard";
import TaskCalendar from "./components/TaskCalendar/TaskCalendar";
import TaskDetailModal from "./components/TaskDetailModal/TaskDetailModal";
import TaskFormModal from "./components/TaskFormModal/TaskFormModal";
import TemplateSelector from "./components/TemplateSelector/TemplateSelector";
import styles from "./EventTasks.module.css";

const { Title } = Typography;

const EventTasksDashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
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
  } = useEventTasks();

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
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
          onNewTask={openNewTaskForm}
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
          onNewTask={openNewTaskForm}
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
      <Title level={3} className={styles.dashboardTitle}>
        {t("tasks.title")}
      </Title>

      <Tabs defaultActiveKey="dashboard" items={tabItems} size="large" />

      <TaskDetailModal
        task={detailTask}
        open={detailOpen}
        onClose={closeDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

      <TaskFormModal
        open={formOpen}
        task={editTask}
        categories={categories}
        members={members}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default EventTasksDashboard;

