"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  App,
  Row,
  Col,
  Card,
  Button,
  Empty,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import CategoryCard from "./CategoryCard";
import CategoryDrawer from "./CategoryDrawer";
import type { Category } from "../../types/budget.types";
import { CHART_COLORS } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import { CategoriesService, type BudgetCategory } from "@/app/components/budget-categories/categories.service";

const { Search } = Input;
const { Text } = Typography;

export default function CategoryList() {
  const { message } = App.useApp();
  const { state, addCategory, updateCategory, deleteCategory } = useBudget();
  const { mode } = useTheme();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [catalogCategories, setCatalogCategories] = useState<BudgetCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    setCatalogLoading(true);
    CategoriesService.getAll()
      .then(setCatalogCategories)
      .catch(() => message.error(t("categoryList.loadCatalogError")))
      .finally(() => setCatalogLoading(false));
  }, []);

  const availableCatalogOptions = useMemo(() => {
    const budgetedCatalogIds = new Set(
      state.categories.map((c: Category) => c.catalog_id).filter(Boolean),
    );
    return catalogCategories
      .filter((c) => !budgetedCatalogIds.has(c.category_id))
      .map((c) => ({
        value: c.category_id,
        label: c.name,
        description: c.description,
      }));
  }, [catalogCategories, state.categories]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return state.categories
      .filter((cat: Category) =>
        cat?.name?.toLowerCase().includes(term) ||
        cat?.budget_name?.toLowerCase().includes(term),
      )
      .sort((a: Category, b: Category) => {
        const pctA = a.allocated > 0 ? a.spent / a.allocated : 0;
        const pctB = b.allocated > 0 ? b.spent / b.allocated : 0;
        return pctB - pctA;
      });
  }, [state.categories, searchTerm]);

  const handleCardClick = (category: Category) => {
    setSelectedCategory(category);
    setDrawerOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const selected = catalogCategories.find(
        (c) => c.category_id === values.catalog_category_id,
      );
      if (!selected) return;

      const colorIndex = state.categories.length % CHART_COLORS[mode].length;
      addCategory?.({
        id: `cat_${Date.now()}`,
        catalog_id: selected.category_id,
        name: selected.name,
        description: selected.description ?? "",
        budget_name: values.budget_name,
        budget_notes: values.budget_notes ?? "",
        allocated: values.allocated ?? 0,
        spent: 0,
        remaining: values.allocated ?? 0,
        color: CHART_COLORS[mode][colorIndex],
        expense_count: 0,
      });
      message.success(t("categoryList.categoryAdded"));
      setCreateOpen(false);
    } catch {
      // validation error
    }
  };

  const handleDrawerSave = async (id: string, data: { budget_name?: string; budget_notes?: string; allocated?: number }): Promise<void> => {
    await updateCategory?.(id, data);
  };

  const handleDrawerDelete = (id: string) => {
    deleteCategory?.(id);
    message.success(t("categoryList.categoryDeleted"));
  };

  if (state.isLoading) {
    return <Card loading />;
  }

  return (
    <>
      <Card
        title={t("categoryList.title")}
        extra={
          <Space>
            <Search
              placeholder={t("categoryList.searchPlaceholder")}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
              disabled={availableCatalogOptions.length === 0 && !catalogLoading}
            >
              {t("categoryList.addBudget")}
            </Button>
          </Space>
        }
      >
        {filteredCategories.length === 0 ? (
          <Empty description={t("categoryList.noCategories")} />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredCategories.map((category: Category) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={category.id}>
                <CategoryCard
                  category={category}
                  currency={state.currency}
                  onClick={handleCardClick}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* ── Create modal ── */}
      <Modal
        title={t("categoryList.addBudget")}
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateOpen(false)}>
            {t("common.cancel")}
          </Button>,
          <Button key="save" type="primary" onClick={handleCreate}>
            {t("common.create")}
          </Button>,
        ]}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="catalog_category_id"
            label={t("categoryList.catalogCategory")}
            rules={[{ required: true, message: t("categoryList.categoryNameRequired") }]}
          >
            <Select
              placeholder={t("categoryList.selectCategoryPlaceholder")}
              loading={catalogLoading}
              options={availableCatalogOptions}
              optionRender={(option) => (
                <Space orientation="vertical" size={0}>
                  <span>{option.label}</span>
                  {option.data.description && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {option.data.description}
                    </Text>
                  )}
                </Space>
              )}
              notFoundContent={t("categoryList.allCategoriesBudgeted")}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
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
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as unknown as 0}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit + budget items drawer ── */}
      <CategoryDrawer
        open={drawerOpen}
        category={selectedCategory}
        currency={state.currency}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
      />
    </>
  );
}
