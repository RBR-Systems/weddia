"use client";
import React, { useState, useMemo } from "react";
import {
  App,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  DatePicker,
  Row,
  Col,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import Card from "@/app/common/Card/card";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { PAYMENT_STATUS } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";
import payStyles from "./PaymentStatus.module.css";

const { Text } = Typography;
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";

export default function PaymentStatusManager() {
  const { message } = App.useApp();
  const { state, updateExpense } = useBudget();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all",
  );
  const [markPaidModal, setMarkPaidModal] = useState<Expense | null>(null);
  const [form] = Form.useForm();

  const filteredExpenses = useMemo(() => {
    if (statusFilter === "all") return state.expenses;
    return state.expenses.filter(
      (e: Expense) => e.payment_status === statusFilter,
    );
  }, [state.expenses, statusFilter]);

  const paidTotal = state.expenses
    .filter((e: Expense) => e.payment_status === "paid")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const pendingTotal = state.expenses
    .filter((e: Expense) => e.payment_status === "pending")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const overdueTotal = state.expenses
    .filter((e: Expense) => e.payment_status === "overdue")
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const handleMarkPaid = async () => {
    if (!markPaidModal) return;
    try {
      const values = await form.validateFields();
      updateExpense?.(markPaidModal.expense_id, {
        payment_status: "paid",
        payment_date: values.payment_date?.format("YYYY-MM-DD"),
      });
      message.success("Payment marked as paid");
      setMarkPaidModal(null);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  const handleStatusChange = (expense: Expense, newStatus: PaymentStatus) => {
    if (newStatus === "paid") {
      setMarkPaidModal(expense);
    } else {
      updateExpense?.(expense.expense_id, { payment_status: newStatus });
      message.success("Payment status updated");
    }
  };

  const columns: ColumnsType<Expense> = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className={payStyles.smallText}>
            {record.vendor_name || "No vendor"}
          </Text>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong>{formatCurrency(amount, state.currency)}</Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Due Date",
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
      render: (status: PaymentStatus, record) => {
        const config = Object.values(PAYMENT_STATUS).find(
          (s) => s.value === status,
        );
        return (
          <Select
            value={status}
            className={payStyles.statusSelectWidth}
            onChange={(value) => handleStatusChange(record, value)}
            options={Object.values(PAYMENT_STATUS).map((s) => ({
              value: s.value,
              label: (
                <Tag color={s.color} className={payStyles.tagNoMargin}>
                  {s.label}
                </Tag>
              ),
            }))}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.payment_status !== "paid" && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setMarkPaidModal(record)}
          >
            Mark Paid
          </Button>
        ),
    },
  ];

  return (
    <>
      <Row gutter={16} className={payStyles.statsRow}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Paid"
              value={paidTotal}
              className={payStyles.paidValue}
              prefix={<CheckCircleOutlined />}
              formatter={(value) =>
                formatCurrency(Number(value), state.currency)
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={pendingTotal}
              className={payStyles.pendingValue}
              prefix={<ClockCircleOutlined />}
              formatter={(value) =>
                formatCurrency(Number(value), state.currency)
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Overdue"
              value={overdueTotal}
              className={payStyles.overdueValue}
              prefix={<ExclamationCircleOutlined />}
              formatter={(value) =>
                formatCurrency(Number(value), state.currency)
              }
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Payment Tracking"
        extra={
          <Select
            value={statusFilter}
            className="u-full-width"
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              ...Object.values(PAYMENT_STATUS).map((s) => ({
                value: s.value,
                label: s.label,
              })),
            ]}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredExpenses}
          rowKey="expense_id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No payments to track" }}
        />
      </Card>

      <Modal
        title="Mark Payment as Paid"
        open={!!markPaidModal}
        onOk={handleMarkPaid}
        onCancel={() => {
          setMarkPaidModal(null);
          form.resetFields();
        }}
        okText="Confirm Payment"
      >
        {markPaidModal && (
          <Space direction="vertical" className={payStyles.fullWidth}>
            <div>
              <Text type="secondary">Expense:</Text>
              <div>
                <Text strong>{markPaidModal.description}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Amount:</Text>
              <div>
                <Text strong className={payStyles.confirmAmount}>
                  {formatCurrency(markPaidModal.amount, state.currency)}
                </Text>
              </div>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                name="payment_date"
                label="Payment Date"
                initialValue={dayjs()}
                rules={[{ required: true }]}
              >
                <DatePicker className="u-full-width" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </>
  );
}
