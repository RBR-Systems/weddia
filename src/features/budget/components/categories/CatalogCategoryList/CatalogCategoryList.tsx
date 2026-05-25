"use client";

import { Button, Empty, Spin, Tooltip, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from "@ant-design/icons";
import type { CatalogCategoryListProps } from "../../../models/budget.models";
import { useTranslation } from "react-i18next";
import styles from "./CatalogCategoryList.module.css";

export function CatalogCategoryList({
  loading,
  categories,
  search,
  onCreateClick,
  onEditClick,
  onDeleteConfirm,
}: CatalogCategoryListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={styles.emptyWrap}>
        <Spin />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={search ? t("budgetCategories.noResults") : t("budgetCategories.empty")}
        >
          {!search && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
              {t("budgetCategories.newCategory")}
            </Button>
          )}
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {categories.map((cat) => (
        <div key={cat.category_id} className={styles.categoryCard}>
          <div className={styles.categoryIcon}>
            <TagsOutlined />
          </div>
          <div className={styles.categoryInfo}>
            <span className={styles.categoryName}>{cat.name}</span>
            {cat.description ? (
              <span className={styles.categoryDesc}>{cat.description}</span>
            ) : (
              <span className={`${styles.categoryDesc} ${styles.categoryDescEmpty}`}>
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
                onClick={() => onEditClick(cat)}
              />
            </Tooltip>
            <Popconfirm
              title={t("budgetCategories.deleteConfirmTitle")}
              description={t("budgetCategories.deleteConfirmDesc", { name: cat.name })}
              onConfirm={() => onDeleteConfirm(cat)}
              okText={t("common.delete")}
              cancelText={t("common.cancel")}
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={t("common.delete")}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        </div>
      ))}
    </div>
  );
}
