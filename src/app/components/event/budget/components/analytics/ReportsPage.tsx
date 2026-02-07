"use client";
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  DatePicker,
  Space,
  Table,
  Statistic,
  Divider,
  Typography,
  message,
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useBudget } from "../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Category, Expense } from "../../types/budget.types";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

type ReportType = "summary" | "category" | "expense" | "vendor";

export default function ReportsPage() {
  const { state } = useBudget();
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
    message.success("Report exported as CSV");
  };

  const handlePrint = () => {
    window.print();
    message.success("Print dialog opened");
  };

  const summaryData = [
    { label: "Total Budget", value: state.summary?.total_budget || 0 },
    { label: "Total Spent", value: state.summary?.total_spent || 0 },
    { label: "Remaining", value: state.summary?.total_remaining || 0 },
    {
      label: "Spent %",
      value: `${state.summary?.percentage_spent || 0}%`,
      isPercent: true,
    },
  ];

  const categoryColumns: ColumnsType<Category> = [
    { title: "Category", dataIndex: "name", key: "name" },
    {
      title: "Allocated",
      dataIndex: "allocated",
      key: "allocated",
      render: (v: number) => formatCurrency(v, state.currency),
      align: "right",
    },
    {
      title: "Spent",
      dataIndex: "spent",
      key: "spent",
      render: (v: number) => formatCurrency(v, state.currency),
      align: "right",
    },
    {
      title: "Remaining",
      key: "remaining",
      render: (_, record) =>
        formatCurrency(record.allocated - record.spent, state.currency),
      align: "right",
    },
    {
      title: "Usage %",
      key: "usage",
      render: (_, record) =>
        record.allocated > 0
          ? `${Math.round((record.spent / record.allocated) * 100)}%`
          : "0%",
      align: "center",
    },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => formatCurrency(v, state.currency),
      align: "right",
    },
    {
      title: "Category",
      dataIndex: "category_id",
      key: "category_id",
      render: (id: string) =>
        state.categories.find((c: Category) => c.id === id)?.name || id,
    },
    {
      title: "Vendor",
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (v: string) => v || "—",
    },
    {
      title: "Date",
      dataIndex: "expense_date",
      key: "expense_date",
      render: (v: string) => formatDate(v),
    },
    { title: "Status", dataIndex: "payment_status", key: "payment_status" },
  ];

  return (
    <div className="reports-page">
      <Card
        title="Budget Reports"
        extra={
          <Space>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 150 }}
              options={[
                { value: "summary", label: "Summary Report" },
                { value: "category", label: "Category Report" },
                { value: "expense", label: "Expense Report" },
              ]}
            />
            <RangePicker
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
            />
            <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
          </Space>
        }
      >
        {/* Summary Report */}
        {reportType === "summary" && (
          <>
            <Title level={4}>Budget Summary</Title>
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

            <Title level={5}>Category Breakdown</Title>
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
                      <Text strong>Total</Text>
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
            <Title level={4}>Category Report</Title>
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
              Expense Report
              {dateRange && (
                <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                  ({dateRange[0].format("MMM D")} -{" "}
                  {dateRange[1].format("MMM D, YYYY")})
                </Text>
              )}
            </Title>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic
                  title="Total Expenses"
                  value={filteredExpenses.length}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Amount"
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
                  title="Avg Expense"
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
