"use client";
import React, { useState } from "react";
import {
  App,
  Card,
  Row,
  Col,
  Upload,
  Button,
  Table,
  Space,
  Modal,
  Select,
  Checkbox,
  Alert,
  Typography,
  Divider,
  Progress,
  Tag,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useBudget } from "../../contexts/BudgetContext";
import CategoryTag from "../shared/CategoryTag";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Expense, PaymentStatus } from "../../types/budget.types";
import bulkStyles from "./BulkOperations.module.css";

const { Text, Paragraph, Title } = Typography;

export default function BulkOperations() {
  const { message } = App.useApp();
  const { state, deleteExpense, updateExpense } = useBudget();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkActionModal, setBulkActionModal] = useState<
    "status" | "category" | "delete" | null
  >(null);
  const [bulkStatus, setBulkStatus] = useState<PaymentStatus>("paid");
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [importProgress, setImportProgress] = useState<number | null>(null);

  const handleExportAll = () => {
    const headers = [
      "Description",
      "Amount",
      "Category",
      "Vendor",
      "Date",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...state.expenses.map((e: Expense) => {
        const cat = state.categories.find(
          (c: { id: string }) => c.id === e.category_id,
        );
        return [
          `"${e.description}"`,
          e.amount,
          `"${cat?.name || ""}"`,
          `"${e.vendor_name || ""}"`,
          e.expense_date,
          e.payment_status,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-expenses-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Expenses exported successfully");
  };

  const handleExportSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("No expenses selected");
      return;
    }

    const selectedExpenses = state.expenses.filter((e: Expense) =>
      selectedRowKeys.includes(e.expense_id),
    );

    const headers = [
      "Description",
      "Amount",
      "Category",
      "Vendor",
      "Date",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...selectedExpenses.map((e: Expense) => {
        const cat = state.categories.find(
          (c: { id: string }) => c.id === e.category_id,
        );
        return [
          `"${e.description}"`,
          e.amount,
          `"${cat?.name || ""}"`,
          `"${e.vendor_name || ""}"`,
          e.expense_date,
          e.payment_status,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-expenses-selected.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Exported ${selectedExpenses.length} expenses`);
  };

  const uploadProps: UploadProps = {
    accept: ".csv",
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportProgress(0);

        // Simulate import progress
        const interval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev === null || prev >= 100) {
              clearInterval(interval);
              return null;
            }
            return prev + 10;
          });
        }, 200);

        setTimeout(() => {
          message.success("Import completed (demo - no actual data imported)");
          setImportProgress(null);
        }, 2500);
      };
      reader.readAsText(file);
      return false;
    },
  };

  const handleBulkStatusUpdate = () => {
    selectedRowKeys.forEach((key) => {
      updateExpense?.(key as string, { payment_status: bulkStatus });
    });
    message.success(
      `Updated ${selectedRowKeys.length} expenses to "${bulkStatus}"`,
    );
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  };

  const handleBulkCategoryUpdate = () => {
    if (!bulkCategory) {
      message.error("Please select a category");
      return;
    }
    selectedRowKeys.forEach((key) => {
      updateExpense?.(key as string, { category_id: bulkCategory });
    });
    message.success(
      `Updated ${selectedRowKeys.length} expenses to new category`,
    );
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  };

  const handleBulkDelete = () => {
    selectedRowKeys.forEach((key) => {
      deleteExpense?.(key as string);
    });
    message.success(`Deleted ${selectedRowKeys.length} expenses`);
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  };

  const columns: ColumnsType<Expense> = [
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => formatCurrency(v, state.currency),
    },
    {
      title: "Category",
      dataIndex: "category_id",
      key: "category_id",
      render: (id: string) => {
        const cat = state.categories.find((c: { id: string }) => c.id === id);
        return <CategoryTag color={cat?.color}>{cat?.name || id}</CategoryTag>;
      },
    },
    {
      title: "Date",
      dataIndex: "expense_date",
      key: "expense_date",
      render: (v: string) => formatDate(v),
    },
    { title: "Status", dataIndex: "payment_status", key: "payment_status" },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Import Data">
            <Space direction="vertical" className={bulkStyles.fullWidth}>
              <Alert
                message="CSV Import"
                description="Upload a CSV file with columns: Description, Amount, Category, Vendor, Date, Status"
                type="info"
                showIcon
              />

              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} block>
                  Select CSV File
                </Button>
              </Upload>

              {importProgress !== null && (
                <Progress percent={importProgress} status="active" />
              )}

              <Divider />

              <Text type="secondary">Download template:</Text>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const template =
                    "Description,Amount,Category,Vendor,Date,Status\nExample Expense,1000,venue,Vendor Name,2026-03-15,pending";
                  const blob = new Blob([template], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "budget-import-template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Template
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Export Data">
            <Space direction="vertical" className={bulkStyles.fullWidth}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportAll}
                block
              >
                Export All Expenses ({state.expenses.length})
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportSelected}
                disabled={selectedRowKeys.length === 0}
                block
              >
                Export Selected ({selectedRowKeys.length})
              </Button>

              <Divider />

              <Text type="secondary">Export formats available: CSV</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Bulk Operations"
        className={bulkStyles.bulkTable}
        extra={
          selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} selected</Text>
              <Button
                icon={<EditOutlined />}
                onClick={() => setBulkActionModal("status")}
              >
                Update Status
              </Button>
              <Button
                icon={<CheckSquareOutlined />}
                onClick={() => setBulkActionModal("category")}
              >
                Change Category
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setBulkActionModal("delete")}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={state.expenses}
          rowKey="expense_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Bulk Status Modal */}
      <Modal
        title="Update Payment Status"
        open={bulkActionModal === "status"}
        onOk={handleBulkStatusUpdate}
        onCancel={() => setBulkActionModal(null)}
      >
        <Space direction="vertical" className={bulkStyles.fullWidth}>
          <Text>Update {selectedRowKeys.length} expenses to:</Text>
          <Select
            value={bulkStatus}
            onChange={setBulkStatus}
            className="u-full-width"
            options={[
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "overdue", label: "Overdue" },
              { value: "partial", label: "Partial" },
            ]}
          />
        </Space>
      </Modal>

      {/* Bulk Category Modal */}
      <Modal
        title="Change Category"
        open={bulkActionModal === "category"}
        onOk={handleBulkCategoryUpdate}
        onCancel={() => setBulkActionModal(null)}
      >
        <Space direction="vertical" className={bulkStyles.fullWidth}>
          <Text>Move {selectedRowKeys.length} expenses to:</Text>
          <Select
            value={bulkCategory}
            onChange={setBulkCategory}
            className="u-full-width"
            placeholder="Select category"
            options={state.categories.map(
              (c: { id: string; name: string }) => ({
                value: c.id,
                label: c.name,
              }),
            )}
          />
        </Space>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        title="Confirm Delete"
        open={bulkActionModal === "delete"}
        onOk={handleBulkDelete}
        onCancel={() => setBulkActionModal(null)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message={`Are you sure you want to delete ${selectedRowKeys.length} expense(s)?`}
          description="This action cannot be undone."
          type="warning"
          showIcon
        />
      </Modal>
    </>
  );
}
