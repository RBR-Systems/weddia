"use client";

import { useState, useMemo } from "react";
import { Button, Input, Modal, Form, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useCatalogCategories } from "./hooks/useCatalogCategories";
import { CatalogCategoryList } from "./components/categories/CatalogCategoryList/CatalogCategoryList";
import type { CatalogCategory } from "./models/budget.models";
import styles from "./BudgetCategoriesPage.module.css";

const CATEGORY_FORM_STYLE = { marginTop: 8 } as const;

export default function BudgetCategoriesPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { catalogCategories, isLoading, createCategory, updateCategory, deleteCategory } =
    useCatalogCategories();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogCategories;
    return catalogCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
    );
  }, [catalogCategories, search]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(cat: CatalogCategory) {
    setEditing(cat);
    form.setFieldsValue({ name: cat.name, description: cat.description });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await updateCategory(editing.category_id, values.name, values.description ?? "");
        message.success(t("budgetCategories.updatedSuccess"));
      } else {
        await createCategory(values.name, values.description ?? "");
        message.success(t("budgetCategories.createdSuccess"));
      }
      setModalOpen(false);
    } catch (err: unknown) {
      if (err != null && typeof err === "object" && "errorFields" in err) return;
      message.error(t("budgetCategories.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: CatalogCategory) {
    try {
      await deleteCategory(cat.category_id);
      message.success(t("budgetCategories.deletedSuccess"));
    } catch {
      message.error(t("budgetCategories.deleteError"));
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{t("budgetCategories.title")}</h1>
          <span className={styles.subtitle}>
            {t("budgetCategories.subtitle", { count: catalogCategories.length })}
          </span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t("budgetCategories.newCategory")}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input.Search
          className={styles.searchInput}
          placeholder={t("budgetCategories.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <CatalogCategoryList
        loading={isLoading}
        categories={filtered}
        search={search}
        onCreateClick={openCreate}
        onEditClick={openEdit}
        onDeleteConfirm={handleDelete}
      />

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
        <Form form={form} layout="vertical" style={CATEGORY_FORM_STYLE}>
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
          <Form.Item name="description" label={t("budgetCategories.fieldDescription")}>
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

