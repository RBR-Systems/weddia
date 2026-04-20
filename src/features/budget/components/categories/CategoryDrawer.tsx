"use client";
import { useState, useEffect } from "react";
import { App, Drawer, Form, Input, InputNumber, Button, Space, Divider, Table, Popconfirm, Typography, Spin, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import type { Category, BudgetItem } from "../../models/budget.models";
import { BudgetService } from "../../api/budgetApi";
import { ApiError } from "@/shared/api/apiClient";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/utils/formatters.utils";
import { useTranslation } from "react-i18next";
import styles from "./CategoryDrawer.module.css";

const { Text } = Typography;

interface CategoryDrawerProps {
  readonly open: boolean;
  readonly category: Category | null;
  readonly currency: string;
  readonly onClose: () => void;
  readonly onSave: (id: string, data: { budget_name?: string; budget_notes?: string; allocated?: number }) => Promise<void>;
  readonly onDelete: (id: string) => void;
}

// Separate state type for the editing row — no Form needed
interface EditValues { description: string; amount: number | null; notes: string }

export default function CategoryDrawer({
  open,
  category,
  currency,
  onClose,
  onSave,
  onDelete,
}: CategoryDrawerProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [metaForm] = Form.useForm();
  const [addForm] = Form.useForm();

  const [items, setItems] = useState<BudgetItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Which row is in inline-edit mode
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ description: "", amount: null, notes: "" });

  // Whether the "add new item" row is visible
  const [addingItem, setAddingItem] = useState(false);

  // Load form + items when the drawer opens / category changes
  useEffect(() => {
    if (!open || !category) return;
    metaForm.setFieldsValue({
      budget_name: category.budget_name ?? "",
      budget_notes: category.budget_notes ?? "",
      allocated: category.allocated,
    });
    setAddingItem(false);
    setEditingItemId(null);
    fetchItems(category.id);
  }, [open, category?.id]);

  async function fetchItems(budgetId: string) {
    setItemsLoading(true);
    try {
      const data = await BudgetService.getBudgetItems(budgetId);
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      // silently fail — items section shows empty
    } finally {
      setItemsLoading(false);
    }
  }

  // ── Save budget metadata ───────────────────────────────────────────────────

  const handleSaveMeta = async () => {
    if (!category) return;
    let values: { budget_name: string; budget_notes: string; allocated: number };
    try {
      values = await metaForm.validateFields();
    } catch {
      return; // validation error — inline messages show on fields
    }
    setSavingMeta(true);
    try {
      await onSave(category.id, values);
      message.success(t("categoryList.categoryUpdated"));
    } catch {
      message.error(t("categoryList.saveError"));
    } finally {
      setSavingMeta(false);
    }
  };

  // ── Add new item ───────────────────────────────────────────────────────────

  const handleAddItem = async () => {
    if (!category) return;
    let values: { description: string; amount: number; notes?: string };
    try {
      values = await addForm.validateFields();
    } catch {
      return; // inline validation messages will show
    }
    setSavingItem(true);
    try {
      const created = await BudgetService.createBudgetItem(category.id, {
        ...values,
        category_id: category.catalog_id,
      });
      setItems((prev) => [...prev, created]);
      addForm.resetFields();
      setAddingItem(false);
      message.success(t("budgetItems.itemAdded"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      message.error(t("budgetItems.saveError"));
    } finally {
      setSavingItem(false);
    }
  };

  // ── Inline-edit existing item ──────────────────────────────────────────────

  const startEdit = (item: BudgetItem) => {
    setEditingItemId(item.item_id);
    setEditValues({ description: item.description, amount: item.amount, notes: item.notes ?? "" });
    setAddingItem(false);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditValues({ description: "", amount: null, notes: "" });
  };

  const handleSaveEdit = async () => {
    if (!editingItemId || editValues.amount === null) return;
    if (!editValues.description.trim()) {
      message.warning(t("budgetItems.descriptionRequired"));
      return;
    }
    setSavingItem(true);
    try {
      const editingItem = items.find((i) => i.item_id === editingItemId);
      const payload = {
        description: editValues.description,
        amount: editValues.amount,
        notes: editValues.notes,
        category_id: editingItem?.category_id ?? category?.catalog_id,
      };
      await BudgetService.updateBudgetItem(editingItemId, payload);
      setItems((prev) => prev.map((i) => i.item_id === editingItemId ? { ...i, ...payload } : i));
      setEditingItemId(null);
      message.success(t("budgetItems.itemUpdated"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      message.error(t("budgetItems.updateError"));
    } finally {
      setSavingItem(false);
    }
  };

  // ── Delete item ────────────────────────────────────────────────────────────

  const handleDeleteItem = async (itemId: string) => {
    try {
      await BudgetService.deleteBudgetItem(itemId);
      setItems((prev) => prev.filter((i) => i.item_id !== itemId));
      message.success(t("budgetItems.itemDeleted"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      message.error(t("budgetItems.deleteError"));
    }
  };

  // ── Table columns (controlled inputs — no Form instance in cells) ──────────

  const columns = [
    {
      title: t("budgetItems.description"),
      dataIndex: "description",
      key: "description",
      render: (val: string, record: BudgetItem) =>
        editingItemId === record.item_id ? (
          <Input
            size="small"
            value={editValues.description}
            onChange={(e) => setEditValues((p) => ({ ...p, description: e.target.value }))}
            placeholder={t("budgetItems.descriptionPlaceholder")}
            status={editValues.description.trim() === "" ? "error" : undefined}
          />
        ) : (
          <span>{val}</span>
        ),
    },
    {
      title: t("budgetItems.amount"),
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (val: number, record: BudgetItem) =>
        editingItemId === record.item_id ? (
          <InputNumber
            size="small"
            style={{ width: "100%" }}
            value={editValues.amount}
            onChange={(v) => setEditValues((p) => ({ ...p, amount: v }))}
            min={0}
            prefix="$"
            formatter={(v) => formatInputNumber(v)}
            parser={(v) => parseInputNumber(v) as unknown as 0}
            status={editValues.amount === null ? "error" : undefined}
          />
        ) : (
          <Text strong>{formatCurrency(val, currency)}</Text>
        ),
    },
    {
      title: t("budgetItems.notes"),
      dataIndex: "notes",
      key: "notes",
      render: (val: string, record: BudgetItem) =>
        editingItemId === record.item_id ? (
          <Input
            size="small"
            value={editValues.notes}
            onChange={(e) => setEditValues((p) => ({ ...p, notes: e.target.value }))}
            placeholder={t("budgetItems.notesPlaceholder")}
          />
        ) : (
          <Text type="secondary">{val}</Text>
        ),
    },
    {
      key: "actions",
      width: 80,
      render: (_: unknown, record: BudgetItem) =>
        editingItemId === record.item_id ? (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<SaveOutlined />}
              loading={savingItem}
              onClick={handleSaveEdit}
            />
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
          </Space>
        ) : (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startEdit(record)}
              disabled={addingItem}
            />
            <Popconfirm
              title={t("budgetItems.deleteConfirm")}
              onConfirm={() => handleDeleteItem(record.item_id)}
              okText={t("common.delete")}
              cancelText={t("common.cancel")}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={editingItemId !== null}
              />
            </Popconfirm>
          </Space>
        ),
    },
  ];

  const totalItems = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Drawer
      title={
        category ? (
          <div>
            <div style={{ fontWeight: 600 }}>{category.budget_name || category.name}</div>
            <Tag color="default" style={{ marginTop: 4, fontSize: 11 }}>{category.name}</Tag>
          </div>
        ) : null
      }
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose={false}
      forceRender
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Popconfirm
            title={t("categoryList.deleteConfirm")}
            onConfirm={() => { if (category) { onDelete(category.id); onClose(); } }}
            okText={t("common.delete")}
            cancelText={t("common.cancel")}
            okButtonProps={{ danger: true }}
          >
            <Button danger>{t("common.delete")}</Button>
          </Popconfirm>
          <Space>
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="primary" loading={savingMeta} onClick={handleSaveMeta}>
              {t("common.save")}
            </Button>
          </Space>
        </div>
      }
    >
      {/* ── Budget metadata ── */}
      <Form form={metaForm} layout="vertical">
        <Form.Item
          name="budget_name"
          label={t("categoryList.budgetName")}
          rules={[{ required: true, message: t("categoryList.budgetNameRequired") }]}
        >
          <Input placeholder={t("categoryList.budgetNamePlaceholder")} />
        </Form.Item>
        <Form.Item name="budget_notes" label={t("categoryList.budgetNotes")}>
          <Input.TextArea rows={2} placeholder={t("categoryList.budgetNotesPlaceholder")} />
        </Form.Item>
        <Form.Item
          name="allocated"
          label={t("categoryList.allocatedBudget")}
          rules={[{ required: true, message: t("categoryList.allocatedBudgetRequired") }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            prefix="$"
            formatter={(v) => formatInputNumber(v)}
            parser={(v) => parseInputNumber(v) as unknown as 0}
          />
        </Form.Item>
      </Form>

      <Divider titlePlacement="left" style={{ marginTop: 8 }}>
        {t("budgetItems.title")}
        {items.length > 0 && (
          <Text type="secondary" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
            {t("budgetItems.total")}: {formatCurrency(totalItems, currency)}
          </Text>
        )}
      </Divider>

      {/* ── Budget items table ── */}
      {itemsLoading ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}><Spin /></div>
      ) : (
        <>
          <Table
            dataSource={items}
            columns={columns}
            rowKey="item_id"
            size="small"
            pagination={false}
            locale={{ emptyText: t("budgetItems.noItems") }}
            className={styles.itemsTable}
          />

          {/* ── Add item row (ONE Form, one binding) ── */}
          {addingItem ? (
            <div className={styles.addRow}>
              <Form
                form={addForm}
                layout="inline"
                style={{ flex: 1, minWidth: 0 }}
                onFinish={handleAddItem}
              >
                <Form.Item
                  name="description"
                  rules={[{ required: true, message: t("budgetItems.descriptionRequired") }]}
                  style={{ flex: 1, minWidth: 100, marginBottom: 0 }}
                >
                  <Input size="small" placeholder={t("budgetItems.descriptionPlaceholder")} />
                </Form.Item>
                <Form.Item
                  name="amount"
                  rules={[{ required: true, message: t("budgetItems.amountRequired") }]}
                  style={{ width: 130, marginBottom: 0 }}
                >
                  <InputNumber
                    size="small"
                    min={0}
                    prefix="$"
                    style={{ width: "100%" }}
                    formatter={(v) => formatInputNumber(v)}
                    parser={(v) => parseInputNumber(v) as unknown as 0}
                  />
                </Form.Item>
                <Form.Item name="notes" style={{ flex: 1, minWidth: 80, marginBottom: 0 }}>
                  <Input size="small" placeholder={t("budgetItems.notesPlaceholder")} />
                </Form.Item>
              </Form>
              <Space size={4} style={{ flexShrink: 0 }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  loading={savingItem}
                  onClick={handleAddItem}
                >
                  {t("common.save")}
                </Button>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setAddingItem(false)}
                />
              </Space>
            </div>
          ) : (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => { setAddingItem(true); cancelEdit(); }}
              style={{ width: "100%", marginTop: 8 }}
            >
              {t("budgetItems.addItem")}
            </Button>
          )}
        </>
      )}
    </Drawer>
  );
}

