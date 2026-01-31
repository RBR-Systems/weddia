import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import styles from "./UnassignedDropZone.module.css";
export default memo(function UnassignedDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });
  return (
    <div
      ref={setNodeRef}
      className={[
        styles.unassignedDropZone,
        isOver ? styles.dropZoneOver : "",
      ].join(" ")}
    >
      <Space size={8} align="center">
        <UserOutlined />
        <Typography.Text strong>Drop here to unassign</Typography.Text>
      </Space>
      <Typography.Text type="secondary" className={styles.dropZoneHint}>
        Drag a guest onto a table tile to assign.
      </Typography.Text>
    </div>
  );
});
