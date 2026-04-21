import React, { useMemo } from "react";
import {
  Avatar,
  Badge,
  Card,
  Col,
  Flex,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import {
  AVATAR_COLORS,
  PRIORITY_COLORS,
  PROGRESS_STROKE_COLOR,
} from "../../constants/task.constants";
import type { ProgressDashboardProps } from "../../models/taskComponent.models";
import { getInitials } from "../../utils/task.utils";
import styles from "./ProgressDashboard.module.css";

const { Text } = Typography;

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  tasks,
  summary,
  categories,
}) => {
  const { t } = useTranslation();

  const priorityCounts = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          acc[task.priority] = (acc[task.priority] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [tasks],
  );

  const { milestones, milestonesCompleted, upcomingMilestones } = useMemo(() => {
    const allMilestones = tasks.filter((task) => task.is_milestone);
    const completedCount = allMilestones.filter(
      (task) => task.status === "completed",
    ).length;
    const upcoming = allMilestones
      .filter(
        (task) =>
          task.status !== "completed" && task.status !== "cancelled",
      )
      .sort(
        (left, right) =>
          new Date(left.due_date).getTime() -
          new Date(right.due_date).getTime(),
      )
      .slice(0, 5);

    return {
      milestones: allMilestones,
      milestonesCompleted: completedCount,
      upcomingMilestones: upcoming,
    };
  }, [tasks]);

  const topAssignees = useMemo(() => {
    const assigneeMap = new Map<
      string,
      { name: string; taskCount: number; completedCount: number }
    >();

    tasks.forEach((task) => {
      task.assignees.forEach((assignee) => {
        const existing = assigneeMap.get(assignee.user_id);

        if (existing) {
          existing.taskCount += 1;
          if (task.status === "completed") {
            existing.completedCount += 1;
          }
          return;
        }

        assigneeMap.set(assignee.user_id, {
          name: assignee.user_name,
          taskCount: 1,
          completedCount: task.status === "completed" ? 1 : 0,
        });
      });
    });

    return Array.from(assigneeMap.entries())
      .sort((left, right) => right[1].taskCount - left[1].taskCount)
      .slice(0, 6);
  }, [tasks]);

  const avatarColorClasses = [
    styles.avatarColor0,
    styles.avatarColor1,
    styles.avatarColor2,
    styles.avatarColor3,
    styles.avatarColor4,
    styles.avatarColor5,
  ] as const;

  return (
    <Space orientation="vertical" className={styles.fullWidth} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.overallProgress")}
              value={summary.completion_percentage}
              suffix="%"
              prefix={<CheckCircleOutlined className={styles.completeIcon} />}
            />
            <Progress
              percent={summary.completion_percentage}
              showInfo={false}
              strokeColor={PROGRESS_STROKE_COLOR}
              size="small"
            />
            <Text type="secondary" className={styles.helperTextSmall}>
              {t("tasks.progress.tasksCompleted", {
                completed: summary.completed,
                total: summary.total_tasks,
              })}
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.dueThisWeek")}
              value={summary.this_week}
              prefix={<ClockCircleOutlined className={styles.infoIcon} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card
            size="small"
            className={
              summary.overdue > 0 ? styles.overdueStatisticCard : undefined
            }
          >
            <Statistic
              title={t("tasks.progress.overdue")}
              value={summary.overdue}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.inProgress")}
              value={summary.in_progress}
              prefix={<CalendarOutlined className={styles.infoIcon} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.pending")}
              value={summary.pending}
              prefix={<ClockCircleOutlined className={styles.pendingIcon} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.milestones")}
              value={`${milestonesCompleted}/${milestones.length}`}
              prefix={<FlagOutlined className={styles.milestoneIcon} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title={t("tasks.progress.byCategory")} size="small">
            <div className={styles.categoryProgressList}>
              {categories.map((category) => {
                const percent =
                  category.count > 0
                    ? Math.round(
                        (category.completedCount / category.count) * 100,
                      )
                    : 0;

                return (
                  <div key={category.id} className={styles.categoryRow}>
                    <Badge color={category.color} />
                    <span className={styles.categoryName}>{category.name}</span>
                    <div className={styles.categoryBar}>
                      <Progress
                        percent={percent}
                        size="small"
                        strokeColor={category.color}
                        showInfo={false}
                      />
                    </div>
                    <span className={styles.categoryFraction}>
                      {category.completedCount}/{category.count}
                    </span>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <Text type="secondary" className={styles.helperTextMedium}>
                  {t("common.noData")}
                </Text>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={t("tasks.progress.byPriority")} size="small">
            <Space
              orientation="vertical"
              className={styles.fullWidth}
              size="small"
            >
              {(["urgent", "high", "medium", "low"] as const).map(
                (priority) => (
                  <div key={priority} className={styles.priorityRow}>
                    <Tag color={PRIORITY_COLORS[priority]}>
                      {t(`tasks.priority.${priority}`)}
                    </Tag>
                    <strong>{priorityCounts[priority] ?? 0}</strong>
                  </div>
                ),
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <TeamOutlined className={styles.teamIcon} />
                {t("tasks.progress.teamWorkload")}
              </Space>
            }
            size="small"
          >
            {topAssignees.length > 0 ? (
              <Flex vertical>
                {topAssignees.map(([userId, data], index) => (
                  <Flex
                    key={userId}
                    align="center"
                    justify="space-between"
                    className={styles.workloadRow}
                  >
                    <Flex align="center" gap={12}>
                      <Avatar
                        size={32}
                        className={`${styles.avatar} ${avatarColorClasses[index % AVATAR_COLORS.length]}`}
                      >
                        {getInitials(data.name)}
                      </Avatar>
                      <Flex vertical>
                        <Text className={styles.memberName}>{data.name}</Text>
                        <Text type="secondary" className={styles.memberMeta}>
                          {data.completedCount}/{data.taskCount}{" "}
                          {t("tasks.progress.tasksLabel")}
                        </Text>
                      </Flex>
                    </Flex>
                    <Progress
                      type="circle"
                      percent={Math.round(
                        (data.completedCount / data.taskCount) * 100,
                      )}
                      size={36}
                      strokeColor={PROGRESS_STROKE_COLOR}
                      strokeWidth={8}
                    />
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text type="secondary" className={styles.helperTextMedium}>
                {t("tasks.progress.noAssignees")}
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {upcomingMilestones.length > 0 && (
        <Card
          title={
            <Space>
              <FlagOutlined className={styles.milestoneIcon} />
              {t("tasks.progress.upcomingMilestones")}
            </Space>
          }
          size="small"
        >
          <Flex vertical>
            {upcomingMilestones.map((milestone) => {
              const daysUntil = dayjs(milestone.due_date).diff(dayjs(), "day");

              return (
                <Flex
                  key={milestone.task_id}
                  align="center"
                  justify="space-between"
                  className={styles.milestoneRow}
                >
                  <Flex align="flex-start" gap={12}>
                    <FlagOutlined className={styles.milestoneIconLarge} />
                    <Flex vertical>
                      <Text>{milestone.title}</Text>
                      <Space size={4}>
                        <Tag color={milestone.category_color}>
                          {milestone.category_name}
                        </Tag>
                        <Text
                          type="secondary"
                          className={styles.helperTextSmall}
                        >
                          {dayjs(milestone.due_date).format("MMM D, YYYY")}
                        </Text>
                      </Space>
                    </Flex>
                  </Flex>
                  <Tag color={daysUntil <= 7 ? "orange" : "blue"}>
                    {daysUntil === 0
                      ? t("tasks.card.dueToday")
                      : t("tasks.card.dueDays", { count: daysUntil })}
                  </Tag>
                </Flex>
              );
            })}
          </Flex>
        </Card>
      )}
    </Space>
  );
};

export default ProgressDashboard;
