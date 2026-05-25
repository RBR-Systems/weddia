"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, Space, Typography, App } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, FileTextOutlined, EllipsisOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, SyncOutlined, UploadOutlined, PaperClipOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { formatInputNumber, parseInputNumber, onlyNumericKeyDown } from "@/shared/utils/formatters.utils";
import { uploadReceipt } from "@/shared/api/storageApi";
import type { Expense } from "../../../models/budget.models";
import { EXPENSE_MODAL_WIDTH, CURRENCIES } from "../../../constants/budget.constants";
import { useBudget } from "../../../contexts/BudgetContext";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styles from "./ExpenseModal.module.css";

const { Text } = Typography;

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
}>;

const METHOD_OPTIONS = [
  { value: "Credit Card",   icon: <CreditCardOutlined />,       labelKey: "expenseModal.paymentMethods.creditCard"   },
  { value: "Bank Transfer", icon: <BankOutlined />,             labelKey: "expenseModal.paymentMethods.bankTransfer" },
  { value: "Cash",          icon: <DollarOutlined />,           labelKey: "expenseModal.paymentMethods.cash"         },
  { value: "Check",         icon: <FileTextOutlined />,         labelKey: "expenseModal.paymentMethods.check"        },
  { value: "Other",         icon: <EllipsisOutlined />,         labelKey: "expenseModal.paymentMethods.other"        },
];

const STATUS_OPTIONS = [
  { value: "paid",    icon: <CheckCircleOutlined />,      cls: styles.chipPaid,    labelKey: "common.paid"    },
  { value: "pending", icon: <ClockCircleOutlined />,      cls: styles.chipPending, labelKey: "common.pending" },
  { value: "overdue", icon: <ExclamationCircleOutlined />,cls: styles.chipOverdue, labelKey: "common.overdue" },
  { value: "partial", icon: <SyncOutlined />,             cls: styles.chipPartial, labelKey: "common.partial" },
];

const EXPENSE_FORM_STYLE = { marginTop: 12 } as const;
const TEMP_ID = "new";

function ChipGroup({
  options,
  value,
  onChange,
}: Readonly<{
  options: ReadonlyArray<{ value: string; icon: React.ReactNode; cls?: string; labelKey: string }>;
  value?: string;
  onChange?: (v: string) => void;
}>) {
  const { t } = useTranslation();
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[styles.chip, opt.cls, value === opt.value ? styles.chipActive : ""].join(" ")}
          onClick={() => onChange?.(opt.value)}
        >
          {opt.icon}
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}

