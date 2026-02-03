"use client";

import React from "react";
import { Space, Tag, Switch, Divider, Button } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Status } from "../models/types";
import { STATUS_OPTIONS, calculateProgress } from "../utils/helpers";
import { TimelineItem } from "../models/types";

type Props = {
  items: TimelineItem[];
  activeFilter: Status | "all";
  onFilterChange: (filter: Status | "all") => void;
  hideCompleted: boolean;
  onHideCompletedChange: (hide: boolean) => void;
  onAddClick?: () => void;
};

const { CheckableTag } = Tag;

const StatusFilter: React.FC<Props> = ({
  items,
  activeFilter,
  onFilterChange,
  hideCompleted,
  onHideCompletedChange,
  onAddClick,
}) => {
  const progress = calculateProgress(items);

  const statusIcons = {
    completed: <CheckCircleOutlined />,
    in_progress: <PlayCircleOutlined />,
    pending: <ClockCircleOutlined />,
    delayed: <WarningOutlined />,
    cancelled: <CloseCircleOutlined />,
  };

  const getStatusCount = (status: Status | "all") => {
    if (status === "all") return progress.total;
    return progress[status] || 0;
  };

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 16px",
        background: "#fafafa",
        borderRadius: 8,
        border: "1px solid #f0f0f0",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Space size={[0, 8]} wrap>
            <span style={{ color: "#666", fontSize: 13, marginRight: 4 }}>
              <FilterOutlined /> Filter:
            </span>

            <CheckableTag
              checked={activeFilter === "all"}
              onChange={() => onFilterChange("all")}
              style={{
                fontSize: 13,
                padding: "2px 12px",
                borderRadius: 16,
              }}
            >
              All ({progress.total})
            </CheckableTag>

            <CheckableTag
              checked={activeFilter === "pending"}
              onChange={() => onFilterChange("pending")}
              style={{
                fontSize: 13,
                padding: "2px 12px",
                borderRadius: 16,
              }}
            >
              <Space size={4}>
                {statusIcons.pending}
                <span>Pending ({progress.pending})</span>
              </Space>
            </CheckableTag>

            <CheckableTag
              checked={activeFilter === "in_progress"}
              onChange={() => onFilterChange("in_progress")}
              style={{
                fontSize: 13,
                padding: "2px 12px",
                borderRadius: 16,
              }}
            >
              <Space size={4}>
                {statusIcons.in_progress}
                <span>In Progress ({progress.in_progress})</span>
              </Space>
            </CheckableTag>

            <CheckableTag
              checked={activeFilter === "completed"}
              onChange={() => onFilterChange("completed")}
              style={{
                fontSize: 13,
                padding: "2px 12px",
                borderRadius: 16,
              }}
            >
              <Space size={4}>
                {statusIcons.completed}
                <span>Completed ({progress.completed})</span>
              </Space>
            </CheckableTag>

            {progress.delayed > 0 && (
              <CheckableTag
                checked={activeFilter === "delayed"}
                onChange={() => onFilterChange("delayed")}
                style={{
                  fontSize: 13,
                  padding: "2px 12px",
                  borderRadius: 16,
                }}
              >
                <Space size={4}>
                  {statusIcons.delayed}
                  <span>Delayed ({progress.delayed})</span>
                </Space>
              </CheckableTag>
            )}

            {progress.cancelled > 0 && (
              <CheckableTag
                checked={activeFilter === "cancelled"}
                onChange={() => onFilterChange("cancelled")}
                style={{
                  fontSize: 13,
                  padding: "2px 12px",
                  borderRadius: 16,
                }}
              >
                <Space size={4}>
                  {statusIcons.cancelled}
                  <span>Cancelled ({progress.cancelled})</span>
                </Space>
              </CheckableTag>
            )}
          </Space>

          <Space size="small" align="center">
            {/** Add button placed next to the Hide Completed toggle */}
            <Button
              type="primary"
              size="small"
              onClick={() => onAddClick?.()}
              style={{ marginRight: 8 }}
            >
              + Add
            </Button>

            <span style={{ fontSize: 13, color: "#666" }}>Hide Completed</span>
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
