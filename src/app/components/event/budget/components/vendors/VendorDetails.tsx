"use client";
import React from "react";
import {
  Drawer,
  Descriptions,
  Typography,
  Space,
  Divider,
  Table,
  Tag,
  Row,
  Col,
  Avatar,
  Empty,
} from "antd";
import { ShopOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import Card from "@/app/common/Card/card";
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { PAYMENT_STATUS } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";
import type { Vendor } from "./VendorList";
import vendorStyles from "./VendorDetails.module.css";

const { Title, Text } = Typography;

interface VendorDetailsProps {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
}

export default function VendorDetails({
  vendor,
  open,
  onClose,
}: VendorDetailsProps) {
  const { state } = useBudget();

  if (!vendor) return null;

  const vendorExpenses = state.expenses.filter(
    (e: Expense) => e.vendor_name === vendor.name,
  );

  const paidAmount = vendorExpenses
    .filter((e: Expense) => e.payment_status === "paid")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const pendingAmount = vendorExpenses
    .filter((e: Expense) => e.payment_status === "pending")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const expenseColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatCurrency(amount, state.currency),
    },
    {
      title: "Date",
      dataIndex: "expense_date",
      key: "expense_date",
      render: (date: string) => formatDate(date),
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: PaymentStatus) => {
        const config = Object.values(PAYMENT_STATUS).find(
          (s) => s.value === status,
        );
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
  ];

  return (
    <Drawer
      title="Vendor Details"
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
    >
      <Space direction="vertical" className={vendorStyles.fullWidth} size="large">
        <Space>
          <Avatar
            size={64}
            className={vendorStyles.vendorAvatar}
            icon={<ShopOutlined />}
          />
          <div>
            <Title level={4} className={vendorStyles.vendorName}>
              {vendor.name}
            </Title>
            <Tag color={vendor.status === "active" ? "green" : "default"}>
              {vendor.status}
            </Tag>
          </div>
        </Space>

        <Descriptions column={1} size="small">
          {vendor.contact_name && (
            <Descriptions.Item label="Contact">
              {vendor.contact_name}
            </Descriptions.Item>
          )}
          {vendor.email && (
            <Descriptions.Item label="Email">
              <MailOutlined /> {vendor.email}
            </Descriptions.Item>
          )}
          {vendor.phone && (
            <Descriptions.Item label="Phone">
              <PhoneOutlined /> {vendor.phone}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Category">
            {vendor.category}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Total Spent"
                value={vendor.total_spent}
                formatter={(value) =>
                  formatCurrency(Number(value), state.currency)
                }
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Paid"
                value={paidAmount}
                className={vendorStyles.paidValue}
                formatter={(value) =>
                  formatCurrency(Number(value), state.currency)
                }
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Pending"
                value={pendingAmount}
                className={vendorStyles.pendingValue}
                formatter={(value) =>
                  formatCurrency(Number(value), state.currency)
                }
              />
            </Card>
          </Col>
        </Row>

        <Divider orientation="horizontal">
          Expenses ({vendorExpenses.length})
        </Divider>

        {vendorExpenses.length > 0 ? (
          <Table
            columns={expenseColumns}
            dataSource={vendorExpenses}
            rowKey="expense_id"
            size="small"
            pagination={{ pageSize: 5 }}
          />
        ) : (
          <Empty description="No expenses from this vendor" />
        )}
      </Space>
    </Drawer>
  );
}
