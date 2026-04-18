"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Input,
  Modal,
  Form,
  Tooltip,
  Empty,
  Spin,
  App,
  Popconfirm,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { CategoriesService, type BudgetCategory } from "./categories.service";
import { useTranslation } from "react-i18next";
import styles from "./BudgetCategoriesPage.module.css";

const { Text } = Typography;

export default function BudgetCategoriesPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await CategoriesService.getAll();
      setCategories(data);
    } catch {
      message.error(t("budgetCategories.loadError"));
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [categories, search]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(cat: BudgetCategory) {
    setEditing(cat);
    form.setFieldsValue({ name: cat.name, description: cat.description });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await CategoriesService.update(editing.category_id, values.name, values.description ?? "");
        setCategories((prev) =>
          prev.map((c) =>
            c.category_id === editing.category_id
              ? { ...c, name: values.name, description: values.description ?? "" }
              : c,
          ),
        );
        message.success(t("budgetCategories.updatedSuccess"));
      } else {
        const created = await CategoriesService.create(values.name, values.description ?? "");
        setCategories((prev) => [...prev, created]);
        message.success(t("budgetCategories.createdSuccess"));
      }
      setModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return; // validation error, form handles it
      message.error(t("budgetCategories.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: BudgetCategory) {
    try {
      await CategoriesService.remove(cat.category_id);
      setCategories((prev) => prev.filter((c) => c.category_id !== cat.category_id));
      message.success(t("budgetCategories.deletedSuccess"));
    } catch {
      message.error(t("budgetCategories.deleteError"));
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{t("budgetCategories.title")}</h1>
          <span className={styles.subtitle}>
            {t("budgetCategories.subtitle", { count: categories.length })}
          </span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t("budgetCategories.newCategory")}
        </Button>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <Input.Search
          className={styles.searchInput}
          placeholder={t("budgetCategories.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.emptyWrap}>
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              search
                ? t("budgetCategories.noResults")
                : t("budgetCategories.empty")
            }
          >
            {!search && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                {t("budgetCategories.newCategory")}
              </Button>
            )}
          </Empty>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((cat) => (
            <div key={cat.category_id} className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <TagsOutlined />
              </div>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryName}>{cat.name}</span>
                {cat.description ? (
                  <span className={styles.categoryDesc}>{cat.description}</span>
                ) : (
                  <span className={styles.categoryDesc} style={{ fontStyle: "italic" }}>
                    {t("budgetCategories.noDescription")}
                  </span>
                )}
              </div>
              <div className={styles.categoryActions}>
                <Tooltip title={t("common.edit")}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(cat)}
                  />
                </Tooltip>
                <Popconfirm
                  title={t("budgetCategories.deleteConfirmTitle")}
                  description={t("budgetCategories.deleteConfirmDesc", { name: cat.name })}
                  onConfirm={() => handleDelete(cat)}
                  okText={t("common.delete")}
                  cancelText={t("common.cancel")}
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title={t("common.delete")}>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? t("budgetCategories.editTitle") : t("budgetCategories.createTitle")}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? t("common.save") : t("common.create")}
        cancelText={t("common.cancel")}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="name"
            label={t("budgetCategories.fieldName")}
            rules={[{ required: true, message: t("budgetCategories.nameRequired") }]}
          >
            <Input
              placeholder={t("budgetCategories.namePlaceholder")}
              maxLength={80}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={t("budgetCategories.fieldDescription")}
          >
            <Input.TextArea
              placeholder={t("budgetCategories.descriptionPlaceholder")}
              rows={3}
              maxLength={255}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
