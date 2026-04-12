"use client";
import React, { useEffect } from "react";
import {
  Modal, Form, Input, InputNumber, Select, DatePicker, AutoComplete,
} from "antd";
import {
  CreditCardOutlined, BankOutlined, DollarOutlined, FileTextOutlined,
  EllipsisOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, SyncOutlined,
} from "@ant-design/icons";
import type { Expense } from "../types/budget.types";
import { useBudget } from "../contexts/BudgetContext";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import styles from "./ExpenseModal.module.css";

type Props = {
  visible: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
};

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

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; icon: React.ReactNode; cls?: string; labelKey: string }[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[
            styles.chip,
            opt.cls,
            value === opt.value ? styles.chipActive : "",
          ].join(" ")}
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
  const [form] = Form.useForm();
  const isEditing = Boolean(editingExpense);

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
      });
    } else if (visible && !editingExpense) {
      form.resetFields();
    }
  }, [visible, editingExpense, form]);

  const onOk = async () => {
    const values = await form.validateFields();
    const payload: Omit<Expense, "expense_id"> = {
      description:     values.description,
      amount:          Number(values.amount),
      category_id:     values.category_id,
      vendor_name:     values.vendor_name || undefined,
      expense_date:    dayjs(values.expense_date).toISOString(),
      payment_status:  values.payment_status || "pending",
      methodOfPayment: values.methodOfPayment || "",
      receipt_urls:    editingExpense?.receipt_urls ?? [],
    };

    if (isEditing) {
      updateExpense(editingExpense!.expense_id, payload);
    } else {
      addExpense(payload);
    }

    form.resetFields();
    onClose();
  };

  const vendorNames = Array.from(
    new Set(state.expenses.map((e: Expense) => e.vendor_name).filter(Boolean)),
  ).map((v) => ({ value: v }));

  return (
    <Modal
      title={t(isEditing ? "expenseModal.editTitle" : "expenseModal.title")}
      open={visible}
      onOk={onOk}
      onCancel={onClose}
      okText={t(isEditing ? "common.save" : "expenseList.addExpense")}
      width={520}
      destroyOnHidden={false}
      forceRender
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>

        {/* ── Amount hero ───────────────────────────────────────────── */}
        <div className={styles.amountSection}>
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
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => (v?.replace(/,/g, "") ?? "") as unknown as number}
            />
          </Form.Item>
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
            />
          </Form.Item>

          <Form.Item name="vendor_name" label={t("expenseModal.vendor")}>
            <AutoComplete
              options={vendorNames}
              placeholder={t("expenseModal.vendor")}
              filterOption={(input, opt) =>
                String(opt?.value ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </div>

        <Form.Item name="expense_date" label={t("expenseModal.date")} initialValue={dayjs()}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        {/* ── Payment section ───────────────────────────────────────── */}
        <div className={styles.paymentSection}>
          <p className={styles.sectionLabel}>{t("expenseModal.methodOfPayment")}</p>
          <Form.Item
            name="methodOfPayment"
            noStyle
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
  );
}
