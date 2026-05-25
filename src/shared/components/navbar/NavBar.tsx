"use client";
import React, { useCallback } from "react";
import styles from "./nav-bar.module.css";
import { MenuProps } from "antd";
import EventSelector from "./EventSelector";
import ActionsGroup from "./ActionsGroup";
import { useEvent } from "@/shared/contexts/EventContext";
import { EventActions } from "@/shared/contexts/eventActions";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeProvider";
import type { View } from "@/shared/components/AppShell/models/appShell.models";

type NavBarProps = { readonly currentView?: View };

const NavBarComponent: React.FC<NavBarProps> = () => {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const {
    state: {
      events: { selectedEvent, allEvents },
    },
    dispatch,
  } = useEvent();

  const handleMenuClick: MenuProps["onClick"] = useCallback(
    (e: Parameters<NonNullable<MenuProps["onClick"]>>[0]) => {
      dispatch({
        type: EventActions.SET_SELECTED_EVENT,
        payload: Number.parseInt(e.key as string),
      });
    },
    [dispatch],
  );

  const handleNewEvent = useCallback(() => {
    dispatch({
      type: EventActions.SET_OPEN_CREATE_EVENT_MODAL,
      payload: true,
    });
  }, [dispatch]);

  return (
    <header className={styles.navbar}>
      {/* Left: logo + event selector */}
      <div className={styles.start}>
        <img
          src={mode === "dark" ? "/weddia-logo-dark.svg" : "/weddia-logo.svg"}
          alt="Wedd.IA"
          className={styles.logo}
        />

        <EventSelector
          allEvents={allEvents}
          selectedEvent={selectedEvent}
          onMenuClick={handleMenuClick}
          placeholder={t("common.selectEvent")}
        />
      </div>

      {/* Right: actions */}
      <ActionsGroup
        onNewEvent={handleNewEvent}
        newEventLabel={t("common.newEvent")}
      />
    </header>
  );
};

export const NavBar = React.memo(NavBarComponent);

