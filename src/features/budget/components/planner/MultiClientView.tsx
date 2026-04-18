"use client";
import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Progress,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  
  Typography,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatCurrency } from "@/utils/formatters.utils";
import { useTranslation } from "react-i18next";
import { CHART_COLORS, SEMANTIC_CHART_COLORS } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";

const { Search } = Input;
const { Text, Title } = Typography;
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";

interface ClientBudget {
  id: string;
  clientName: string;
  partnerName?: string;
  weddingDate: string;
  totalBudget: number;
  totalSpent: number;
  status: "on_track" | "at_risk" | "over_budget" | "completed";
  lastUpdated: string;
  expenseCount: number;
}

// Mock data for multiple clients
const MOCK_CLIENTS: ClientBudget[] = [
  {
    id: "1",
    clientName: "Sarah & Michael",
    weddingDate: "2026-06-15",
    totalBudget: 50000,
    totalSpent: 35000,
    status: "on_track",
    lastUpdated: dayjs().subtract(1, "day").toISOString(),
    expenseCount: 24,
  },
  {
    id: "2",
    clientName: "Emily & James",
    weddingDate: "2026-08-20",
    totalBudget: 75000,
    totalSpent: 68000,
    status: "at_risk",
    lastUpdated: dayjs().subtract(2, "hours").toISOString(),
    expenseCount: 45,
  },
  {
    id: "3",
    clientName: "Jessica & David",
    weddingDate: "2026-04-10",
    totalBudget: 30000,
    totalSpent: 32500,
    status: "over_budget",
    lastUpdated: dayjs().subtract(3, "days").toISOString(),
    expenseCount: 18,
  },
  {
    id: "4",
    clientName: "Amanda & Chris",
    weddingDate: "2025-12-31",
    totalBudget: 45000,
    totalSpent: 44800,
    status: "completed",
    lastUpdated: dayjs().subtract(10, "days").toISOString(),
    expenseCount: 38,
  },
  {
    id: "5",
    clientName: "Rachel & Tom",
    weddingDate: "2026-09-05",
    totalBudget: 60000,
    totalSpent: 15000,
    status: "on_track",
    lastUpdated: dayjs().toISOString(),
    expenseCount: 8,
  },
];

const STATUS_CONFIG = {
  on_track: { label: "multiClientView.status.onTrack", color: "success" },
  at_risk: { label: "multiClientView.status.atRisk", color: "warning" },
  over_budget: { label: "multiClientView.status.overBudget", color: "error" },
  completed: { label: "multiClientView.status.completed", color: "default" },
};

interface MultiClientViewProps {
  onSelectClient?: (clientId: string) => void;
}

export default function MultiClientView({
  onSelectClient,
}: MultiClientViewProps) {
  const { t } = useTranslation();
  const [clients] = useState<ClientBudget[]>(MOCK_CLIENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.clientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { mode } = useTheme();
  const chartColors = CHART_COLORS[mode];
  const semantic = SEMANTIC_CHART_COLORS[mode];

  const totalManagedBudget = clients.reduce((sum, c) => sum + c.totalBudget, 0);
  const totalManagedSpent = clients.reduce((sum, c) => sum + c.totalSpent, 0);
  const activeClients = clients.filter((c) => c.status !== "completed").length;
  const atRiskClients = clients.filter(
    (c) => c.status === "at_risk" || c.status === "over_budget",
  ).length;

  const columns: ColumnsType<ClientBudget> = [
    {
      title: t("multiClientView.columns.client"),
      key: "client",
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: chartColors[0] }}>
            {record.clientName.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{record.clientName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <CalendarOutlined />{" "}
              {dayjs(record.weddingDate).format("MMM D, YYYY")}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t("common.budget"),
      key: "budget",
      render: (_, record) => (
        <div style={{ minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text>{formatCurrency(record.totalSpent, "USD")}</Text>
            <Text type="secondary">
              / {formatCurrency(record.totalBudget, "USD")}
            </Text>
          </div>
          <Progress
            percent={Math.min(
              Math.round((record.totalSpent / record.totalBudget) * 100),
              100,
            )}
            status={
              record.status === "over_budget"
                ? "exception"
                : record.status === "at_risk"
                  ? "normal"
                  : "success"
            }
            size="small"
            strokeColor={
              record.status === "over_budget"
                ? semantic.error
                : record.status === "at_risk"
                  ? semantic.warning
                  : semantic.success
            }
          />
        </div>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: keyof typeof STATUS_CONFIG) => {
        const config = STATUS_CONFIG[status];
        return <Tag color={config.color}>{t(config.label)}</Tag>;
      },
      filters: Object.entries(STATUS_CONFIG).map(([key, value]) => ({
        text: t(value.label),
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t("multiClientView.columns.expenses"),
      dataIndex: "expenseCount",
      key: "expenseCount",
      sorter: (a, b) => a.expenseCount - b.expenseCount,
    },
    {
      title: t("multiClientView.columns.daysUntil"),
      key: "daysUntil",
      render: (_, record) => {
        const days = dayjs(record.weddingDate).diff(dayjs(), "day");
        if (days < 0) return <Tag>{t("common.past")}</Tag>;
        if (days <= 30) return <Tag color="red">{days} days</Tag>;
        if (days <= 90) return <Tag color="orange">{days} days</Tag>;
        return <Text type="secondary">{days} days</Text>;
      },
      sorter: (a, b) =>
        dayjs(a.weddingDate).diff(dayjs()) - dayjs(b.weddingDate).diff(dayjs()),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onSelectClient?.(record.id)}
        >
          {t("common.view")}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("multiClientView.totalClients")}
              value={clients.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("multiClientView.activeWeddings")}
              value={activeClients}
              styles={{ content: { color: semantic.info } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("multiClientView.totalManaged")}
              value={totalManagedBudget}
              formatter={(value) => formatCurrency(Number(value), "USD")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={t("multiClientView.needsAttention")}
              value={atRiskClients}
              styles={{ content: { color: atRiskClients > 0 ? semantic.error : semantic.success } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t("multiClientView.clientBudgets")}
        extra={
          <Space>
            <Search
              placeholder={t("multiClientView.searchClients")}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder={t("multiClientView.filterByStatus")}
              allowClear
              style={{ width: 150 }}
              onChange={setStatusFilter}
              options={Object.entries(STATUS_CONFIG).map(([key, value]) => ({
                value: key,
                label: t(value.label),
              }))}
            />
            <Button type="primary" icon={<PlusOutlined />}>
              {t("multiClientView.addClient")}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredClients}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </>
  );
}

