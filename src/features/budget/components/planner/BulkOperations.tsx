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
  Alert,
  Typography,
  Divider,
  Progress,
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
import { useTranslation } from "react-i18next";
import CategoryTag from "../shared/CategoryTag";
import { formatCurrency, formatDate } from "@/utils/formatters.utils";
import type { Expense, PaymentStatus } from "../../models/budget.models";
import bulkStyles from "./BulkOperations.module.css";

const { Text, Paragraph, Title } = Typography;

export default function BulkOperations() {
  const { t } = useTranslation();
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
    message.success(t("bulkOperations.exportSuccess"));
  };

  const handleExportSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t("bulkOperations.noExpensesSelected"));
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
    message.success(t("bulkOperations.exportedCount", { count: selectedExpenses.length }));
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
          message.success(t("bulkOperations.importCompleted"));
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
      t("bulkOperations.expensesStatusUpdated", { count: selectedRowKeys.length, status: bulkStatus }),
    );
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  };

  const handleBulkCategoryUpdate = () => {
    if (!bulkCategory) {
      message.error(t("bulkOperations.selectCategoryRequired"));
      return;
    }
    selectedRowKeys.forEach((key) => {
      updateExpense?.(key as string, { category_id: bulkCategory });
    });
    message.success(
      t("bulkOperations.expensesCategoryUpdated", { count: selectedRowKeys.length }),
    );
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  };

  const handleBulkDelete = () => {
    selectedRowKeys.forEach((key) => {
      deleteExpense?.(key as string);
    });
    message.success(t("bulkOperations.expensesDeleted", { count: selectedRowKeys.length }));
    setSelectedRowKeys([]);
    setBulkActionModal(null);
  };

  const columns: ColumnsType<Expense> = [
    { title: t("common.description"), dataIndex: "description", key: "description" },
    {
      title: t("common.amount"),
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => formatCurrency(v, state.currency),
    },
    {
      title: t("common.category"),
      dataIndex: "category_id",
      key: "category_id",
      render: (id: string) => {
        const cat = state.categories.find((c: { id: string }) => c.id === id);
        return <CategoryTag color={cat?.color}>{cat?.name || id}</CategoryTag>;
      },
    },
    {
      title: t("common.date"),
      dataIndex: "expense_date",
      key: "expense_date",
      render: (v: string) => formatDate(v),
    },
    {
      title: t("common.status"),
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => t(`statusBadge.${status}`),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t("bulkOperations.importData")}>
            <Space orientation="vertical" className={bulkStyles.fullWidth}>
              <Alert
                title={t("bulkOperations.csvImport")}
                description={t("bulkOperations.csvDescription")}
                type="info"
                showIcon
              />

              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} block>
                  {t("bulkOperations.selectCsvFile")}
                </Button>
              </Upload>

              {importProgress !== null && (
                <Progress percent={importProgress} status="active" />
              )}

              <Divider />

              <Text type="secondary">{t("bulkOperations.downloadTemplateLabel")}</Text>
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
                {t("bulkOperations.downloadTemplate")}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t("bulkOperations.exportData")}>
            <Space orientation="vertical" className={bulkStyles.fullWidth}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportAll}
                block
              >
                {t("bulkOperations.exportAll", { count: state.expenses.length })}
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportSelected}
                disabled={selectedRowKeys.length === 0}
                block
              >
                {t("bulkOperations.exportSelected", { count: selectedRowKeys.length })}
              </Button>

              <Divider />

              <Text type="secondary">{t("bulkOperations.exportFormats")}</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t("bulkOperations.title")}
        className={bulkStyles.bulkTable}
        extra={
          selectedRowKeys.length > 0 && (
            <Space>
              <Text>{t("bulkOperations.selectedCount", { count: selectedRowKeys.length })}</Text>
              <Button
                icon={<EditOutlined />}
                onClick={() => setBulkActionModal("status")}
              >
                {t("bulkOperations.updateStatus")}
              </Button>
              <Button
                icon={<CheckSquareOutlined />}
                onClick={() => setBulkActionModal("category")}
              >
                {t("bulkOperations.changeCategory")}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setBulkActionModal("delete")}
              >
                {t("common.delete")}
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
        title={t("bulkOperations.updatePaymentStatus")}
        open={bulkActionModal === "status"}
        onOk={handleBulkStatusUpdate}
        onCancel={() => setBulkActionModal(null)}
      >
        <Space orientation="vertical" className={bulkStyles.fullWidth}>
          <Text>{t("bulkOperations.updateExpensesTo", { count: selectedRowKeys.length })}</Text>
          <Select
            value={bulkStatus}
            onChange={setBulkStatus}
            className="u-full-width"
            options={[
              { value: "paid", label: t("statusBadge.paid") },
              { value: "pending", label: t("statusBadge.pending") },
              { value: "overdue", label: t("statusBadge.overdue") },
              { value: "partial", label: t("statusBadge.partial") },
            ]}
          />
        </Space>
      </Modal>

      {/* Bulk Category Modal */}
      <Modal
        title={t("bulkOperations.changeCategory")}
        open={bulkActionModal === "category"}
        onOk={handleBulkCategoryUpdate}
        onCancel={() => setBulkActionModal(null)}
      >
        <Space orientation="vertical" className={bulkStyles.fullWidth}>
          <Text>{t("bulkOperations.moveExpensesTo", { count: selectedRowKeys.length })}</Text>
          <Select
            value={bulkCategory}
            onChange={setBulkCategory}
            className="u-full-width"
            placeholder={t("bulkOperations.selectCategoryPlaceholder")}
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
        title={t("bulkOperations.confirmDelete")}
        open={bulkActionModal === "delete"}
        onOk={handleBulkDelete}
        onCancel={() => setBulkActionModal(null)}
        okText={t("common.delete")}
        okButtonProps={{ danger: true }}
      >
        <Alert
          title={t("bulkOperations.deleteConfirm", { count: selectedRowKeys.length })}
          description={t("bulkOperations.cannotUndo")}
          type="warning"
          showIcon
        />
      </Modal>
    </>
  );
}

