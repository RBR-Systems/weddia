"use client";
import { useMemo } from "react";
import { App, Modal, Form, Input, InputNumber, Select, Space, Button, Typography } from "antd";
import type { ReactNode } from "react";
import { useBudget } from "../../../contexts/BudgetContext";
import { useTheme } from "@/theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import { formatInputNumber, parseInputNumber } from "@/shared/utils/formatters.utils";
import { CHART_COLORS } from "@/theme/chartColors";
import type { Category } from "../../../models/budget.models";
import type { BudgetCategory } from "../../../api/categoriesApi";

const { Text } = Typography;

interface CatalogOptionProps {
  readonly label?: ReactNode;
  readonly description?: string;
}

const CatalogOption = ({ label, description }: CatalogOptionProps) => (
  <Space orientation="vertical" size={0}>
    <span>{label}</span>
    {description && (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {description}
      </Text>
    )}
  </Space>
);

const CATEGORY_CREATE_FORM_STYLE = { marginTop: 8 } as const;

export interface CategoryCreateModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly catalogCategories: BudgetCategory[];
  readonly catalogLoading: boolean;
}

export function CategoryCreateModal({
  open,
  onClose,
  catalogCategories,
  catalogLoading,
}: CategoryCreateModalProps) {
  const { message } = App.useApp();
  const { state, addCategory } = useBudget();
  const { mode } = useTheme();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const availableOptions = useMemo(() => {
    const budgetedIds = new Set(
      state.categories.map((c: Category) => c.catalog_id).filter(Boolean),
    );
    return catalogCategories
      .filter((c) => !budgetedIds.has(c.category_id))
      .map((c) => ({ value: c.category_id, label: c.name, description: c.description }));
  }, [catalogCategories, state.categories]);

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      const selected = catalogCategories.find((c) => c.category_id === values.catalog_category_id);
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
      form.resetFields();
      onClose();
    } catch {
      // validation error — fields show inline messages
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t("categoryList.addBudget")}
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t("common.cancel")}
        </Button>,
        <Button key="save" type="primary" onClick={handleConfirm}>
          {t("common.create")}
        </Button>,
      ]}
      destroyOnHidden={false}
      forceRender
    >
      <Form form={form} layout="vertical" style={CATEGORY_CREATE_FORM_STYLE}>
        <Form.Item
          name="catalog_category_id"
          label={t("categoryList.catalogCategory")}
          rules={[{ required: true, message: t("categoryList.categoryNameRequired") }]}
        >
          <Select
            placeholder={t("categoryList.selectCategoryPlaceholder")}
            loading={catalogLoading}
            options={availableOptions}
            optionRender={(option) => (
              <CatalogOption label={option.label} description={option.data?.description} />
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
            formatter={(v) => formatInputNumber(v)}
            parser={(v) => parseInputNumber(v) as unknown as 0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
