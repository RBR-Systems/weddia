import React, { memo } from "react";
import { Badge, Space, Typography } from "antd";
import styles from "./TableTile.module.css";
import type { Table } from "../../../models/types";

export default memo(function TableTileContent({
  table,
  occupancy,
  capacity,
  label,
  badgeColor,
  metersToPixels,
}: {
  table: Table;
  occupancy: number;
  capacity: number;
  label: string;
  badgeColor: string;
  metersToPixels: number;
}) {
  const widthPx = (table.width_m ?? 1.8) * metersToPixels;
  // Reduce threshold so labels show for smaller tables
  const tooSmall = widthPx < 120;
  return (
    <>
      <div className={styles.tableTileHeader}>
        {!tooSmall && (
          <Space size={8}>
            <Typography.Text strong>{label}</Typography.Text>
          </Space>
        )}
        <Badge
          count={tooSmall ? occupancy : `${occupancy}/${capacity}`}
          showZero={tooSmall}
          color={badgeColor}
          className={styles.occupancyBadge}
        />
      </div>
      {!tooSmall && (
        <Typography.Text type="secondary" className={styles.tableMeta}>
          {table.shape} • ({(table.x_m ?? 0).toFixed(2)}m,{" "}
          {(table.y_m ?? 0).toFixed(2)}m)
        </Typography.Text>
      )}
    </>
  );
});
