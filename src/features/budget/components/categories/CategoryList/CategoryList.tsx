"use client";
import { useState, useMemo, useEffect } from "react";
import { App, Row, Col, Card, Button, Empty, Input, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useBudget } from "../../../contexts/BudgetContext";
import { useCatalogCategories } from "../../../hooks/useCatalogCategories";
import CategoryCard from "../CategoryCard/CategoryCard";
import CategoryDrawer from "../CategoryDrawer/CategoryDrawer";
import { CategoryCreateModal } from "../CategoryCreateModal/CategoryCreateModal";
import type { Category } from "../../../models/budget.models";
import { useTranslation } from "react-i18next";

const { Search } = Input;

export default function CategoryList() {
  const { message } = App.useApp();
  const { state, updateCategory, deleteCategory } = useBudget();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { catalogCategories, isLoading: catalogLoading, error: catalogError } = useCatalogCategories();

  useEffect(() => {
    if (!catalogError) return;
    message.error(t("categoryList.loadCatalogError"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogError]);

  const availableOptionsCount = useMemo(() => {
    const budgetedIds = new Set(
      state.categories.map((c: Category) => c.catalog_id).filter(Boolean),
    );
    return catalogCategories.filter((c) => !budgetedIds.has(c.category_id)).length;
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

  const handleDrawerSave = async (
    id: string,
    data: { budget_name?: string; budget_notes?: string; allocated?: number },
  ): Promise<void> => {
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
              disabled={availableOptionsCount === 0 && !catalogLoading}
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

      <CategoryCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        catalogCategories={catalogCategories}
        catalogLoading={catalogLoading}
      />

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