export default function ExpenseModal({ visible, onClose, editingExpense }: Props) {
  const { addExpense, updateExpense, state } = useBudget();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const isEditing = Boolean(editingExpense);
  const selectedCategoryId = Form.useWatch("category_id", form);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && editingExpense) {
      form.setFieldsValue({
        description:     editingExpense.description,
        amount:          editingExpense.amount,
        category_id:     editingExpense.category_id,
        vendor_name:     editingExpense.vendor_name ?? "",
        expense_date:    dayjs(editingExpense.expense_date),
        methodOfPayment: editingExpense.methodOfPayment,
        payment_status:  editingExpense.payment_status,
        receipt_url:     editingExpense.receipt_url ?? "",
        currency:        editingExpense.currency ?? "MXN",
      });
      setFileName(editingExpense.receipt_url ? decodeURIComponent(editingExpense.receipt_url.split("/").pop() ?? "") : null);
    } else if (visible && !editingExpense) {
      form.resetFields();
      setFileName(null);
    }
  }, [visible, editingExpense, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const expenseId = editingExpense?.expense_id ?? TEMP_ID;
      const url = await uploadReceipt(file, expenseId);
      form.setFieldValue("receipt_url", url);
      setFileName(file.name);
      message.success(t("expenseModal.receiptUploaded", "Recibo subido"));
    } catch {
      message.error(t("expenseModal.receiptUploadFailed", "Error al subir el recibo"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReceipt = () => {
    form.setFieldValue("receipt_url", "");
    setFileName(null);
  };

  const onOk = async () => {
    const values = await form.validateFields();
    const receiptUrl = values.receipt_url?.trim() || null;
    const payload: Omit<Expense, "expense_id"> = {
      description:     values.description,
      amount:          Number(values.amount),
      category_id:     values.category_id,
      vendor_name:     values.vendor_name || undefined,
      expense_date:    dayjs(values.expense_date).toISOString(),
      payment_status:  values.payment_status || "pending",
      methodOfPayment: values.methodOfPayment || "",
      receipt_url:     receiptUrl,
      receipt_urls:    receiptUrl ? [receiptUrl] : [],
      currency:        values.currency || "MXN",
    };

    if (isEditing) {
      updateExpense(editingExpense!.expense_id, payload);
    } else {
      addExpense(payload);
    }

    form.resetFields();
    setFileName(null);
    onClose();
  };

  const assignedVendorIds = new Set(state.vendorEvents.map((ve) => ve.vendor_id));

  const selectedCatalogId = selectedCategoryId
    ? Number(state.categories.find((c: { id: string; catalog_id?: string }) => c.id === selectedCategoryId)?.catalog_id ?? 0)
    : null;

  const eventVendorOptions = state.vendors
    .filter((v: { vendor_id: string; category_id?: number | null }) =>
      assignedVendorIds.has(v.vendor_id) &&
      (selectedCatalogId === null || v.category_id === selectedCatalogId)
    )
    .map((v: { vendor_id: string; name: string }) => ({ value: v.name, label: v.name }));

  const receiptUrl = form.getFieldValue("receipt_url") as string | undefined;
  const isPdf = receiptUrl?.toLowerCase().includes(".pdf");

  return (
    <>
    <Modal
      title={t(isEditing ? "expenseModal.editTitle" : "expenseModal.title")}
      open={visible}
      onOk={onOk}
      onCancel={onClose}
      okText={t(isEditing ? "common.save" : "expenseList.addExpense")}
      width={EXPENSE_MODAL_WIDTH}
      destroyOnHidden={false}
      forceRender
    >
      <Form form={form} layout="vertical" style={EXPENSE_FORM_STYLE}>

        {/* ── Amount + Currency ─────────────────────────────────────── */}
        <div className={styles.amountSection}>
          <div className={styles.twoCol}>
            <Form.Item
              name="amount"
              label={t("expenseModal.amount")}
              rules={[{ required: true, message: t("expenseModal.amountRequired") }]}
            >
              <InputNumber
                className={styles.amountInput}
                controls={false}
                min={0}
                placeholder="0.00"
                formatter={(v) => formatInputNumber(v)}
                parser={parseInputNumber}
                onKeyDown={onlyNumericKeyDown}
              />
            </Form.Item>
            <Form.Item name="currency" label={t("expenseModal.currency")} initialValue="MXN">
              <Select
                options={Object.values(CURRENCIES).map((c) => ({
                  value: c.code,
                  label: `${c.code} (${c.symbol})`,
                }))}
              />
            </Form.Item>
          </div>
        </div>

        {/* ── Core fields ───────────────────────────────────────────── */}
        <Form.Item
          name="description"
          label={t("expenseModal.description")}
          rules={[{ required: true, message: t("expenseModal.descriptionRequired") }]}
        >
          <Input placeholder={t("expenseModal.descriptionPlaceholder")} />
        </Form.Item>

        <div className={styles.twoCol}>
          <Form.Item
            name="category_id"
            label={t("expenseModal.category")}
            rules={[{ required: true, message: t("expenseModal.categoryRequired") }]}
          >
            <Select
              placeholder={t("expenseModal.category")}
              options={state.categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
              onChange={() => form.setFieldValue("vendor_name", undefined)}
            />
          </Form.Item>

          <Form.Item name="vendor_name" label={t("expenseModal.vendor")}>
            <Select
              placeholder={t("expenseModal.vendor")}
              allowClear
              showSearch
              filterOption={(input, opt) =>
                String(opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={eventVendorOptions}
              notFoundContent={t("eventVendors.noVendorsAssigned")}
            />
          </Form.Item>
        </div>

        {/* ── Receipt upload ────────────────────────────────────────── */}
        <Form.Item name="receipt_url" label={t("expenseModal.receiptUrl")} hidden>
          <Input />
        </Form.Item>

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
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setPreviewOpen(true)}
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleRemoveReceipt}
              />
            </Space>
          ) : (
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("expenseModal.uploadReceipt", "Subir recibo")}
            </Button>
          )}
        </Form.Item>

        <Form.Item name="expense_date" label={t("expenseModal.date")} initialValue={dayjs()}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        {/* ── Payment section ───────────────────────────────────────── */}
        <div className={styles.paymentSection}>
          <p className={styles.sectionLabel}>{t("expenseModal.methodOfPayment")}</p>
          <Form.Item
            name="methodOfPayment"
            initialValue="Credit Card"
            rules={[{ required: true, message: t("expenseModal.methodOfPaymentRequired") }]}
          >
            <ChipGroup options={METHOD_OPTIONS} />
          </Form.Item>

          <hr className={styles.sectionDivider} />

          <p className={styles.sectionLabel}>{t("expenseModal.paymentStatus")}</p>
          <Form.Item name="payment_status" noStyle initialValue="pending">
            <ChipGroup options={STATUS_OPTIONS} />
          </Form.Item>
        </div>

      </Form>
    </Modal>

    <Modal
      open={previewOpen}
      onCancel={() => setPreviewOpen(false)}
      footer={null}
      centered
      width={isPdf ? 860 : "auto"}
      styles={{ body: { padding: 0, lineHeight: 0, maxHeight: "80vh", overflow: "auto" } }}
      title={fileName}
    >
      {receiptUrl && (isPdf ? (
        <iframe
          src={receiptUrl}
          style={{ width: "100%", height: "75vh", border: "none" }}
          title={fileName ?? "receipt"}
        />
      ) : (
        <img
          src={receiptUrl}
          alt={fileName ?? "receipt"}
          style={{ width: "100%", display: "block" }}
        />
      ))}
    </Modal>
    </>
  );
}
