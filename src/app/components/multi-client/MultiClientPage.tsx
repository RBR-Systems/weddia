"use client";
import React from "react";
import { Typography } from "antd";
import Card from "@/app/common/Card/card";
import styles from "./multi-client.module.css";
import { MultiClientView } from "../event/budget/components/planner";

const { Title } = Typography;

export default function MultiClientPage() {
  return (
    <div className={styles["pageContainer"]}>
      <Title level={3} className={styles["pageTitle"]}>
        Multi-Client Budget Management
      </Title>
      <Card>
        <MultiClientView />
      </Card>
    </div>
  );
}
