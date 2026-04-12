"use client";

import React from "react";
import styles from "./nav-bar.module.css";
import { DownOutlined, PlusOutlined } from "@ant-design/icons";
import { Space, Button, Dropdown, MenuProps } from "antd";
import { useEvent } from "@/app/contexts/EventContext";
import { EventActions } from "@/app/contexts/EventActions";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";
import { useTheme } from "@/theme/ThemeProvider";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { ThemeToggle } from "@/theme/ThemeToggle";

type NavBarProps = {
  currentView?: string;
};

export const NavBar: React.FC<NavBarProps> = ({ currentView }) => {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const {
    state: {
      events: { selectedEvent, allEvents },
    },
    dispatch,
  } = useEvent();

  const mapEventList = allEvents.map((item, index) => ({
    label: item.eventName,
    key: index.toString(),
  }));

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    dispatch({
      type: EventActions.SET_SELECTED_EVENT,
      payload: parseInt(e.key as string),
    });
  };

  const handleNewEvent = () => {
    dispatch({
      type: EventActions.SET_OPEN_CREATE_EVENT_MODAL,
      payload: true,
    });
  };

  return (
    <header className={styles.navbar}>
      {/* Left: logo + event selector */}
      <div className={styles.start}>
        <img
          src={mode === "dark" ? "/weddia-logo-dark.svg" : "/weddia-logo.svg"}
          alt="Wedd.IA"
          className={styles.logo}
        />

        <Dropdown menu={{ items: mapEventList, onClick: handleMenuClick }}>
          <Button size="small" className={styles.eventBtn}>
            <Space size={4}>
              <span className={styles.eventName}>
                {selectedEvent?.eventName || t("common.selectEvent")}
              </span>
              <DownOutlined style={{ fontSize: 10, opacity: 0.6 }} />
            </Space>
          </Button>
        </Dropdown>
      </div>

      {/* Right: actions */}
      <div className={styles.end}>
        <Button
          icon={<PlusOutlined />}
          size="small"
          type="primary"
          onClick={handleNewEvent}
        >
          {t("common.newEvent")}
        </Button>
        <NotificationBell />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
};
