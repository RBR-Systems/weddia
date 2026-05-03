"use client";

import { useState, useMemo, useCallback } from "react";
import { App, Card, Table, Button, Input, Select, Space, Popconfirm, Row, Col } from "antd";
import { PlusOutlined, DeleteOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/shared/utils/formatters.utils";
import { getPaymentStatus, EMPTY_VALUE_DISPLAY, EXPENSE_TABLE_PAGE_SIZE, EXPENSE_TABLE_SCROLL } from "../../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../../models/budget.models";
import CategoryTag from "../../common/CategoryTag/CategoryTag";
import { PaymentStatusTag } from "../../common/PaymentStatusTag/PaymentStatusTag";
import expenseStyles from "./ExpenseList.module.css";
import { useTranslation } from "react-i18next";

const { Search } = Input;

interface ExpenseListProps {
  readonly onAddExpense?: () => void;
  readonly onViewExpense?: (expense: Expense) => void;
}

export function ExpenseList({
  onAddExpense,
  onViewExpense,
}: ExpenseListProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { state, deleteExpense } = useBudget();
  const PAYMENT_STATUS = getPaymentStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter((expense: Expense) => {
      const matchesSearch =
        (expense.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !categoryFilter || expense.category_id === categoryFilter;
      const matchesStatus =
        !statusFilter || expense.payment_status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [state.expenses, searchTerm, categoryFilter, statusFilter]);

  const handleDelete = useCallback((expenseId: string) => {
    deleteExpense(expenseId);
    message.success(t("expenseList.expenseDeleted"));
  }, [deleteExpense, message, t]);

  const columns = useMemo((): ColumnsType<Expense> => [
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
      render: (amount: number, record: Expense) =>
        formatCurrency(amount, record.currency ?? state.currency),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: t("expenseModal.currency"),
      dataIndex: "currency",
      key: "currency",
      width: 80,
      render: (currency: string) => currency || state.currency,
    },
    {
      title: t("common.category"),
      dataIndex: "category_id",
      key: "category_id",
      render: (categoryId: string) => {
        const cat = state.categories.find(
          (c: { id: string; color?: string }) => c.id === categoryId,
        );
        return <CategoryTag color={cat?.color}>{cat?.name ?? categoryId}</CategoryTag>;
      },
    },
    {
      title: t("common.vendor"),
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (vendor: string) => vendor || EMPTY_VALUE_DISPLAY,
    },
    {
      title: t("expenseModal.methodOfPayment"),
      dataIndex: "methodOfPayment",
      key: "methodOfPayment",
      render: (method: string) => method || EMPTY_VALUE_DISPLAY,
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
      render: (status: PaymentStatus) => <PaymentStatusTag status={status} />,
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
  ], [t, state.currency, state.categories, onViewExpense, handleDelete]);

  const paginationConfig = useMemo((): TablePaginationConfig => ({
    pageSize: EXPENSE_TABLE_PAGE_SIZE,
    showSizeChanger: true,
    showTotal: (total, range) =>
      t("expenseList.paginationTotal", { start: range[0], end: range[1], total }),
  }), [t]);

  const categoryFilterOptions = useMemo(
    () => state.categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })),
    [state.categories],
  );

  const statusFilterOptions = useMemo(
    () => Object.values(PAYMENT_STATUS).map((s) => ({ value: s.value, label: s.label })),
    // PAYMENT_STATUS labels depend on the active language
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const tableLocale = useMemo(
    () => ({ emptyText: t("expenseList.noExpenses") }),
    [t],
  );

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
              options={categoryFilterOptions}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder={t("expenseList.filterByStatus")}
              allowClear
              className="u-full-width"
              onChange={(value) => setStatusFilter(value)}
              options={statusFilterOptions}
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
        scroll={EXPENSE_TABLE_SCROLL}
        locale={tableLocale}
      />
    </Card>
  );
}

