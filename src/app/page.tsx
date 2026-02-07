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

export default function Home() {
  type MenuItem = Required<MenuProps>["items"][number];

  const [currentView, setCurrentView] = useState("events-hub");

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
      label: "Event Pages",
      icon: <ScheduleOutlined />,
      children: [
        {
          key: "events-hub",
          label: "Events Hub",
          icon: <HomeOutlined />,
          onClick: () => setCurrentView("events-hub"),
        },
        {
          key: "budget",
          label: "Budget",
          icon: <SettingOutlined />,
          onClick: () => setCurrentView("budget"),
        },
        {
          key: "table-assignment",
          label: "Table Assignment",
          icon: <TeamOutlined />,
          onClick: () => setCurrentView("table-assignment"),
        },
        {
          key: "schedule",
          label: "Schedule",
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
      label: "Planner",
      icon: <SettingOutlined />,
      children: [
        { key: "9", label: "Option 9" },
        { key: "10", label: "Option 10" },
      ],
    },
    {
      key: "events-list",
      label: "Events List",
      icon: <UnorderedListOutlined />,
      onClick: () => setCurrentView("events-list"),
    },
    {
      key: "multi-client",
      label: "Multi-Client Budgets",
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
