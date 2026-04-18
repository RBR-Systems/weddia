"use client";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Calendar,
  Badge,
  Tooltip,
  Typography,
  Flex,
  Tag,
  Empty,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency } from "@/utils/formatters.utils";
import { getPaymentStatus } from "../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../models/budget.models";
import calStyles from "./PaymentCalendar.module.css";

const { Text } = Typography;

export default function PaymentCalendar() {
  const { t } = useTranslation();
  const PAYMENT_STATUS = getPaymentStatus();
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
          <Flex vertical>
            {expenses.map((item) => (
              <Flex key={item.expense_id} justify="space-between" className={calStyles.tooltipItem}>
                <Text className={calStyles.tooltipText}>{item.description}</Text>
                <Text className={calStyles.tooltipAmount}>
                  {formatCurrency(item.amount, state.currency)}
                </Text>
              </Flex>
            ))}
          </Flex>
        }
      >
        <ul className={calStyles.calendarList}>
          {expenses.slice(0, 3).map((expense) => (
            <li key={expense.expense_id} className={calStyles.calendarListItem}>
              <Badge
                status={getStatusBadge(expense.payment_status)}
                text={
                  <Text className={calStyles.calendarBadgeText} ellipsis>
                    {expense.description}
                  </Text>
                }
              />
            </li>
          ))}
          {expenses.length > 3 && (
            <li>
              <Text type="secondary" className={calStyles.calendarMoreText}>
                {t("common.nMore", { count: expenses.length - 3 })}
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
      <div className={calStyles.monthSummary}>
        <Text strong>{formatCurrency(total, state.currency)}</Text>
        <br />
        <Text type="secondary" className={calStyles.monthDetail}>
          {t("paymentCalendar.paidCount", { paid: paidCount, total: monthExpenses.length })}
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
        title={t("paymentCalendar.upcomingPayments")}
        className={calStyles.upcomingCard}
      >
        {upcomingPayments.length > 0 ? (
          <Flex vertical>
            {upcomingPayments.map((item: Expense) => {
              const statusConfig = Object.values(PAYMENT_STATUS).find(
                (s) => s.value === item.payment_status,
              );
              return (
                <Flex key={item.expense_id} align="center" justify="space-between" style={{ padding: "8px 0" }}>
                  <Flex vertical>
                    <Text strong>{item.description}</Text>
                    <Text type="secondary">
                      {t("paymentCalendar.due", { date: dayjs(item.expense_date).format("MMM D, YYYY") })}
                    </Text>
                  </Flex>
                  <div className={calStyles.paymentAmount}>
                    <Text strong>{formatCurrency(item.amount, state.currency)}</Text>
                    <br />
                    <Tag color={statusConfig?.color}>{statusConfig?.label}</Tag>
                  </div>
                </Flex>
              );
            })}
          </Flex>
        ) : (
          <Empty description={t("paymentCalendar.noUpcoming")} />
        )}
      </Card>

      <Card title={t("paymentCalendar.paymentCalendar")}>
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
