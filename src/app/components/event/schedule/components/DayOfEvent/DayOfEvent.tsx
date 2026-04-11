"use client";

import React, { useCallback, useState } from "react";
import { Tabs } from "antd";
import {
  ScheduleOutlined,
  CheckSquareOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import Schedule from "../../Schedule";
import { CheckInDashboard } from "../CheckIn";
import TableAssignmentPage from "../../../table-assignment/TableAssignmentPage";
import styles from "./DayOfEvent.module.css";

const DayOfEvent: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("schedule");
  const [highlightTableId, setHighlightTableId] = useState<string | null>(null);

  const handleNavigateToTable = useCallback((tableId: string) => {
    setHighlightTableId(tableId);
    setActiveTab("table-view");
  }, []);

  const items = [
    {
      key: "schedule",
      label: (
        <span>
          <ScheduleOutlined />
          {t("checkIn.tabs.schedule")}
        </span>
      ),
      children: <Schedule />,
    },
    {
      key: "check-in",
      label: (
        <span>
          <CheckSquareOutlined />
          {t("checkIn.tabs.checkIn")}
        </span>
      ),
      children: <CheckInDashboard onNavigateToTable={handleNavigateToTable} />,
    },
    {
      key: "table-view",
      label: (
        <span>
          <AppstoreOutlined />
          {t("checkIn.tabs.tableView")}
        </span>
      ),
      children: <TableAssignmentPage highlightTableId={highlightTableId} />,
    },
  ];

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    // Clear the highlight when the user manually switches tabs
    if (key !== "table-view") {
      setHighlightTableId(null);
    }
  }, []);

  return (
    <div className={styles.container}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={items}
        className={styles.tabs}
        size="large"
        destroyOnHidden={false}
      />
    </div>
  );
};

export default DayOfEvent;
