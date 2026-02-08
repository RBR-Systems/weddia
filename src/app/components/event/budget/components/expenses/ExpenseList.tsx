"use client";
import React, { useState, useMemo } from "react";
import {
  App,
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
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
import { getPaymentStatus } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";
import CategoryTag from "../shared/CategoryTag";
import expenseStyles from "./ExpenseList.module.css";
import { useTranslation } from "react-i18next";

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
  const { message } = App.useApp();
  const { t } = useTranslation();
  const PAYMENT_STATUS = getPaymentStatus();
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
    message.success(t("expenseList.expenseDeleted"));
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
      title: t("common.description"),
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: t("common.amount"),
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatCurrency(amount, state.currency),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: t("common.category"),
      dataIndex: "category_id",
      key: "category_id",
      render: (categoryId: string) => {
        const cat = state.categories.find(
          (c: { id: string; color?: string }) => c.id === categoryId,
        );
        return <CategoryTag color={cat?.color}>{getCategoryName(categoryId)}</CategoryTag>;
      },
    },
    {
      title: t("common.vendor"),
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (vendor: string) => vendor || "—",
    },
    {
      title: t("common.date"),
      dataIndex: "expense_date",
      key: "expense_date",
      render: (date: string) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    },
    {
      title: t("common.status"),
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: PaymentStatus) => getPaymentStatusTag(status),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewExpense?.(record)}
          />
          <Popconfirm
            title={t("expenseList.deleteConfirm")}
            onConfirm={() => handleDelete(record.expense_id)}
            okText={t("common.yes")}
            cancelText={t("common.no")}
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
    showTotal: (total, range) => t("expenseList.paginationTotal", { start: range[0], end: range[1], total }),
  };

  return (
    <Card
      title={t("expenseList.title", { count: filteredExpenses.length })}
      extra={
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {t("common.filters")}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddExpense}>
            {t("expenseList.addExpense")}
          </Button>
        </Space>
      }
    >
      {showFilters && (
        <Row gutter={16} className={expenseStyles.filterRow}>
          <Col xs={24} sm={8}>
            <Search
              placeholder={t("expenseList.searchPlaceholder")}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder={t("expenseList.filterByCategory")}
              allowClear
              className="u-full-width"
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
              placeholder={t("expenseList.filterByStatus")}
              allowClear
              className="u-full-width"
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
        locale={{ emptyText: t("expenseList.noExpenses") }}
      />
    </Card>
  );
}
