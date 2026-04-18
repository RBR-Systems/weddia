"use client";

import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import { NavBar } from "../navbar/NavBar";
import styles from "./AppShell.module.css";

import type { AppShellProps, View } from './models/appShell.models';

const AppShell: React.FC<AppShellProps> = ({ currentView, onNavigate, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = React.useCallback(() => setCollapsed((c) => !c), []);
  const handleNavigate = React.useCallback((view: View) => onNavigate(view), [onNavigate]);

  return (
    <div className={styles.shell}>
      <NavBar currentView={currentView} />
      <div className={styles.body}>
        <Sidebar
          collapsed={collapsed}
          currentView={currentView}
          onNavigate={handleNavigate}
          onToggle={handleToggle}
        />
        <main className={styles.content} role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
