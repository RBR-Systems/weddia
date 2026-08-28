import React, { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Collapse,
  Empty,
  Input,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ForwardOutlined,
  GlobalOutlined,
  LockOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import {
  AVATAR_COLORS,
  PRIORITY_COLORS,
  PROGRESS_STROKE_COLOR,
  STATUS_COLORS,
} from "../../constants/task.constants";
import type { Task } from "../../models/task.models";
import type { TaskListProps } from "../../models/taskComponent.models";
import { getInitials, groupTasks } from "../../utils/task.utils";
import TaskCard from "../TaskCard/TaskCard";
import styles from "./TaskList.module.css";

const TASK_GROUPS = {
  overdue: {
    titleKey: "tasks.groups.overdue",
    icon: <ExclamationCircleOutlined />,
    titleClassName: styles.overdueGroupTitle,
    isOverdue: true,
  },
  thisWeek: {
    titleKey: "tasks.groups.thisWeek",
    icon: <ClockCircleOutlined />,
    titleClassName: styles.thisWeekGroupTitle,
    isOverdue: false,
  },
  nextWeek: {
    titleKey: "tasks.groups.nextWeek",
    icon: <ForwardOutlined />,
    titleClassName: styles.nextWeekGroupTitle,
    isOverdue: false,
  },
  later: {
    titleKey: "tasks.groups.later",
    icon: <CalendarOutlined />,
    titleClassName: styles.laterGroupTitle,
    isOverdue: false,
  },
} as const;

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  categories,
  onTaskClick,
  onQuickComplete,
  onNewTask,
  onDeleteTasks,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    visibility: "all",
    search: "",
    sortBy: "due_date",
    sortOrder: "asc",
  });

  const filtered = useMemo(() => {
    let result = [...tasks];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (filters.status !== "all") {
      result = result.filter((task) => task.status === filters.status);
    }

    if (filters.priority !== "all") {
      result = result.filter((task) => task.priority === filters.priority);
    }

    if (filters.category !== "all") {
      result = result.filter((task) => task.category_id === filters.category);
    }

    if (filters.visibility !== "all") {
      result = result.filter((task) => task.visibility === filters.visibility);
    }

    result.sort((left, right) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "due_date":
          comparison =
            new Date(left.due_date).getTime() -
            new Date(right.due_date).getTime();
          break;
        case "priority": {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison =
            (priorityOrder[left.priority] ?? 9) -
            (priorityOrder[right.priority] ?? 9);
          break;
        }
        case "created_at":
          comparison =
            new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime();
          break;
        case "title":
          comparison = left.title.localeCompare(right.title);
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [tasks, filters]);

  const groupedTasks = useMemo(() => groupTasks(filtered), [filtered]);

  const avatarColorClasses = [
    styles.avatarColor0,
    styles.avatarColor1,
    styles.avatarColor2,
    styles.avatarColor3,
    styles.avatarColor4,
    styles.avatarColor5,
  ] as const;

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    (filters.visibility !== "all" ? 1 : 0) +
    (filters.search ? 1 : 0);

  const tableColumns: ColumnsType<Task> = [
    {
      title: t("tasks.form.title"),
      dataIndex: "title",
      key: "title",
      width: 220,
      ellipsis: { showTitle: false },
      render: (text: string, record: Task) => (
        <Tooltip title={text}>
          <Button
            type="link"
            onClick={() => onTaskClick(record)}
            className={styles.linkButton}
          >
            {text}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: t("tasks.form.dueDate"),
      dataIndex: "due_date",
      key: "due_date",
      width: 130,
      render: (date: string) => {
        const parsedDate = dayjs(date);
        const isOverdue = parsedDate.isBefore(dayjs(), "day");

        return (
          <span className={isOverdue ? styles.overdueDate : undefined}>
            {parsedDate.format("MMM D, YYYY")}
          </span>
        );
      },
    },
    {
      title: t("tasks.priority.label"),
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string) => (
        <Tag color={PRIORITY_COLORS[priority]}>
          {t(`tasks.priority.${priority}`)}
        </Tag>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{t(`tasks.status.${status}`)}</Tag>
      ),
    },
    {
      title: t("common.category"),
      key: "category",
      width: 140,
      render: (_value: unknown, record: Task) => (
        <Tag color={record.category_color}>{record.category_name}</Tag>
      ),
    },
    {
      title: t("tasks.detail.visibility"),
      dataIndex: "visibility",
      key: "visibility",
      width: 110,
      render: (vis: string) => {
        if (vis === "private") return <span className={styles.visPrivate}><LockOutlined /> {t("tasks.visibility.private")}</span>;
        if (vis === "public") return <span className={styles.visPublic}><GlobalOutlined /> {t("tasks.visibility.public")}</span>;
        return <span className={styles.visShared}><TeamOutlined /> {t("tasks.visibility.shared")}</span>;
      },
    },
    {
      title: t("tasks.detail.assignedTo"),
      key: "assignees",
      width: 120,
      render: (_value: unknown, record: Task) => (
        <Avatar.Group max={{ count: 3 }} size={24}>
          {record.assignees.map((assignee, index) => (
            <Tooltip key={assignee.assignment_id} title={assignee.user_name}>
              <Avatar
                size={24}
                className={`${styles.tableAvatar} ${avatarColorClasses[index % AVATAR_COLORS.length]}`}
              >
                {getInitials(assignee.user_name)}
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
      render: (_value: unknown, record: Task) => (
        <Progress
          percent={record.completion_percentage}
          size="small"
          strokeColor={PROGRESS_STROKE_COLOR}
          showInfo={false}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_value: unknown, record: Task) =>
        record.status !== "completed" ? (
          <Tooltip title={t("tasks.card.markComplete")}>
            <Button
              type="text"
              size="small"
              icon={<CheckCircleFilled className={styles.completeIcon} />}
              onClick={(event) => {
                event.stopPropagation();
                onQuickComplete(record);
              }}
            />
          </Tooltip>
        ) : null,
    },
  ];

  const renderGroup = (
    groupTasksList: Task[],
    titleKey: string,
    icon: React.ReactNode,
    titleClassName: string,
    isOverdue?: boolean,
  ) => {
    if (groupTasksList.length === 0) {
      return null;
    }

    return (
      <div className={styles.taskGroup}>
        <div className={`${styles.taskGroupTitle} ${titleClassName}`}>
          {icon}
          {t(titleKey)}
          <span className={styles.taskGroupCount}>
            ({groupTasksList.length})
          </span>
        </div>
        <div className={styles.taskGrid}>
          {groupTasksList.map((task) => (
            <div key={task.task_id} className={styles.selectableCard}>
              {selectMode && (
                <Checkbox
                  className={styles.cardCheckbox}
                  checked={selectedIds.includes(task.task_id)}
                  onChange={(e) => {
                    e.nativeEvent.stopImmediatePropagation();
                    setSelectedIds((prev) =>
                      e.target.checked
                        ? [...prev, task.task_id]
                        : prev.filter((id) => id !== task.task_id),
                    );
                  }}
                />
              )}
              <TaskCard
                task={task}
                onClick={onTaskClick}
                onQuickComplete={onQuickComplete}
                isOverdue={isOverdue}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const rowSelection = selectMode ? {
    selectedRowKeys: selectedIds,
    onChange: (keys: React.Key[]) => setSelectedIds(keys as string[]),
  } : undefined;

  return (
    <div>
      <div className={styles.taskListHeader}>
        <Input
          placeholder={t("tasks.searchPlaceholder")}
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              search: event.target.value,
            }))
          }
          className={styles.searchInput}
          allowClear
        />
        <div className={styles.taskListActions}>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as "cards" | "table")}
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
              onClick={() => setShowFilters((current) => !current)}
            >
              {t("common.filters")}
            </Button>
          </Badge>
          {selectMode ? (
            <>
              {selectedIds.length > 0 && (
                <Popconfirm
                  title={t("tasks.bulkDelete.confirm", { count: selectedIds.length })}
                  onConfirm={() => {
                    onDeleteTasks(selectedIds);
                    setSelectedIds([]);
                    setSelectMode(false);
                  }}
                  okText={t("common.delete")}
                  cancelText={t("common.cancel")}
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    {t("tasks.bulkDelete.button", { count: selectedIds.length })}
                  </Button>
                </Popconfirm>
              )}
              <Button onClick={() => { setSelectMode(false); setSelectedIds([]); }}>
                {t("common.cancel")}
              </Button>
            </>
          ) : (
            <Button icon={<CheckCircleFilled className={styles.selectModeIcon} />} onClick={() => setSelectMode(true)}>
              {t("tasks.select")}
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={onNewTask}>
            {t("tasks.newTask")}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterRow}>
          <Select
            value={filters.status}
            onChange={(value) =>
              setFilters((current) => ({ ...current, status: value }))
            }
            className={styles.minWidth140}
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
            onChange={(value) =>
              setFilters((current) => ({ ...current, priority: value }))
            }
            className={styles.minWidth140}
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
            onChange={(value) =>
              setFilters((current) => ({ ...current, category: value }))
            }
            className={styles.minWidth180}
            options={[
              { value: "all", label: t("common.all") },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            placeholder={t("common.category")}
          />
          <Select
            value={filters.visibility}
            onChange={(value) =>
              setFilters((current) => ({ ...current, visibility: value }))
            }
            className={styles.minWidth140}
            options={[
              { value: "all", label: t("common.all") },
              { value: "private", label: <span><LockOutlined /> {t("tasks.visibility.private")}</span> },
              { value: "shared", label: <span><TeamOutlined /> {t("tasks.visibility.shared")}</span> },
              { value: "public", label: <span><GlobalOutlined /> {t("tasks.visibility.public")}</span> },
            ]}
            placeholder={t("tasks.detail.visibility")}
          />
          <Select
            value={filters.sortBy}
            onChange={(value) =>
              setFilters((current) => ({ ...current, sortBy: value }))
            }
            className={styles.minWidth160}
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
                visibility: "all",
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
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          rowClassName={() => styles.clickableRow}
          rowSelection={rowSelection}
          onRow={(record) => ({
            onClick: () => onTaskClick(record),
          })}
        />
      ) : (
        <>
          {renderGroup(
            groupedTasks.overdue,
            TASK_GROUPS.overdue.titleKey,
            TASK_GROUPS.overdue.icon,
            TASK_GROUPS.overdue.titleClassName,
            TASK_GROUPS.overdue.isOverdue,
          )}
          {renderGroup(
            groupedTasks.thisWeek,
            TASK_GROUPS.thisWeek.titleKey,
            TASK_GROUPS.thisWeek.icon,
            TASK_GROUPS.thisWeek.titleClassName,
            TASK_GROUPS.thisWeek.isOverdue,
          )}
          {renderGroup(
            groupedTasks.nextWeek,
            TASK_GROUPS.nextWeek.titleKey,
            TASK_GROUPS.nextWeek.icon,
            TASK_GROUPS.nextWeek.titleClassName,
            TASK_GROUPS.nextWeek.isOverdue,
          )}
          {renderGroup(
            groupedTasks.later,
            TASK_GROUPS.later.titleKey,
            TASK_GROUPS.later.icon,
            TASK_GROUPS.later.titleClassName,
            TASK_GROUPS.later.isOverdue,
          )}

          {groupedTasks.completed.length > 0 && (
            <Collapse
              ghost
              items={[
                {
                  key: "completed",
                  label: (
                    <span className={styles.completedLabel}>
                      <CheckCircleFilled /> {t("tasks.groups.completed")} (
                      {groupedTasks.completed.length})
                    </span>
                  ),
                  children: (
                    <div className={styles.taskGrid}>
                      {groupedTasks.completed.map((task) => (
                        <div key={task.task_id} className={styles.selectableCard}>
                          {selectMode && (
                            <Checkbox
                              className={styles.cardCheckbox}
                              checked={selectedIds.includes(task.task_id)}
                              onChange={(e) => {
                                e.nativeEvent.stopImmediatePropagation();
                                setSelectedIds((prev) =>
                                  e.target.checked
                                    ? [...prev, task.task_id]
                                    : prev.filter((id) => id !== task.task_id),
                                );
                              }}
                            />
                          )}
                          <TaskCard
                            task={task}
                            onClick={onTaskClick}
                            onQuickComplete={onQuickComplete}
                          />
                        </div>
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
