"use client";

import React from "react";
import { Space, Tag, Switch, Button, Input, Select } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Status } from "../../models/types";
import { useTranslation } from "react-i18next";
import { getStatusOptions, calculateProgress } from "../../utils/helpers";
import { TimelineItem } from "../../models/types";
import styles from "./StatusFilter.module.css";

type Props = {
  items: TimelineItem[];
  activeFilter: Status | "all";
  onFilterChange: (filter: Status | "all") => void;
  hideCompleted: boolean;
  onHideCompletedChange: (hide: boolean) => void;
  onAddClick?: () => void;
  // New props for filtering/search
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  types?: string[];
  selectedTypes?: string[];
  onTypesChange?: (types: string[]) => void;
  onClearFilters?: () => void;
  filteredCount?: number;
};

const { CheckableTag } = Tag;

const StatusFilter: React.FC<Props> = ({
  items,
  activeFilter,
  onFilterChange,
  hideCompleted,
  onHideCompletedChange,
  onAddClick,
  searchQuery,
  onSearchChange,
  types = [],
  selectedTypes = [],
  onTypesChange,
  onClearFilters,
  filteredCount,
}) => {
  const { t } = useTranslation();
  const progress = calculateProgress(items);

  const statusIcons = {
    completed: <CheckCircleOutlined />,
    in_progress: <PlayCircleOutlined />,
    pending: <ClockCircleOutlined />,
    delayed: <WarningOutlined />,
    cancelled: <CloseCircleOutlined />,
  };

  return (
    <div className={styles.container}>
      <Space orientation="vertical" className={styles.fullWidth} size="small">
        <div className={styles.controlsRow}>
          <Space size={[8, 8]} className={styles.topRow} align="center">
            <Input.Search
              placeholder={t("schedule.statusFilter.searchPlaceholder")}
              allowClear
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={styles.searchInput}
              size="small"
            />

            <Select
              mode="multiple"
              placeholder="Filter types"
              value={selectedTypes}
              onChange={(vals) => onTypesChange?.(vals as string[])}
              options={types.map((t) => ({ label: t, value: t }))}
              className={styles.typeSelect}
              size="small"
            />

            <Button size="small" onClick={() => onClearFilters?.()}>
              Clear
            </Button>

            {typeof filteredCount === "number" && (
              <Tag color="default" className={styles.filteredTag}>
                {filteredCount} shown
              </Tag>
            )}
          </Space>
          <Space size={[0, 8]} wrap>
            <span className={styles.filterLabel}>
              <FilterOutlined /> Filter:
            </span>

            <CheckableTag
              checked={activeFilter === "all"}
              onChange={() => onFilterChange("all")}
              className={styles.tag}
            >
              {t("schedule.statusFilter.allStatuses")} ({progress.total})
            </CheckableTag>

            <CheckableTag
              checked={activeFilter === "pending"}
              onChange={() => onFilterChange("pending")}
              className={styles.tag}
            >
              <Space size={4}>
                {statusIcons.pending}
                <span>{t("schedule.status.pending")} ({progress.pending})</span>
              </Space>
            </CheckableTag>

            <CheckableTag
              checked={activeFilter === "in_progress"}
              onChange={() => onFilterChange("in_progress")}
              className={styles.tag}
            >
              <Space size={4}>
                {statusIcons.in_progress}
                <span>{t("schedule.status.inProgress")} ({progress.in_progress})</span>
              </Space>
            </CheckableTag>

            <CheckableTag
              checked={activeFilter === "completed"}
              onChange={() => onFilterChange("completed")}
              className={styles.tag}
            >
              <Space size={4}>
                {statusIcons.completed}
                <span>{t("schedule.status.completed")} ({progress.completed})</span>
              </Space>
            </CheckableTag>

            {progress.delayed > 0 && (
              <CheckableTag
                checked={activeFilter === "delayed"}
                onChange={() => onFilterChange("delayed")}
                className={styles.tag}
              >
                <Space size={4}>
                  {statusIcons.delayed}
                  <span>{t("schedule.status.delayed")} ({progress.delayed})</span>
                </Space>
              </CheckableTag>
            )}

            {progress.cancelled > 0 && (
              <CheckableTag
                checked={activeFilter === "cancelled"}
                onChange={() => onFilterChange("cancelled")}
                className={styles.tag}
              >
                <Space size={4}>
                  {statusIcons.cancelled}
                  <span>{t("schedule.status.cancelled")} ({progress.cancelled})</span>
                </Space>
              </CheckableTag>
            )}
          </Space>

          <Space size="small" align="center">
            <Button
              type="primary"
              size="small"
              onClick={() => onAddClick?.()}
              className={styles.addBtn}
            >
              + Add
            </Button>
            <span className={styles.hideLabel}>Hide Completed</span>
            <Switch
              checked={hideCompleted}
              onChange={onHideCompletedChange}
              size="small"
            />
          </Space>
        </div>
      </Space>
    </div>
  );
};

export default StatusFilter;
