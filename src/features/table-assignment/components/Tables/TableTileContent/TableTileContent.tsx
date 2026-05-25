import { memo } from "react";
import { Badge, Typography } from "antd";
import styles from "./TableTile.module.css";
import type { Table } from "../../../models/tableAssignment.models";

export default memo(function TableTileContent({
  occupancy,
  capacity,
  label,
  badgeColor,
}: {
  table: Table;
  occupancy: number;
  capacity: number;
  label: string;
  badgeColor: string;
}) {
  return (
    <div className={styles.tableTileHeader}>
      <Typography.Text strong className={styles.tileLabel}>
        {label}
      </Typography.Text>
      <Badge
        count={`${occupancy}/${capacity}`}
        showZero
        color={badgeColor}
        className={styles.occupancyBadge}
      />
    </div>
  );
});

