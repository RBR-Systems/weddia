"use client";
import React from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker } from "antd";
import type { Expense } from "../types/budget.types";
import { useBudget } from "../contexts/BudgetContext";
import { DEFAULT_CATEGORIES } from "../constants/budget.constants";
import dayjs from "dayjs";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ExpenseModal({ visible, onClose }: Props) {
  const { addExpense } = useBudget();
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
      title="Add Expense"
      open={visible}
      onOk={onOk}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true }]}
        >
          <Select
            options={DEFAULT_CATEGORIES.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="vendor_name" label="Vendor">
          <Input />
        </Form.Item>
        <Form.Item name="expense_date" label="Date" initialValue={dayjs()}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="payment_status"
          label="Payment Status"
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
