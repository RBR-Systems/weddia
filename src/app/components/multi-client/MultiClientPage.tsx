"use client";
import React from "react";
import { Card, Typography } from "antd";
import { MultiClientView } from "../event/budget/components/planner";

const { Title } = Typography;

export default function MultiClientPage() {
  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Multi-Client Budget Management
      </Title>
      <Card>
        <MultiClientView />
      </Card>
    </div>
  );
}
