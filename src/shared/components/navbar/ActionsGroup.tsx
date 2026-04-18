"use client";

import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { ThemeToggle } from "@/theme/ThemeToggle";
import styles from "./nav-bar.module.css";

interface ActionsGroupProps {
  onNewEvent: () => void;
  newEventLabel?: React.ReactNode;
}

const ActionsGroup: React.FC<ActionsGroupProps> = ({ onNewEvent, newEventLabel }) => (
  <div className={styles.end}>
    <Button icon={<PlusOutlined />} size="small" type="primary" onClick={onNewEvent}>
      {newEventLabel}
    </Button>
    <NotificationBell />
    <LanguageSwitcher />
    <ThemeToggle />
  </div>
);

export default React.memo(ActionsGroup);
