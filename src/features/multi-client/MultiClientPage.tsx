"use client";

import { Typography } from "antd";
import Card from "@/shared/components/Card/Card";
import styles from "./multi-client.module.css";
import { MultiClientView } from "@/features/budget/components/bulk";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function MultiClientPage() {
  const { t } = useTranslation();
  return (
    <div className={styles["pageContainer"]}>
      <Title level={3} className={styles["pageTitle"]}>
        {t("multiClient.title")}
      </Title>
      <Card>
        <MultiClientView />
      </Card>
    </div>
  );
}

