"use client";

import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { ThemeToggle } from "@/theme/ThemeToggle";
import styles from "./nav-bar.module.css";

interface ActionsGroupProps {
  readonly onNewEvent: () => void;
  readonly newEventLabel?: React.ReactNode;
  readonly canCreateEvent?: boolean;
}

const ActionsGroup: React.FC<ActionsGroupProps> = ({ onNewEvent, newEventLabel, canCreateEvent }) => (
  <div className={styles.end}>
    {canCreateEvent && (
      <Button icon={<PlusOutlined />} size="small" type="primary" onClick={onNewEvent}>
        {newEventLabel}
      </Button>
    )}
    <NotificationBell />
    <LanguageSwitcher />
    <ThemeToggle />
  </div>
);

export default React.memo(ActionsGroup);
