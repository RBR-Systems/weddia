"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { App, Table, Tag, Button, Space, Select, Modal, Form, Input, Row, Col, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { uploadReceipt } from "@/shared/api/storageApi";
import Card from "@/shared/components/Card/Card";
import type { ColumnsType } from "antd/es/table";
import { useBudget } from "../../../contexts/BudgetContext";
import { formatCurrency, formatDate } from "@/shared/utils/formatters.utils";
import {
  getPaymentStatus,
  getPaymentMethodOptions,
  PAYMENT_TABLE_PAGE_SIZE,
  ALL_STATUSES_FILTER,
} from "../../../constants/budget.constants";
import type { Expense, PaymentStatus } from "../../../models/budget.models";
import payStyles from "./PaymentStatus.module.css";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";

const { Text } = Typography;

export const PaymentStatusManager = () => {
  const { t } = useTranslation();
  const PAYMENT_STATUS = getPaymentStatus();
  const { message } = App.useApp();
  const { state, updateExpense } = useBudget();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | typeof ALL_STATUSES_FILTER>(
    ALL_STATUSES_FILTER,
  );
  const [markPaidModal, setMarkPaidModal] = useState<Expense | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredExpenses = useMemo(() => {
    if (statusFilter === ALL_STATUSES_FILTER) return state.expenses;
    return state.expenses.filter((e: Expense) => e.payment_status === statusFilter);
  }, [state.expenses, statusFilter]);

  const paidTotal = useMemo(
    () => state.expenses.filter((e: Expense) => e.payment_status === "paid").reduce((s: number, e: Expense) => s + e.amount, 0),
    [state.expenses],
  );
  const pendingTotal = useMemo(
    () => state.expenses.filter((e: Expense) => e.payment_status === "pending").reduce((s: number, e: Expense) => s + e.amount, 0),
    [state.expenses],
  );
  const overdueTotal = useMemo(
    () => state.expenses.filter((e: Expense) => e.payment_status === "overdue").reduce((s: number, e: Expense) => s + e.amount, 0),
    [state.expenses],
  );

  useEffect(() => {
    if (!markPaidModal) return;
    form.setFieldsValue({
      methodOfPayment: markPaidModal.methodOfPayment || undefined,
      receipt_url: markPaidModal.receipt_url ?? "",
    });
    const existing = markPaidModal.receipt_url ?? "";
    setFileName(existing ? decodeURIComponent(existing.split("/").pop() ?? "") : null);
    setReceiptUrl(existing);
  }, [markPaidModal, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !markPaidModal) return;
    setUploading(true);
    try {
      const url = await uploadReceipt(file, markPaidModal.expense_id);
      form.setFieldValue("receipt_url", url);
      setReceiptUrl(url);
      setFileName(file.name);
      message.success(t("expenseModal.receiptUploaded"));
    } catch {
      message.error(t("expenseModal.receiptUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidModal) return;
    try {
      const values = await form.validateFields();
      const receiptUrl = values.receipt_url?.trim() || null;
      updateExpense?.(markPaidModal.expense_id, {
        payment_status: "paid",
        methodOfPayment: values.methodOfPayment || markPaidModal.methodOfPayment || "",
        receipt_url: receiptUrl,
        receipt_urls: receiptUrl ? [receiptUrl] : markPaidModal.receipt_urls ?? [],
      });
      message.success(t("paymentStatus.paymentMarkedPaid"));
      setMarkPaidModal(null);
    } catch (err) {
      const validationErr = err as { errorFields?: unknown };
      if (!validationErr?.errorFields) throw err;
    }
  };

  const formatStatistic = (value: number | string) => formatCurrency(Number(value), state.currency);

  const columns: ColumnsType<Expense> = [
    {
      title: t("common.description"),
      dataIndex: "description",
      key: "description",
      minWidth: 160,
      render: (text: string, record) => (
        <div>
          <div className={payStyles.expenseDesc}>{text}</div>
          <div className={payStyles.expenseVendor}>{record.vendor_name || t("common.noVendor")}</div>
        </div>
      ),
    },
    {
      title: t("common.amount"),
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 110,
      render: (amount: number) => <Text strong>{formatCurrency(amount, state.currency)}</Text>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: t("paymentStatus.dueDate"),
      dataIndex: "expense_date",
      key: "expense_date",
      width: 110,
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    },
    {
      title: t("common.status"),
      dataIndex: "payment_status",
      key: "payment_status",
      width: 130,
      render: (status: PaymentStatus, record) => (
        <Select
          value={status}
          className={payStyles.statusSelectWidth}
          size="small"
          onChange={(value) => {
            if (value === "paid") {
              setMarkPaidModal(record);
            } else {
              updateExpense?.(record.expense_id, { payment_status: value });
              message.success(t("paymentStatus.paymentStatusUpdated"));
            }
          }}
          options={Object.values(PAYMENT_STATUS).map((s) => ({
            value: s.value,
            label: <Tag color={s.color} className={payStyles.tagNoMargin}>{s.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, record) =>
        record.payment_status !== "paid" && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setMarkPaidModal(record)}
          >
            {t("paymentStatus.markPaid")}
          </Button>
        ),
    },
  ];

  return (
    <>
      <Row gutter={[12, 12]} className={payStyles.statsRow}>
        <Col xs={24} sm={8}>
          <Card
            size="small"
            className={payStyles.statCard}
            style={{ "--accent-color": "var(--status-completed)" } as React.CSSProperties}
          >
            <div className={payStyles.statIcon} style={{ color: "var(--status-completed)" }}>
              <CheckCircleOutlined />
            </div>
            <Statistic
              title={t("common.paid")}
              value={paidTotal}
              className={payStyles.paidValue}
              formatter={formatStatistic}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            size="small"
            className={payStyles.statCard}
            style={{ "--accent-color": "var(--status-delayed)" } as React.CSSProperties}
          >
            <div className={payStyles.statIcon} style={{ color: "var(--status-delayed)" }}>
              <ClockCircleOutlined />
            </div>
            <Statistic
              title={t("common.pending")}
              value={pendingTotal}
              className={payStyles.pendingValue}
              formatter={formatStatistic}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            size="small"
            className={payStyles.statCard}
            style={{ "--accent-color": "var(--status-canceled)" } as React.CSSProperties}
          >
            <div className={payStyles.statIcon} style={{ color: "var(--status-canceled)" }}>
              <ExclamationCircleOutlined />
            </div>
            <Statistic
              title={t("common.overdue")}
              value={overdueTotal}
              className={payStyles.overdueValue}
              formatter={formatStatistic}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t("paymentStatus.paymentTracking")}
        extra={
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className={payStyles.statusSelect}
            size="small"
            options={[
              { value: ALL_STATUSES_FILTER, label: t("paymentStatus.allStatuses") },
              ...Object.values(PAYMENT_STATUS).map((s) => ({ value: s.value, label: s.label })),
            ]}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredExpenses}
          rowKey="expense_id"
          pagination={{ pageSize: PAYMENT_TABLE_PAGE_SIZE }}
          scroll={{ x: 620 }}
          locale={{ emptyText: t("paymentStatus.noPayments") }}
          size="middle"
        />
      </Card>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        centered
        width={receiptUrl.toLowerCase().includes(".pdf") ? 860 : "auto"}
        styles={{ body: { padding: 0, lineHeight: 0, maxHeight: "80vh", overflow: "auto" } }}
        title={fileName}
      >
        {receiptUrl && (receiptUrl.toLowerCase().includes(".pdf") ? (
          <iframe src={receiptUrl} style={{ width: "100%", height: "75vh", border: "none" }} title={fileName ?? "receipt"} />
        ) : (
          <img src={receiptUrl} alt={fileName ?? "receipt"} style={{ width: "100%", display: "block" }} />
        ))}
      </Modal>

      <Modal
        title={t("paymentStatus.markPaymentPaid")}
        open={!!markPaidModal}
        onOk={handleMarkPaid}
        onCancel={() => setMarkPaidModal(null)}
        okText={t("paymentStatus.confirmPayment")}
      >
        {markPaidModal && (
          <Space orientation="vertical" style={{ width: "100%" }}>
            <div>
              <Text type="secondary">{t("paymentStatus.expense")}</Text>
              <div><Text strong>{markPaidModal.description}</Text></div>
            </div>
            <div>
              <Text type="secondary">{t("paymentStatus.amount")}</Text>
              <div>
                <Text strong className={payStyles.confirmAmount}>
                  {formatCurrency(markPaidModal.amount, state.currency)}
                </Text>
              </div>
            </div>
            <Form form={form} layout="vertical" className={payStyles.formSection}>
              <Form.Item
                name="methodOfPayment"
                label={t("expenseModal.methodOfPayment")}
                rules={[{ required: true, message: t("expenseModal.methodOfPaymentRequired") }]}
              >
                <Select options={getPaymentMethodOptions()} placeholder={t("expenseModal.methodOfPaymentPlaceholder")} />
              </Form.Item>
              <Form.Item name="receipt_url" hidden><Input /></Form.Item>
              <Form.Item label={t("expenseModal.receiptUrl")}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {fileName ? (
                  <Space>
                    <PaperClipOutlined style={{ color: "var(--primary)" }} />
                    <Text style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fileName}
                    </Text>
                    <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)} />
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}
                      onClick={() => { form.setFieldValue("receipt_url", ""); setReceiptUrl(""); setFileName(null); }}
                    />
                  </Space>
                ) : (
                  <Button icon={<UploadOutlined />} loading={uploading} onClick={() => fileInputRef.current?.click()}>
                    {t("expenseModal.uploadReceipt")}
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </>
  );
};
