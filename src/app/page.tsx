"use client";

import { NavBar } from "./common/navbar/nav-bar";
import styles from "./page.module.css";
import { Menu, MenuProps } from "antd";
import {
  HomeOutlined,
  ScheduleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import EventsHub from "./components/event/event-hub/events-hub";
import EventList from "./components/events-list/event-list";
import TableAssignmentPage from "./components/event/table-assignment/TableAssignmentPage";
import CreateEventModal from "./components/event/create-event-modal/create-event-modal";
import { Schedule } from "./components/event/schedule";
import BudgetDashboard from "./components/event/budget/BudgetDashboard";
import MultiClientPage from "./components/multi-client/MultiClientPage";
import { useTranslation } from "react-i18next";

export default function Home() {
  type MenuItem = Required<MenuProps>["items"][number];

  const [currentView, setCurrentView] = useState("events-hub");
  const { t } = useTranslation();

  const renderContent = () => {
    switch (currentView) {
      case "events-hub":
        return <EventsHub />;
      case "events-list":
        return <EventList />;
      case "multi-client":
        return <MultiClientPage />;
      case "table-assignment":
        return <TableAssignmentPage />;
      case "schedule":
        return <Schedule />;
      case "budget":
        return <BudgetDashboard />;
      default:
        return <EventsHub />;
    }
  };

  const items: MenuItem[] = [
    {
      key: "events",
      label: t("nav.eventPages"),
      icon: <ScheduleOutlined />,
      children: [
        {
          key: "events-hub",
          label: t("nav.eventsHub"),
          icon: <HomeOutlined />,
          onClick: () => setCurrentView("events-hub"),
        },
        {
          key: "budget",
          label: t("nav.budget"),
          icon: <SettingOutlined />,
          onClick: () => setCurrentView("budget"),
        },
        {
          key: "table-assignment",
          label: t("nav.tableAssignment"),
          icon: <TeamOutlined />,
          onClick: () => setCurrentView("table-assignment"),
        },
        {
          key: "schedule",
          label: t("nav.schedule"),
          icon: <ScheduleOutlined />,
          onClick: () => setCurrentView("schedule"),
        },
      ],
    },
    {
      type: "divider",
    },
    {
      key: "planner",
      label: t("nav.planner"),
      icon: <SettingOutlined />,
      children: [
        { key: "9", label: t("nav.option", { number: 9 }) },
        { key: "10", label: t("nav.option", { number: 10 }) },
      ],
    },
    {
      key: "events-list",
      label: t("nav.eventsList"),
      icon: <UnorderedListOutlined />,
      onClick: () => setCurrentView("events-list"),
    },
    {
      key: "multi-client",
      label: t("nav.multiClient"),
      icon: <TeamOutlined />,
      onClick: () => setCurrentView("multi-client"),
    },
  ];

  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={styles["page"]}>
      <NavBar
        state={collapsed}
        setCollapsed={setCollapsed}
        currentView={currentView}
      />
      <div className={styles["page-container"]}>
        <div className={styles["menu-container"]}>
          <Menu
            onClick={() => {}}
            style={{
              maxWidth: "fit-content",
            }}
            className={styles["sidebar"]}
            mode="inline"
            inlineCollapsed={collapsed}
            items={items}
          />
        </div>
        <div className={styles["page-content"]}>{renderContent()}</div>
      </div>

      <CreateEventModal></CreateEventModal>
    </div>
  );
}
