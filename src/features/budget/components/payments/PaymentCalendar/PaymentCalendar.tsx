"use client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, Calendar, Badge, Tooltip, Typography, Flex, Tag, Empty } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency } from "@/shared/utils/formatters.utils";
import { getPaymentStatus, UPCOMING_PAYMENT_DAYS, CALENDAR_CELL_MAX_ITEMS } from "../../../constants/budget.constants";
import { getPaymentStatusBadge } from "../../../utils/budget.utils";
import type { Expense } from "../../../models/budget.models";
import calStyles from "./PaymentCalendar.module.css";

const { Text } = Typography;

export const PaymentCalendar = () => {
  const { t } = useTranslation();
  const PAYMENT_STATUS = getPaymentStatus();
  const { state } = useBudget();

  const expensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>();
    state.expenses.forEach((expense: Expense) => {
      const existing = map.get(expense.expense_date) || [];
      map.set(expense.expense_date, [...existing, expense]);
    });
    return map;
  }, [state.expenses]);

  const upcomingPayments = useMemo(() => {
    const today = dayjs();
    const nextWeek = today.add(UPCOMING_PAYMENT_DAYS, "day");

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
          new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
      );
  }, [state.expenses]);

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
          {expenses.slice(0, CALENDAR_CELL_MAX_ITEMS).map((expense) => (
            <li key={expense.expense_id} className={calStyles.calendarListItem}>
              <Badge
                status={getPaymentStatusBadge(expense.payment_status)}
                text={
                  <Text className={calStyles.calendarBadgeText} ellipsis>
                    {expense.description}
                  </Text>
                }
              />
            </li>
          ))}
          {expenses.length > CALENDAR_CELL_MAX_ITEMS && (
            <li>
              <Text type="secondary" className={calStyles.calendarMoreText}>
                {t("common.nMore", { count: expenses.length - CALENDAR_CELL_MAX_ITEMS })}
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

    const total = monthExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
    const paidCount = monthExpenses.filter((e: Expense) => e.payment_status === "paid").length;

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

  const cellRender = (date: Dayjs, info: { type: string }) => {
    if (info.type === "date") return dateCellRender(date);
    if (info.type === "month") return monthCellRender(date);
    return null;
  };

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
                <Flex key={item.expense_id} align="center" justify="space-between" className={calStyles.upcomingPaymentItem}>
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
        <Calendar cellRender={cellRender} />
      </Card>
    </div>
  );
};

