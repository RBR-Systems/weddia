"use client";
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  App, Table, Button, Switch, Input, Tag, Avatar, Space, Typography, Row, Col,
} from "antd";
import { ShopOutlined, EyeOutlined } from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters.utils";
import Card from "@/shared/components/Card/Card";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import type { Vendor } from "../../models/budget.models";
import type { ColumnsType } from "antd/es/table";
import styles from "./vendor-list.module.css";

const { Search } = Input;
const { Text } = Typography;

interface EventVendorsProps {
  onViewVendor?: (vendor: Vendor) => void;
}

export default function EventVendors({ onViewVendor }: EventVendorsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { state, assignVendor, unassignVendor } = useBudget();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(
    () =>
      state.vendors.filter((v: Vendor) =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [state.vendors, searchTerm],
  );

  const assignedCount = state.eventVendorIds.length;

  const totalEventSpending = useMemo(() => {
    const assignedNames = new Set(
      state.vendors
        .filter((v: Vendor) => state.eventVendorIds.includes(v.vendor_id))
        .map((v: Vendor) => v.name),
    );
    return state.expenses
      .filter((e: { vendor_name?: string }) => e.vendor_name && assignedNames.has(e.vendor_name))
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
  }, [state.expenses, state.vendors, state.eventVendorIds]);

  const columns: ColumnsType<Vendor> = [
    {
      title: t("vendorList.columns.vendor"),
      key: "vendor",
      render: (_, record) => (
        <Space>
          <Avatar className={styles.avatarBlue} icon={<ShopOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className={styles.smallText}>
              {record.category}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t("vendorList.columns.status"),
      key: "status",
      render: (_, record) => (
        <Tag color={record.is_active !== false ? "green" : "default"}>
          {record.is_active !== false ? t("vendorList.active") : t("vendorList.inactive")}
        </Tag>
      ),
    },
    {
      title: t("vendorList.columns.expenses"),
      key: "expense_count",
      align: "center",
      render: (_, record) => record.expense_count ?? 0,
    },
    {
      title: t("vendorList.columns.totalSpent"),
      key: "total_spent",
      align: "right",
      render: (_, record) =>
        formatCurrency(record.total_spent ?? 0, state.currency),
    },
    {
      title: t("eventVendors.assigned"),
      key: "assigned",
      align: "center",
      render: (_, record) => (
        <Switch
          checked={state.eventVendorIds.includes(record.vendor_id)}
          onChange={(checked) => {
            if (!checked) {
              const hasExpenses = state.expenses.some(
                (e: { vendor_name?: string }) => e.vendor_name === record.name,
              );
              if (hasExpenses) {
                message.warning(t("eventVendors.cannotUnassign"));
                return;
              }
            }
            if (checked) { assignVendor(record.vendor_id); } else { unassignVendor(record.vendor_id); }
          }}
        />
      ),
    },
    {
      title: t("vendorList.columns.actions"),
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onViewVendor?.(record)}
        />
      ),
    },
  ];

  return (
    <>
      <Row gutter={16} className={styles.rowSpacing}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title={t("eventVendors.totalCatalog")}
              value={state.vendors.length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title={t("eventVendors.assignedToEvent")}
              value={assignedCount}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title={t("eventVendors.eventSpending")}
              value={totalEventSpending}
              formatter={(v) => formatCurrency(Number(v), state.currency)}
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
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="vendor_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: t("eventVendors.emptyText") }}
        />
      </Card>
    </>
  );
}
