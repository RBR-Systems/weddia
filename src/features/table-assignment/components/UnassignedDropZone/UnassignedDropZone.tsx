import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styles from "./UnassignedDropZone.module.css";
export default memo(function UnassignedDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });
  const { t } = useTranslation();
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
        <Typography.Text strong>{t("tableAssignment.dropToUnassign")}</Typography.Text>
      </Space>
    </div>
  );
});

