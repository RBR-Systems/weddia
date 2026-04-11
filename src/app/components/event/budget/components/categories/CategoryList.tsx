"use client";
import React, { useState } from "react";
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
  ColorPicker,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useBudget } from "../../contexts/BudgetContext";
import CategoryCard from "./CategoryCard";
import type { Category } from "../../types/budget.types";
import { CHART_COLORS } from "@/theme/chartColors";
import { useTheme } from "@/theme/ThemeProvider";
import { useTranslation } from "react-i18next";

const { Search } = Input;

export default function CategoryList() {
  const { message } = App.useApp();
  const { state, addCategory, updateCategory, deleteCategory } = useBudget();
  const { mode } = useTheme();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const filteredCategories = state.categories.filter((cat: Category) =>
    cat?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      allocated: category.allocated,
      color: category.color,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const colorValue =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || CHART_COLORS[mode][0];

      if (editingCategory) {
        updateCategory?.(editingCategory.id, { ...values, color: colorValue });
        message.success(t("categoryList.categoryUpdated"));
      } else {
        addCategory?.({
          id: `cat_${Date.now()}`,
          name: values.name,
          allocated: values.allocated || 0,
          spent: 0,
          remaining: values.allocated || 0,
          color: colorValue,
          expense_count: 0,
        });
        message.success(t("categoryList.categoryAdded"));
      }
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      // validation error
    }
  };

  const handleDelete = () => {
    if (editingCategory) {
      deleteCategory?.(editingCategory.id);
      message.success(t("categoryList.categoryDeleted"));
      setModalOpen(false);
    }
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
              onClick={handleAddCategory}
            >
              {t("categoryList.addCategory")}
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
                  onClick={handleEditCategory}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title={editingCategory ? t("categoryList.editCategory") : t("categoryList.addCategory")}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        footer={[
          editingCategory && (
            <Button key="delete" danger onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          ),
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            {t("common.cancel")}
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            {t("common.save")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t("categoryList.categoryName")}
            rules={[{ required: true, message: t("categoryList.categoryNameRequired") }]}
          >
            <Input placeholder={t("categoryList.categoryNamePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="allocated"
            label={t("categoryList.allocatedBudget")}
            rules={[{ required: true, message: t("categoryList.allocatedBudgetRequired") }]}
          >
            <InputNumber
              className="u-full-width"
              min={0}
              prefix="$"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as unknown as 0
              }
            />
          </Form.Item>
          <Form.Item name="color" label={t("categoryList.color")}>
            <ColorPicker />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
