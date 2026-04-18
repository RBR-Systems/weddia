"use client";
import { useMemo } from "react";
import { Tooltip, Avatar } from "antd";
import { TeamOutlined, AppstoreOutlined, DollarOutlined, TagsOutlined, UnorderedListOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, CalendarOutlined, ShopOutlined } from "@ant-design/icons";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import styles from "./Sidebar.module.css";
import type { ReactNode } from "react";
import type { View } from "@/shared/components/AppShell/models/appShell.models";


interface NavItem {
  key: View;
  icon: ReactNode;
  label: string;
}

interface SidebarProps {
  collapsed: boolean;
  currentView: View;
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

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        key: "events-list",
        icon: <UnorderedListOutlined />,
        label: t("nav.eventsList"),
      },
      { key: "guest-list", icon: <TeamOutlined />, label: t("nav.guestList") },
      { key: "schedule", icon: <CalendarOutlined />, label: t("nav.schedule") },
      {
        key: "table-assignment",
        icon: <AppstoreOutlined />,
        label: t("nav.tableAssignment"),
      },
      { key: "budget", icon: <DollarOutlined />, label: t("nav.budget") },
      {
        key: "budget-categories",
        icon: <TagsOutlined />,
        label: t("nav.budgetCategories"),
      },
      {
        key: "vendor-catalog",
        icon: <ShopOutlined />,
        label: t("nav.vendorCatalog"),
      },
    ],
    [t],
  );

  const initials = useMemo(() => {
    if (!user) return "?";
    const fn = user.firstName ?? "";
    const ln = user.lastName ?? "";
    const i = `${fn?.[0] ?? ""}${ln?.[0] ?? ""}`.toUpperCase();
    return i || "?";
  }, [user]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={
            collapsed
              ? t("common.expandSidebar", "Expand sidebar")
              : t("common.collapseSidebar", "Collapse sidebar")
          }
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <nav
        className={styles.nav}
        aria-label={t("nav.primary", "Main navigation")}
      >
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const isActive = currentView === item.key;

            const btn = (
              <button
                type="button"
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={() => onNavigate(item.key)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {isActive && <span className={styles.activeIndicator} />}
              </button>
            );

            return (
              <li key={item.key} className={styles.navListItem}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right">
                    {btn}
                  </Tooltip>
                ) : (
                  btn
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userRow}>
          <Avatar size={32} className={styles.avatar}>
            {initials}
          </Avatar>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </span>
          </div>
        </div>

        <Tooltip
          title={collapsed ? t("common.logout", "Log out") : ""}
          placement="right"
        >
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logout}
            aria-label={t("common.logout", "Log out")}
          >
            <LogoutOutlined />
            <span className={styles.navLabel}>
              {t("common.logout", "Log out")}
            </span>
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

