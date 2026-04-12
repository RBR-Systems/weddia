"use client";

import React from "react";
import { Tooltip, Avatar } from "antd";
import {
  TeamOutlined,
  AppstoreOutlined,
  DollarOutlined,
  TagsOutlined,
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import styles from "./Sidebar.module.css";

type View =
  | "events-hub"
  | "guest-list"
  | "schedule"
  | "table-assignment"
  | "budget"
  | "budget-categories"
  | "events-list"
  | "multi-client";

interface NavItem {
  key: View;
  icon: React.ReactNode;
  label: string;
}

interface SidebarProps {
  collapsed: boolean;
  currentView: string;
  onNavigate: (view: View) => void;
  onToggle: () => void;
}

export default function Sidebar({
  collapsed,
  currentView,
  onNavigate,
  onToggle,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    { key: "events-list", icon: <UnorderedListOutlined />, label: t("nav.eventsList") },
    { key: "guest-list", icon: <TeamOutlined />, label: t("nav.guestList") },
    { key: "schedule", icon: <CalendarOutlined />, label: t("nav.schedule") },
    { key: "table-assignment", icon: <AppstoreOutlined />, label: t("nav.tableAssignment") },
    { key: "budget", icon: <DollarOutlined />, label: t("nav.budget") },
    { key: "budget-categories", icon: <TagsOutlined />, label: t("nav.budgetCategories") },
  ];

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Header — solo toggle */}
      <div className={styles.header}>
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Nav items */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = currentView === item.key;
          const btn = (
            <button
              key={item.key}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              onClick={() => onNavigate(item.key)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {isActive && <span className={styles.activeIndicator} />}
            </button>
          );

          return collapsed ? (
            <Tooltip key={item.key} title={item.label} placement="right">
              {btn}
            </Tooltip>
          ) : (
            btn
          );
        })}
      </nav>

      {/* Footer — user + logout */}
      <div className={styles.footer}>
        <div className={styles.userRow}>
          <Avatar
            size={32}
            style={{
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </span>
          </div>
        </div>
        <Tooltip title={collapsed ? t("common.logout", "Log out") : ""} placement="right">
          <button className={styles.logoutBtn} onClick={logout} aria-label="Log out">
            <LogoutOutlined />
            <span className={styles.navLabel}>{t("common.logout", "Log out")}</span>
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
