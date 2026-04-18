import React, { useMemo, useState } from "react";
import { Input, Select, Button, Space, Collapse, Empty, Typography, Badge, Segmented, Table, Tag, Tooltip, Avatar, Progress } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, FilterOutlined, SearchOutlined, ExclamationCircleOutlined, ClockCircleOutlined, CalendarOutlined, CheckCircleFilled, AppstoreOutlined, UnorderedListOutlined, ForwardOutlined } from "@ant-design/icons";
import type { Task, TaskFilters, TaskCategory } from "../models/task.models";
import { groupTasks } from "../api/taskApi";
import TaskCard from "./TaskCard";
import styles from "../EventTasks.module.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Title } = Typography;

interface TaskListProps {
  tasks: Task[];
  categories: TaskCategory[];
  onTaskClick: (task: Task) => void;
  onQuickComplete: (task: Task) => void;
  onNewTask: () => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  categories,
  onTaskClick,
  onQuickComplete,
  onNewTask,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    category: "all",
    search: "",
    sortBy: "due_date",
    sortOrder: "asc",
  });

  // filter tasks
  const filtered = useMemo(() => {
    let result = [...tasks];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    if (filters.status !== "all") {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority !== "all") {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.category !== "all") {
      result = result.filter((t) => t.category_id === filters.category);
    }

    // sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case "due_date":
          cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority": {
          const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          cmp = (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9);
          break;
        }
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return filters.sortOrder === "desc" ? -cmp : cmp;
    });

    return result;
  }, [tasks, filters]);

  const { overdue, thisWeek, nextWeek, later, completed } = useMemo(
    () => groupTasks(filtered),
    [filtered],
  );

  const priorityColors: Record<string, string> = {
    urgent: "red",
    high: "orange",
    medium: "gold",
    low: "green",
  };

  const statusColors: Record<string, string> = {
    pending: "default",
    in_progress: "processing",
    completed: "success",
    cancelled: "error",
    on_hold: "warning",
  };

  const avatarColors = [
    "#c9a38c",
    "#5b6bc1",
    "#5cb68a",
    "#d4a29a",
    "#F59E0B",
    "#8B5CF6",
  ];

  // Table columns
  const tableColumns: ColumnsType<Task> = [
    {
      title: t("tasks.form.title"),
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text: string, record: Task) => (
        <Button
          type="link"
          onClick={() => onTaskClick(record)}
          style={{
            padding: 0,
            height: "auto",
            whiteSpace: "normal",
            textAlign: "left",
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t("tasks.form.dueDate"),
      dataIndex: "due_date",
      key: "due_date",
      width: 130,
      render: (date: string) => {
        const d = dayjs(date);
        const isOverdue = d.isBefore(dayjs(), "day");
        return (
          <span
            style={{
              color: isOverdue ? "#ef4444" : undefined,
              fontWeight: isOverdue ? 600 : undefined,
            }}
          >
            {d.format("MMM D, YYYY")}
          </span>
        );
      },
    },
    {
      title: t("tasks.priority.label"),
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (p: string) => (
        <Tag color={priorityColors[p]}>{t(`tasks.priority.${p}`)}</Tag>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s: string) => (
        <Tag color={statusColors[s]}>{t(`tasks.status.${s}`)}</Tag>
      ),
    },
    {
      title: t("common.category"),
      key: "category",
      width: 140,
      render: (_: unknown, record: Task) => (
        <Tag
          style={{
            borderColor: record.category_color,
            color: record.category_color,
          }}
        >
          {record.category_name}
        </Tag>
      ),
    },
    {
      title: t("tasks.detail.assignedTo"),
      key: "assignees",
      width: 120,
      render: (_: unknown, record: Task) => (
        <Avatar.Group max={{ count: 3 }} size={24}>
          {record.assignees.map((a, idx) => (
            <Tooltip key={a.assignment_id} title={a.user_name}>
              <Avatar
                size={24}
                style={{
                  backgroundColor: avatarColors[idx % avatarColors.length],
                  fontSize: 11,
                }}
              >
                {a.user_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      ),
    },
    {
      title: "%",
      key: "progress",
      width: 80,
      render: (_: unknown, record: Task) => (
        <Progress
          percent={record.completion_percentage}
          size="small"
          strokeColor="#c9a38c"
          showInfo={false}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: unknown, record: Task) =>
        record.status !== "completed" ? (
          <Tooltip title={t("tasks.card.markComplete")}>
            <Button
              type="text"
              size="small"
              icon={<CheckCircleFilled style={{ color: "#22C55E" }} />}
              onClick={(e) => {
                e.stopPropagation();
                onQuickComplete(record);
              }}
            />
          </Tooltip>
        ) : null,
    },
  ];

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    (filters.search ? 1 : 0);

  const renderGroup = (
    groupTasks: Task[],
    titleKey: string,
    icon: React.ReactNode,
    color: string,
    isOverdue?: boolean,
  ) => {
    if (groupTasks.length === 0) return null;
    return (
      <div className={styles.taskGroup}>
        <div className={styles.taskGroupTitle} style={{ color }}>
          {icon}
          {t(titleKey)}
          <span className={styles.taskGroupCount}>({groupTasks.length})</span>
        </div>
        <div className={styles.taskGrid}>
          {groupTasks.map((task) => (
            <TaskCard
              key={task.task_id}
              task={task}
              onClick={onTaskClick}
              onQuickComplete={onQuickComplete}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.taskListHeader}>
        <Input
          placeholder={t("tasks.searchPlaceholder")}
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          style={{ maxWidth: 300 }}
          allowClear
        />
        <div className={styles.taskListActions}>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as "cards" | "table")}
            options={[
              {
                value: "cards",
                icon: <AppstoreOutlined />,
                label: t("tasks.viewMode.cards"),
              },
              {
                value: "table",
                icon: <UnorderedListOutlined />,
                label: t("tasks.viewMode.table"),
              },
            ]}
            size="middle"
          />
          <Badge count={activeFilterCount} size="small">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {t("common.filters")}
            </Button>
          </Badge>
          <Button type="primary" icon={<PlusOutlined />} onClick={onNewTask}>
            {t("tasks.newTask")}
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className={styles.filterRow}>
          <Select
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            style={{ minWidth: 140 }}
            options={[
              { value: "all", label: t("common.all") },
              { value: "pending", label: t("tasks.status.pending") },
              { value: "in_progress", label: t("tasks.status.in_progress") },
              { value: "completed", label: t("tasks.status.completed") },
              { value: "cancelled", label: t("tasks.status.cancelled") },
              { value: "on_hold", label: t("tasks.status.on_hold") },
            ]}
            placeholder={t("common.status")}
          />
          <Select
            value={filters.priority}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
            style={{ minWidth: 140 }}
            options={[
              { value: "all", label: t("common.all") },
              { value: "urgent", label: t("tasks.priority.urgent") },
              { value: "high", label: t("tasks.priority.high") },
              { value: "medium", label: t("tasks.priority.medium") },
              { value: "low", label: t("tasks.priority.low") },
            ]}
            placeholder={t("tasks.priority.label")}
          />
          <Select
            value={filters.category}
            onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
            style={{ minWidth: 180 }}
            options={[
              { value: "all", label: t("common.all") },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            placeholder={t("common.category")}
          />
          <Select
            value={filters.sortBy}
            onChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}
            style={{ minWidth: 160 }}
            options={[
              { value: "due_date", label: t("tasks.sort.dueDate") },
              { value: "priority", label: t("tasks.sort.priority") },
              { value: "created_at", label: t("tasks.sort.createdDate") },
              { value: "title", label: t("tasks.sort.name") },
            ]}
          />
          <Button
            type="link"
            onClick={() =>
              setFilters({
                status: "all",
                priority: "all",
                category: "all",
                search: "",
                sortBy: "due_date",
                sortOrder: "asc",
              })
            }
          >
            {t("guestList.clearFilters")}
          </Button>
        </div>
      )}

      {/* Task groups */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Empty
            description={t("tasks.emptyState")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onNewTask}
              >
                {t("tasks.createFirst")}
              </Button>
            </Space>
          </Empty>
        </div>
      ) : viewMode === "table" ? (
        <Table
          dataSource={filtered}
          columns={tableColumns}
          rowKey="task_id"
          size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => onTaskClick(record),
            style: { cursor: "pointer" },
          })}
        />
      ) : (
        <>
          {renderGroup(
            overdue,
            "tasks.groups.overdue",
            <ExclamationCircleOutlined />,
            "#ef4444",
            true,
          )}
          {renderGroup(
            thisWeek,
            "tasks.groups.thisWeek",
            <ClockCircleOutlined />,
            "#3B82F6",
          )}
          {renderGroup(
            nextWeek,
            "tasks.groups.nextWeek",
            <ForwardOutlined />,
            "#8B5CF6",
          )}
          {renderGroup(
            later,
            "tasks.groups.later",
            <CalendarOutlined />,
            "#6B7280",
          )}

          {/* Completed – collapsible */}
          {completed.length > 0 && (
            <Collapse
              ghost
              items={[
                {
                  key: "completed",
                  label: (
                    <span style={{ color: "#22C55E" }}>
                      <CheckCircleFilled /> {t("tasks.groups.completed")} (
                      {completed.length})
                    </span>
                  ),
                  children: (
                    <div className={styles.taskGrid}>
                      {completed.map((task) => (
                        <TaskCard
                          key={task.task_id}
                          task={task}
                          onClick={onTaskClick}
                          onQuickComplete={onQuickComplete}
                        />
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;

