"use client";
import React, { useMemo } from "react";
import {
  Card,
  Calendar,
  Badge,
  Tooltip,
  Typography,
  List,
  Tag,
  Empty,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters";
import { PAYMENT_STATUS } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../types/budget.types";

const { Text } = Typography;

export default function PaymentCalendar() {
  const { state } = useBudget();

  const expensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>();
    state.expenses.forEach((expense: Expense) => {
      const dateKey = expense.expense_date;
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, expense]);
    });
    return map;
  }, [state.expenses]);

  const getStatusBadge = (status: PaymentStatus) => {
    const config = Object.values(PAYMENT_STATUS).find(
      (s) => s.value === status,
    );
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "overdue":
        return "error";
      case "partial":
        return "processing";
      default:
        return "default";
    }
  };

  const dateCellRender = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    const expenses = expensesByDate.get(dateKey);

    if (!expenses || expenses.length === 0) return null;

    return (
      <Tooltip
        title={
          <List
            size="small"
            dataSource={expenses}
            renderItem={(item) => (
              <List.Item style={{ padding: "4px 0", border: "none" }}>
                <Text style={{ color: "#fff" }}>{item.description}</Text>
                <Text style={{ color: "#fff", marginLeft: 8 }}>
                  {formatCurrency(item.amount, state.currency)}
                </Text>
              </List.Item>
            )}
          />
        }
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {expenses.slice(0, 3).map((expense) => (
            <li key={expense.expense_id} style={{ marginBottom: 2 }}>
              <Badge
                status={getStatusBadge(expense.payment_status)}
                text={
                  <Text style={{ fontSize: 10 }} ellipsis>
                    {expense.description}
                  </Text>
                }
              />
            </li>
          ))}
          {expenses.length > 3 && (
            <li>
              <Text type="secondary" style={{ fontSize: 10 }}>
                +{expenses.length - 3} more
              </Text>
            </li>
          )}
        </ul>
      </Tooltip>
    );
  };

  const monthCellRender = (date: Dayjs) => {
    const month = date.month();
    const year = date.year();

    const monthExpenses = state.expenses.filter((e: Expense) => {
      const d = dayjs(e.expense_date);
      return d.month() === month && d.year() === year;
    });

    if (monthExpenses.length === 0) return null;

    const total = monthExpenses.reduce(
      (sum: number, e: Expense) => sum + e.amount,
      0,
    );
    const paidCount = monthExpenses.filter(
      (e: Expense) => e.payment_status === "paid",
    ).length;

    return (
      <div style={{ textAlign: "center" }}>
        <Text strong>{formatCurrency(total, state.currency)}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {paidCount}/{monthExpenses.length} paid
        </Text>
      </div>
    );
  };

  // Get upcoming payments (next 7 days)
  const upcomingPayments = useMemo(() => {
    const today = dayjs();
    const nextWeek = today.add(7, "day");

    return state.expenses
      .filter((e: Expense) => {
        const date = dayjs(e.expense_date);
        return (
          e.payment_status !== "paid" &&
          date.isAfter(today.subtract(1, "day")) &&
          date.isBefore(nextWeek)
        );
      })
      .sort(
        (a: Expense, b: Expense) =>
          new Date(a.expense_date).getTime() -
          new Date(b.expense_date).getTime(),
      );
  }, [state.expenses]);

  return (
    <div>
      <Card
        title="Upcoming Payments (Next 7 Days)"
        style={{ marginBottom: 16 }}
      >
        {upcomingPayments.length > 0 ? (
          <List
            dataSource={upcomingPayments}
            renderItem={(item: Expense) => {
              const statusConfig = Object.values(PAYMENT_STATUS).find(
                (s) => s.value === item.payment_status,
              );
              return (
                <List.Item>
                  <List.Item.Meta
                    title={item.description}
                    description={`Due: ${dayjs(item.expense_date).format("MMM D, YYYY")}`}
                  />
                  <div style={{ textAlign: "right" }}>
                    <Text strong>
                      {formatCurrency(item.amount, state.currency)}
                    </Text>
                    <br />
                    <Tag color={statusConfig?.color}>{statusConfig?.label}</Tag>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="No upcoming payments" />
        )}
      </Card>

      <Card title="Payment Calendar">
        <Calendar
          cellRender={(date, info) => {
            if (info.type === "date") return dateCellRender(date);
            if (info.type === "month") return monthCellRender(date);
            return null;
          }}
        />
      </Card>
    </div>
  );
}
