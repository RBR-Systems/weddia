"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { App, Table, Button, Switch, Input, Tag, Avatar, Space, Typography, Row, Col } from "antd";
import { ShopOutlined, EyeOutlined, LinkOutlined, DollarOutlined } from "@ant-design/icons";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import Card from "@/shared/components/Card/Card";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import type { Vendor, VendorEventStatus } from "../../../models/budget.models";
import type { ColumnsType } from "antd/es/table";
import { VENDOR_TABLE_PAGE_SIZE } from "../../../constants/budget.constants";
import styles from "../vendor-list.module.css";

const { Search } = Input;
const { Text } = Typography;

const VENDOR_TABLE_PAGINATION = { pageSize: VENDOR_TABLE_PAGE_SIZE } as const;

const CONTRACT_STATUS_COLOR: Record<VendorEventStatus, string> = {
  active:     "processing",
  contracted: "success",
  cancelled:  "error",
  completed:  "default",
};

interface EventVendorsProps {
  readonly onViewVendor?: (vendor: Vendor) => void;
}

export default function EventVendors({ onViewVendor }: EventVendorsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { state, assignVendor, unassignVendor } = useBudget();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(
    () => state.vendors.filter((v: Vendor) => v.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [state.vendors, searchTerm],
  );

  const assignedCount = state.vendorEvents.length;

  const totalEventSpending = useMemo(() => {
    const assignedIds = new Set(state.vendorEvents.map((ve) => ve.vendor_id));
    const assignedNames = new Set(
      state.vendors
        .filter((v: Vendor) => assignedIds.has(v.vendor_id))
        .map((v: Vendor) => v.name),
    );
    return state.expenses
      .filter((e: { vendor_name?: string }) => e.vendor_name && assignedNames.has(e.vendor_name))
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
  }, [state.expenses, state.vendors, state.vendorEvents]);

  const columns: ColumnsType<Vendor> = [
    {
      title: t("vendorList.columns.vendor"),
      key: "vendor",
      minWidth: 180,
      render: (_, record) => (
        <Space>
          <Avatar className={styles.avatarBlue} icon={<ShopOutlined />} size={36} />
          <div className={styles.vendorInfo}>
            <div className={styles.vendorName}>{record.name}</div>
            <div className={styles.smallText}>{record.category || "—"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t("vendorList.columns.status"),
      key: "status",
      width: 100,
      render: (_, record) => {
        const isActive = record.is_active ?? true;
        return (
          <Tag color={isActive ? "success" : "default"} style={{ margin: 0 }}>
            {isActive ? t("vendorList.active") : t("vendorList.inactive")}
          </Tag>
        );
      },
    },
    {
      title: t("vendorList.columns.expenses"),
      key: "expense_count",
      align: "center",
      width: 90,
      render: (_, record) => (
        <Text type="secondary">{record.expense_count ?? 0}</Text>
      ),
    },
    {
      title: t("vendorList.columns.totalSpent"),
      key: "total_spent",
      align: "right",
      width: 120,
      render: (_, record) => (
        <Text strong>{formatCurrency(record.total_spent ?? 0, state.currency)}</Text>
      ),
      sorter: (a, b) => (a.total_spent ?? 0) - (b.total_spent ?? 0),
    },
    {
      title: t("eventVendors.contractStatus"),
      key: "contract_status",
      align: "center",
      width: 110,
      render: (_, record) => {
        const ve = state.vendorEvents.find((v) => v.vendor_id === record.vendor_id);
        if (!ve) return <Text type="secondary">—</Text>;
        return (
          <Tag color={CONTRACT_STATUS_COLOR[ve.status]} style={{ margin: 0 }}>
            {t(`eventVendors.contractStatusValues.${ve.status}`)}
          </Tag>
        );
      },
    },
    {
      title: t("eventVendors.assigned"),
      key: "assigned",
      align: "center",
      width: 90,
      render: (_, record) => (
        <Switch
          checked={state.vendorEvents.some((ve) => ve.vendor_id === record.vendor_id)}
          size="small"
          onChange={(checked) => {
            if (checked) { assignVendor(record.vendor_id); return; }
            const hasExpenses = state.expenses.some(
              (e: { vendor_name?: string }) => e.vendor_name === record.name,
            );
            if (hasExpenses) { message.warning(t("eventVendors.cannotUnassign")); return; }
            unassignVendor(record.vendor_id);
          }}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewVendor?.(record)}
        />
      ),
    },
  ];

  return (
    <>
      <Row gutter={[12, 12]} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <Card size="small" className={styles.statCard} style={{ "--accent-color": "var(--primary)" } as React.CSSProperties}>
            <Statistic
              title={t("eventVendors.totalCatalog")}
              value={state.vendors.length}
              prefix={<ShopOutlined style={{ fontSize: 13, marginRight: 4, color: "var(--primary)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className={styles.statCard} style={{ "--accent-color": "var(--status-in-progress)" } as React.CSSProperties}>
            <Statistic
              title={t("eventVendors.assignedToEvent")}
              value={assignedCount}
              prefix={<LinkOutlined style={{ fontSize: 13, marginRight: 4, color: "var(--status-in-progress)" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" className={styles.statCard} style={{ "--accent-color": "var(--status-completed)" } as React.CSSProperties}>
            <Statistic
              title={t("eventVendors.eventSpending")}
              value={totalEventSpending}
              prefix={<DollarOutlined style={{ fontSize: 13, marginRight: 4, color: "var(--status-completed)" }} />}
              formatter={(v: number | string) => formatCurrency(Number(v), state.currency)}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t("eventVendors.title")}
        extra={
          <Search
            placeholder={t("vendorList.searchPlaceholder")}
            allowClear
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchWidth}
            size="small"
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="vendor_id"
          pagination={VENDOR_TABLE_PAGINATION}
          scroll={{ x: 600 }}
          locale={{ emptyText: t("eventVendors.emptyText") }}
          size="middle"
        />
      </Card>
    </>
  );
}
