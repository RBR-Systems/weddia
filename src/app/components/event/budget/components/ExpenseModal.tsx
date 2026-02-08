"use client";
import React from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker } from "antd";
import type { Expense } from "../types/budget.types";
import { useBudget } from "../contexts/BudgetContext";
import { getDefaultCategories } from "../constants/budget.constants";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ExpenseModal({ visible, onClose }: Props) {
  const { addExpense } = useBudget();
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
      destroyOnClose
    >
      <Form form={form} layout="vertical">
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
            options={getDefaultCategories().map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="vendor_name" label={t("expenseModal.vendor")}>
          <Input />
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
            options={[
              { value: "paid" },
              { value: "pending" },
              { value: "overdue" },
              { value: "partial" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
