"use client";
import React from "react";
import { Typography } from "antd";
import Card from "@/app/common/Card/card";
import styles from "./multi-client.module.css";
import { MultiClientView } from "../event/budget/components/planner";
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
