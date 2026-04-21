import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Calendar,
  Card,
  Empty,
  Flex,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import {
  AVATAR_COLORS,
  PRIORITY_COLORS,
  STATUS_BADGE_TYPES,
} from "../../constants/task.constants";
import type { TaskCalendarProps } from "../../models/taskComponent.models";
import { getInitials, getTasksForDate } from "../../utils/task.utils";
import styles from "./TaskCalendar.module.css";

const { Text, Title } = Typography;

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  onTaskClick,
  onQuickComplete,
  onNewTask,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const selectedTasks = getTasksForDate(tasks, selectedDate.toDate());
  const avatarColorClasses = [
    styles.avatarColor0,
    styles.avatarColor1,
    styles.avatarColor2,
    styles.avatarColor3,
    styles.avatarColor4,
    styles.avatarColor5,
  ] as const;

  const dateCellRender = (date: Dayjs) => {
    const dayTasks = getTasksForDate(tasks, date.toDate());

    if (dayTasks.length === 0) {
      return null;
    }

    const overdue = dayTasks.filter(
      (task) =>
        task.status !== "completed" &&
        task.status !== "cancelled" &&
        date.isBefore(dayjs(), "day"),
    );
    const active = dayTasks.filter(
      (task) => task.status !== "completed" && task.status !== "cancelled",
    );
    const completed = dayTasks.filter(
      (task) => task.status === "completed",
    );

    return (
      <div className={styles.calendarCell}>
        {overdue.length > 0 && (
          <Badge
            status="error"
            text={`${overdue.length}`}
            className={styles.calendarBadge}
          />
        )}
        {active.length > 0 && overdue.length === 0 && (
          <Badge
            status="processing"
            text={`${active.length}`}
            className={styles.calendarBadge}
          />
        )}
        {completed.length > 0 && active.length === 0 && overdue.length === 0 && (
          <Badge
            status="success"
            text={`${completed.length}`}
            className={styles.calendarBadge}
          />
        )}
        {dayTasks.length > 1 && (
          <div className={styles.calendarDots}>
            {dayTasks.slice(0, 3).map((task) => (
              <Badge color={task.category_color} key={task.task_id} />
            ))}
            {dayTasks.length > 3 && (
              <Text type="secondary" className={styles.dotOverflowText}>
                +{dayTasks.length - 3}
              </Text>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Space orientation="vertical" className={styles.fullWidth} size="large">
      <div className={styles.calendarHeader}>
        <Title level={5} className={styles.calendarTitle}>
          {t("tasks.calendar.title")}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onNewTask}>
          {t("tasks.newTask")}
        </Button>
      </div>

      <div className={styles.calendarLayout}>
        <div className={styles.calendarMain}>
          <Card size="small">
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={(date) => setSelectedDate(date)}
              cellRender={(current, info) => {
                if (info.type === "date") {
                  return dateCellRender(current as Dayjs);
                }

                return null;
              }}
            />
          </Card>
        </div>

        <div className={styles.calendarSidebar}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined className={styles.calendarIcon} />
                <span>{selectedDate.format("dddd, MMMM D")}</span>
              </Space>
            }
            size="small"
            extra={
              <Tag>
                {selectedTasks.length} {t("tasks.calendar.tasksLabel")}
              </Tag>
            }
          >
            {selectedTasks.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("tasks.calendar.noTasks")}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={onNewTask}
                >
                  {t("tasks.newTask")}
                </Button>
              </Empty>
            ) : (
              <Flex vertical>
                {selectedTasks.map((task) => {
                  const isOverdue =
                    task.status !== "completed" &&
                    task.status !== "cancelled" &&
                    dayjs(task.due_date).isBefore(dayjs(), "day");

                  return (
                    <Flex
                      key={task.task_id}
                      align="center"
                      justify="space-between"
                      onClick={() => onTaskClick(task)}
                      className={styles.taskRow}
                    >
                      <Flex
                        align="flex-start"
                        gap={8}
                        className={styles.taskRowContent}
                      >
                        <Badge status={STATUS_BADGE_TYPES[task.status]} />
                        <Flex vertical>
                          <Space size={4}>
                            <span className={styles.taskName}>{task.title}</span>
                            <Tag
                              color={PRIORITY_COLORS[task.priority]}
                              className={styles.smallTag}
                            >
                              {t(`tasks.priority.${task.priority}`)}
                            </Tag>
                            {isOverdue && (
                              <Tag color="red" className={styles.smallTag}>
                                <ExclamationCircleOutlined />{" "}
                                {t("tasks.groups.overdue")}
                              </Tag>
                            )}
                          </Space>
                          <Space size={4} wrap>
                            <Tag
                              color={task.category_color}
                              className={styles.smallTag}
                            >
                              {task.category_name}
                            </Tag>
                            {task.assignees.slice(0, 2).map((assignee, index) => (
                              <Tooltip
                                key={assignee.assignment_id}
                                title={assignee.user_name}
                              >
                                <Avatar
                                  size={20}
                                  className={`${styles.smallAvatar} ${avatarColorClasses[index % AVATAR_COLORS.length]}`}
                                >
                                  {getInitials(assignee.user_name)}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </Space>
                        </Flex>
                      </Flex>
                      {task.status !== "completed" && (
                        <Tooltip title={t("tasks.card.markComplete")}>
                          <Button
                            type="text"
                            size="small"
                            icon={
                              <CheckCircleOutlined
                                className={styles.completeIcon}
                              />
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              onQuickComplete(task);
                            }}
                          />
                        </Tooltip>
                      )}
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Card>
        </div>
      </div>
    </Space>
  );
};

export default TaskCalendar;
