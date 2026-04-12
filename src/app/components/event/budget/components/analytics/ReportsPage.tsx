"use client";
import React, { useState } from "react";
import {
  App,
  Card,
  Row,
  Col,
  Button,
  Select,
  DatePicker,
  Space,
  Table,
  Divider,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Category, Expense } from "../../types/budget.types";
import reportStyles from "./ReportsPage.module.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
import Statistic from "@/app/common/AnimatedStatistic/AnimatedStatistic";

type ReportType = "summary" | "category" | "expense" | "vendor";

export default function ReportsPage() {
  const { message } = App.useApp();
  const { state } = useBudget();
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  const filteredExpenses = dateRange
    ? state.expenses.filter((e: Expense) => {
        const date = dayjs(e.expense_date);
        return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
      })
    : state.expenses;

  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = "";

    if (reportType === "expense") {
      csvContent = "Description,Amount,Category,Vendor,Date,Status\n";
      filteredExpenses.forEach((e: Expense) => {
        const cat = state.categories.find(
          (c: Category) => c.id === e.category_id,
        );
        csvContent += `"${e.description}",${e.amount},"${cat?.name || ""}","${e.vendor_name || ""}","${e.expense_date}","${e.payment_status}"\n`;
      });
    } else if (reportType === "category") {
      csvContent = "Category,Allocated,Spent,Remaining,Expenses\n";
      state.categories.forEach((c: Category) => {
        csvContent += `"${c.name}",${c.allocated},${c.spent},${c.allocated - c.spent},${c.expense_count || 0}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-report-${reportType}-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(t("reports.exportedCSV"));
  };

  const handlePrint = () => {
    window.print();
    message.success(t("reports.printDialogOpened"));
  };

  const summaryData = [
    { label: t("budgetStats.totalBudget"), value: state.summary?.total_budget || 0 },
    { label: t("budgetStats.totalSpent"), value: state.summary?.total_spent || 0 },
    { label: t("budgetStats.remaining"), value: state.summary?.total_remaining || 0 },
    {
      label: t("budgetStats.spentPercent"),
      value: `${state.summary?.percentage_spent || 0}%`,
      isPercent: true,
    },
  ];

  const categoryColumns: ColumnsType<Category> = [
    { title: t("common.category"), dataIndex: "name", key: "name" },
    {
      title: t("budgetCharts.allocated"),
      dataIndex: "allocated",
      key: "allocated",
      render: (v: number) => formatCurrency(v, state.currency),
      align: "right",
    },
    {
      title: t("budgetCharts.spent"),
      dataIndex: "spent",
      key: "spent",
      render: (v: number) => formatCurrency(v, state.currency),
      align: "right",
    },
    {
      title: t("budgetStats.remaining"),
      key: "remaining",
      render: (_, record) =>
        formatCurrency(record.allocated - record.spent, state.currency),
      align: "right",
    },
    {
      title: t("reports.usagePercent"),
      key: "usage",
      render: (_, record) =>
        record.allocated > 0
          ? `${parseFloat(((record.spent / record.allocated) * 100).toFixed(2))}%`
          : "0%",
      align: "center",
    },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    { title: t("common.description"), dataIndex: "description", key: "description" },
    {
      title: t("common.amount"),
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => formatCurrency(v, state.currency),
      align: "right",
    },
    {
      title: t("common.category"),
      dataIndex: "category_id",
      key: "category_id",
      render: (id: string) =>
        state.categories.find((c: Category) => c.id === id)?.name || id,
    },
    {
      title: t("common.vendor"),
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (v: string) => v || "—",
    },
    {
      title: t("common.date"),
      dataIndex: "expense_date",
      key: "expense_date",
      render: (v: string) => formatDate(v),
    },
    { title: t("common.status"), dataIndex: "payment_status", key: "payment_status" },
  ];

  return (
    <div className="reports-page">
      <Card
        title={t("reports.title")}
        extra={
          <Space>
            <Select
              value={reportType}
              onChange={setReportType}
              className={reportStyles.reportSelect}
              options={[
                { value: "summary", label: t("reports.summaryReport") },
                { value: "category", label: t("reports.categoryReport") },
                { value: "expense", label: t("reports.expenseReport") },
              ]}
            />
            <RangePicker
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
            />
            <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>
              {t("reports.exportCSV")}
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              {t("common.print")}
            </Button>
          </Space>
        }
      >
        {/* Summary Report */}
        {reportType === "summary" && (
          <>
            <Title level={4}>{t("reports.budgetSummary")}</Title>
            <Row gutter={16}>
              {summaryData.map((item, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <Card size="small">
                    <Statistic
                      title={item.label}
                      value={item.isPercent ? item.value : Number(item.value)}
                      formatter={(value) =>
                        item.isPercent
                          ? String(value)
                          : formatCurrency(Number(value), state.currency)
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <Divider />

            <Title level={5}>{t("reports.categoryBreakdown")}</Title>
            <Table
              columns={categoryColumns}
              dataSource={state.categories}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>{t("common.total")}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>
                        {formatCurrency(
                          state.categories.reduce(
                            (sum: number, c: Category) => sum + c.allocated,
                            0,
                          ),
                          state.currency,
                        )}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>
                        {formatCurrency(
                          state.categories.reduce(
                            (sum: number, c: Category) => sum + c.spent,
                            0,
                          ),
                          state.currency,
                        )}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong>
                        {formatCurrency(
                          state.summary?.total_remaining || 0,
                          state.currency,
                        )}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        )}

        {/* Category Report */}
        {reportType === "category" && (
          <>
            <Title level={4}>{t("reports.categoryReport")}</Title>
            <Table
              columns={categoryColumns}
              dataSource={state.categories}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </>
        )}

        {/* Expense Report */}
        {reportType === "expense" && (
          <>
            <Title level={4}>
              {t("reports.expenseReport")}
              {dateRange && (
                <Text type="secondary" className={reportStyles.dateRangeLabel}>
                  ({dateRange[0].format("MMM D")} -{" "}
                  {dateRange[1].format("MMM D, YYYY")})
                </Text>
              )}
            </Title>
            <Row gutter={16} className={reportStyles.expenseStatsRow}>
              <Col span={8}>
                <Statistic
                  title={t("reports.totalExpenses")}
                  value={filteredExpenses.length}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t("reports.totalAmount")}
                  value={filteredExpenses.reduce(
                    (sum: number, e: Expense) => sum + e.amount,
                    0,
                  )}
                  formatter={(value) =>
                    formatCurrency(Number(value), state.currency)
                  }
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t("reports.avgExpense")}
                  value={
                    filteredExpenses.length > 0
                      ? filteredExpenses.reduce(
                          (sum: number, e: Expense) => sum + e.amount,
                          0,
                        ) / filteredExpenses.length
                      : 0
                  }
                  formatter={(value) =>
                    formatCurrency(Number(value), state.currency)
                  }
                />
              </Col>
            </Row>
            <Table
              columns={expenseColumns}
              dataSource={filteredExpenses}
              rowKey="expense_id"
              pagination={{ pageSize: 10 }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
