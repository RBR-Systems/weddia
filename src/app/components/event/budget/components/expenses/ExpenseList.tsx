"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { PAYMENT_STATUS } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";

const { Search } = Input;
const { RangePicker } = DatePicker;

interface ExpenseListProps {
  onAddExpense?: () => void;
  onViewExpense?: (expense: Expense) => void;
}

export default function ExpenseList({
  onAddExpense,
  onViewExpense,
}: ExpenseListProps) {
  const { state, deleteExpense } = useBudget();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter((expense: Expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !categoryFilter || expense.category_id === categoryFilter;
      const matchesStatus =
        !statusFilter || expense.payment_status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [state.expenses, searchTerm, categoryFilter, statusFilter]);

  const handleDelete = (expenseId: string) => {
    deleteExpense(expenseId);
    message.success("Expense deleted");
  };

  const getPaymentStatusTag = (status: PaymentStatus) => {
    const config = Object.values(PAYMENT_STATUS).find(
      (s) => s.value === status,
    );
    return (
      <Tag color={config?.color || "default"}>{config?.label || status}</Tag>
    );
  };

  const getCategoryName = (categoryId: string) => {
    const cat = state.categories.find(
      (c: { id: string }) => c.id === categoryId,
    );
    return cat?.name || categoryId;
  };

  const columns: ColumnsType<Expense> = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatCurrency(amount, state.currency),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Category",
      dataIndex: "category_id",
      key: "category_id",
      render: (categoryId: string) => {
        const cat = state.categories.find(
          (c: { id: string; color?: string }) => c.id === categoryId,
        );
        return <Tag color={cat?.color}>{getCategoryName(categoryId)}</Tag>;
      },
    },
    {
      title: "Vendor",
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (vendor: string) => vendor || "—",
    },
    {
      title: "Date",
      dataIndex: "expense_date",
      key: "expense_date",
      render: (date: string) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: PaymentStatus) => getPaymentStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewExpense?.(record)}
          />
          <Popconfirm
            title="Delete this expense?"
            onConfirm={() => handleDelete(record.expense_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const paginationConfig: TablePaginationConfig = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} expenses`,
  };

  return (
    <Card
      title={`Expenses (${filteredExpenses.length})`}
      extra={
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddExpense}>
            Add Expense
          </Button>
        </Space>
      }
    >
      {showFilters && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search expenses..."
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by category"
              allowClear
              style={{ width: "100%" }}
              onChange={(value) => setCategoryFilter(value)}
              options={state.categories.map(
                (c: { id: string; name: string }) => ({
                  value: c.id,
                  label: c.name,
                }),
              )}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: "100%" }}
              onChange={(value) => setStatusFilter(value)}
              options={Object.values(PAYMENT_STATUS).map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </Col>
        </Row>
      )}

      <Table
        columns={columns}
        dataSource={filteredExpenses}
        rowKey="expense_id"
        pagination={paginationConfig}
        loading={state.isLoading}
        scroll={{ x: 800 }}
        locale={{ emptyText: "No expenses recorded yet" }}
      />
    </Card>
  );
}
