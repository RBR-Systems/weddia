import React from "react";
import {
  Card,
  Progress,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Avatar,
  Flex,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  FlagOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { Task, TaskSummary, TaskCategory } from "../models/task.models";
import styles from "../EventTasks.module.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text } = Typography;

interface ProgressDashboardProps {
  tasks: Task[];
  summary: TaskSummary;
  categories: TaskCategory[];
}

const avatarColors = [
  "#c9a38c",
  "#5b6bc1",
  "#5cb68a",
  "#d4a29a",
  "#F59E0B",
  "#8B5CF6",
];

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  tasks,
  summary,
  categories,
}) => {
  const { t } = useTranslation();

  // Priority breakdown
  const priorityCounts = {
    urgent: tasks.filter((tk) => tk.priority === "urgent").length,
    high: tasks.filter((tk) => tk.priority === "high").length,
    medium: tasks.filter((tk) => tk.priority === "medium").length,
    low: tasks.filter((tk) => tk.priority === "low").length,
  };

  // Milestones
  const milestones = tasks.filter((tk) => tk.is_milestone);
  const milestonesCompleted = milestones.filter(
    (tk) => tk.status === "completed",
  ).length;

  // Upcoming milestones
  const upcomingMilestones = milestones
    .filter((tk) => tk.status !== "completed" && tk.status !== "cancelled")
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    )
    .slice(0, 5);

  // Unique assignees
  const assigneeMap = new Map<
    string,
    { name: string; taskCount: number; completedCount: number }
  >();
  tasks.forEach((tk) => {
    tk.assignees.forEach((a) => {
      const existing = assigneeMap.get(a.user_id);
      if (existing) {
        existing.taskCount += 1;
        if (tk.status === "completed") existing.completedCount += 1;
      } else {
        assigneeMap.set(a.user_id, {
          name: a.user_name,
          taskCount: 1,
          completedCount: tk.status === "completed" ? 1 : 0,
        });
      }
    });
  });

  const topAssignees = Array.from(assigneeMap.entries())
    .sort((a, b) => b[1].taskCount - a[1].taskCount)
    .slice(0, 6);

  return (
    <Space orientation="vertical" style={{ width: "100%" }} size="large">
      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.overallProgress")}
              value={summary.completion_percentage}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: "#22C55E" }} />}
            />
            <Progress
              percent={summary.completion_percentage}
              showInfo={false}
              strokeColor="#c9a38c"
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
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
              prefix={<ClockCircleOutlined style={{ color: "#3B82F6" }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.overdue")}
              value={summary.overdue}
              valueStyle={{
                color: summary.overdue > 0 ? "#ef4444" : undefined,
              }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.inProgress")}
              value={summary.in_progress}
              prefix={<CalendarOutlined style={{ color: "#3B82F6" }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.pending")}
              value={summary.pending}
              prefix={<ClockCircleOutlined style={{ color: "#F59E0B" }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card size="small">
            <Statistic
              title={t("tasks.progress.milestones")}
              value={`${milestonesCompleted}/${milestones.length}`}
              prefix={<FlagOutlined style={{ color: "#F59E0B" }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Category progress */}
        <Col xs={24} md={14}>
          <Card title={t("tasks.progress.byCategory")} size="small">
            <div className={styles.categoryProgressList}>
              {categories.map((cat) => {
                const pct =
                  cat.count > 0
                    ? Math.round((cat.completedCount / cat.count) * 100)
                    : 0;
                return (
                  <div key={cat.id} className={styles.categoryRow}>
                    <span
                      className={styles.categoryDot}
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className={styles.categoryName}>{cat.name}</span>
                    <div className={styles.categoryBar}>
                      <Progress
                        percent={pct}
                        size="small"
                        strokeColor={cat.color}
                        showInfo={false}
                      />
                    </div>
                    <span className={styles.categoryFraction}>
                      {cat.completedCount}/{cat.count}
                    </span>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t("common.noData")}
                </Text>
              )}
            </div>
          </Card>
        </Col>

        {/* Priority breakdown */}
        <Col xs={24} md={10}>
          <Card title={t("tasks.progress.byPriority")} size="small">
            <Space orientation="vertical" style={{ width: "100%" }}>
              {(["urgent", "high", "medium", "low"] as const).map((p) => {
                const colors = {
                  urgent: "red",
                  high: "orange",
                  medium: "gold",
                  low: "green",
                };
                return (
                  <div
                    key={p}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Tag color={colors[p]}>{t(`tasks.priority.${p}`)}</Tag>
                    <strong>{priorityCounts[p]}</strong>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Team workload */}
        <Col xs={24}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: "#5b6bc1" }} />
                {t("tasks.progress.teamWorkload")}
              </Space>
            }
            size="small"
          >
            {topAssignees.length > 0 ? (
              <Flex vertical>
                {topAssignees.map(([userId, data], idx) => (
                  <Flex
                    key={userId}
                    align="center"
                    justify="space-between"
                    style={{ padding: "6px 0" }}
                  >
                    <Flex align="center" gap={12}>
                      <Avatar
                        size={32}
                        style={{
                          backgroundColor:
                            avatarColors[idx % avatarColors.length],
                          fontSize: 12,
                        }}
                      >
                        {data.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </Avatar>
                      <Flex vertical>
                        <Text style={{ fontSize: 13 }}>{data.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
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
                      strokeColor="#c9a38c"
                      strokeWidth={8}
                    />
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t("tasks.progress.noAssignees")}
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Upcoming milestones */}
      {upcomingMilestones.length > 0 && (
        <Card
          title={
            <Space>
              <FlagOutlined style={{ color: "#F59E0B" }} />
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
                  style={{ padding: "8px 0" }}
                >
                  <Flex align="flex-start" gap={12}>
                    <FlagOutlined style={{ color: "#F59E0B", fontSize: 18 }} />
                    <Flex vertical>
                      <Text>{milestone.title}</Text>
                      <Space size={4}>
                        <Tag
                          style={{
                            borderColor: milestone.category_color,
                            color: milestone.category_color,
                            margin: 0,
                          }}
                        >
                          {milestone.category_name}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
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
