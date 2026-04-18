"use client";

import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import { NavBar } from "../navbar/nav-bar";
import styles from "./AppShell.module.css";

type View = string;

interface AppShellProps {
  currentView: View;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export default function AppShell({ currentView, onNavigate, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.shell}>
      <NavBar currentView={currentView} />
      <div className={styles.body}>
        <Sidebar
          collapsed={collapsed}
          currentView={currentView}
          onNavigate={(view) => onNavigate(view)}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
