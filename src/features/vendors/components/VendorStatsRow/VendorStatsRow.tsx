"use client";
import { Row, Col } from "antd";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import Card from "@/shared/components/Card/Card";
import Statistic from "@/shared/components/AnimatedStatistic/AnimatedStatistic";
import type { Vendor } from "@/shared/models/vendor.models";
import styles from "./VendorStatsRow.module.css";

interface VendorStatsRowProps {
  vendors: Vendor[];
}

export const VendorStatsRow = ({ vendors }: VendorStatsRowProps) => {
  const { t } = useTranslation();
  const activeCount = useMemo(
    () => vendors.filter((v) => v.is_active !== false).length,
    [vendors],
  );

  return (
    <Row gutter={16} className={styles.rowSpacing}>
      <Col xs={24} sm={8}>
        <Card size="small">
          <Statistic title={t("vendorList.totalVendors")} value={vendors.length} />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card size="small">
          <Statistic title={t("vendorList.activeVendors")} value={activeCount} />
        </Card>
      </Col>
    </Row>
  );
};
