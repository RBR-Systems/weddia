"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/auth/LoginPage";
import AppShell from "./common/AppShell/AppShell";
import EventsHub from "./components/event/event-hub/events-hub";
import EventList from "./components/events-list/event-list";
import TableAssignmentPage from "./components/event/table-assignment/TableAssignmentPage";
import CreateEventModal from "./components/event/create-event-modal/create-event-modal";
import { DayOfEvent } from "./components/event/schedule";
import BudgetDashboard from "./components/event/budget/BudgetDashboard";
import MultiClientPage from "./components/multi-client/MultiClientPage";
import GuestList from "./components/event/guest-list/GuestList";
import BudgetCategoriesPage from "./components/budget-categories/BudgetCategoriesPage";

const VALID_VIEWS = new Set([
  "events-hub",
  "guest-list",
  "budget",
  "budget-categories",
  "table-assignment",
  "schedule",
  "events-list",
  "multi-client",
]);

const DEFAULT_VIEW = "events-list";

function getViewFromPath(): string {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const path = window.location.pathname.replace(/^\//, "");
  return VALID_VIEWS.has(path) ? path : DEFAULT_VIEW;
}

export default function Home() {
  const { token, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState(DEFAULT_VIEW);

  // Sync URL → view on mount + back/forward
  useEffect(() => {
    setCurrentView(getViewFromPath());

    const onPop = () => setCurrentView(getViewFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (view: string) => {
    if (view === currentView) return;
    setCurrentView(view);
    window.history.pushState({ view }, "", `/${view}`);
  };

  const renderContent = () => {
    switch (currentView) {
      case "events-hub":       return <EventsHub />;
      case "guest-list":       return <GuestList />;
      case "events-list":      return <EventList />;
      case "multi-client":     return <MultiClientPage />;
      case "table-assignment": return <TableAssignmentPage />;
      case "schedule":         return <DayOfEvent />;
      case "budget":            return <BudgetDashboard />;
      case "budget-categories": return <BudgetCategoriesPage />;
      default:                 return <EventsHub />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  return (
    <AppShell currentView={currentView} onNavigate={navigate}>
      {renderContent()}
      <CreateEventModal />
    </AppShell>
  );
}
