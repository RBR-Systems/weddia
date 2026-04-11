"use client";
import React from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, AutoComplete } from "antd";
import type { Expense } from "../types/budget.types";
import { useBudget } from "../contexts/BudgetContext";
import { getPaymentStatus } from "../constants/budget.constants";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ExpenseModal({ visible, onClose }: Props) {
  const { addExpense, state } = useBudget();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const onOk = async () => {
    const values = await form.validateFields();
    addExpense({
      description: values.description,
      amount: Number(values.amount),
      category_id: values.category_id,
      vendor_name: values.vendor_name || undefined,
      expense_date: dayjs(values.expense_date).toISOString(),
      payment_status: values.payment_status || "pending",
      methodOfPayment: values.methodOfPayment || "",
      receipt_urls: [],
    } as Omit<Expense, "expense_id">);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t("expenseModal.title")}
      open={visible}
      onOk={onOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
                <Form.Item
                  name="methodOfPayment"
                  label={t("expenseModal.methodOfPayment")}
                  rules={[{ required: true, message: t("expenseModal.methodOfPaymentRequired") }]}
                >
                  <Select
                    options={[
                      { value: "Credit Card", label: t("expenseModal.paymentMethods.creditCard") },
                      { value: "Bank Transfer", label: t("expenseModal.paymentMethods.bankTransfer") },
                      { value: "Cash", label: t("expenseModal.paymentMethods.cash") },
                      { value: "Check", label: t("expenseModal.paymentMethods.check") },
                      { value: "Other", label: t("expenseModal.paymentMethods.other") },
                    ]}
                    placeholder={t("expenseModal.methodOfPaymentPlaceholder")}
                  />
                </Form.Item>
        <Form.Item
          name="description"
          label={t("expenseModal.description")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="amount" label={t("expenseModal.amount")} rules={[{ required: true }]}>
          <InputNumber className="u-full-width" min={0} />
        </Form.Item>
        <Form.Item
          name="category_id"
          label={t("expenseModal.category")}
          rules={[{ required: true }]}
        >
          <Select
            options={state.categories.map((c: any) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="vendor_name" label={t("expenseModal.vendor")}>
          <AutoComplete
            options={Array.from(
              new Set(
                state.expenses
                  .map((e: any) => e.vendor_name)
                  .filter(Boolean),
              ),
            ).map((v) => ({ value: v }))}
            placeholder={t("expenseModal.vendor")}
            filterOption={(inputValue, option) =>
              String(option?.value || "").toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="expense_date" label={t("expenseModal.date")} initialValue={dayjs()}>
          <DatePicker className="u-full-width" />
        </Form.Item>
        <Form.Item
          name="payment_status"
          label={t("expenseModal.paymentStatus")}
          initialValue="pending"
        >
          <Select
            options={Object.values(getPaymentStatus()).map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
