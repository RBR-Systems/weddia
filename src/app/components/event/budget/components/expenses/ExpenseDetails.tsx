"use client";
import React from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Typography,
  Space,
  Divider,
  Button,
  Image,
  Empty,
  Timeline,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useBudget } from "../../contexts/BudgetContext";
import { PAYMENT_STATUS } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";

const { Title, Text } = Typography;

interface ExpenseDetailsProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
}

export default function ExpenseDetails({
  expense,
  open,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailsProps) {
  const { state } = useBudget();

  if (!expense) return null;

  const category = state.categories.find(
    (c: { id: string }) => c.id === expense.category_id,
  );

  const getStatusTag = (status: PaymentStatus) => {
    const config = Object.values(PAYMENT_STATUS).find(
      (s) => s.value === status,
    );
    return <Tag color={config?.color}>{config?.label}</Tag>;
  };

  return (
    <Drawer
      title={
        <Space>
          <span>Expense Details</span>
          {getStatusTag(expense.payment_status)}
        </Space>
      }
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit?.(expense)}>
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              onDelete?.(expense.expense_id);
              onClose();
            }}
          >
            Delete
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            {expense.description}
          </Title>
          <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
            {formatCurrency(expense.amount, state.currency)}
          </Title>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Category">
            <Tag color={category?.color}>
              {category?.name || expense.category_id}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Vendor">
            {expense.vendor_name || "Not specified"}
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {formatDate(expense.expense_date)}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            {getStatusTag(expense.payment_status)}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="horizontal">Receipts</Divider>

        {expense.receipt_urls && expense.receipt_urls.length > 0 ? (
          <Image.PreviewGroup>
            <Space wrap>
              {expense.receipt_urls.map((url, index) => (
                <Image
                  key={index}
                  width={100}
                  height={100}
                  src={url}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9444"
                  style={{ objectFit: "cover", borderRadius: 4 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <Empty
            image={
              <FileImageOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
            }
            description="No receipts attached"
          />
        )}

        <Divider orientation="horizontal">Activity</Divider>

        <Timeline
          items={[
            {
              color: "green",
              children: `Expense created on ${formatDate(expense.expense_date)}`,
            },
            {
              color: expense.payment_status === "paid" ? "green" : "gray",
              children:
                expense.payment_status === "paid"
                  ? "Payment completed"
                  : "Awaiting payment",
            },
          ]}
        />
      </Space>
    </Drawer>
  );
}
