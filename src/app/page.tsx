"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useAuth } from "@/shared/contexts/AuthContext";
import LoginPage from "@/features/auth/LoginPage";
import AppShell from "@/shared/components/AppShell/AppShell";
import EventsHub from "@/features/event-hub/EventsHub";
import EventList from "@/features/events-list/EventList";
import TableAssignmentPage from "@/features/table-assignment/TableAssignmentPage";
import CreateEventModal from "@/features/create-event/CreateEventModal";
import { DayOfEvent } from "@/features/schedule";
import BudgetDashboard from "@/features/budget/BudgetDashboard";
import MultiClientPage from "@/features/multi-client/MultiClientPage";
import GuestList from "@/features/guest-list/GuestList";
import BudgetCategoriesPage from "@/features/budget/components/budget-categories/BudgetCategoriesPage";
import EventTasksDashboard from "@/features/event-tasks/EventTasksDashboard";
import VendorCatalog from "@/features/vendors/VendorCatalog";

const VALID_VIEWS = new Set([
  "events-hub",
  "guest-list",
  "budget",
  "budget-categories",
  "vendor-catalog",
  "table-assignment",
  "schedule",
  "events-list",
  "multi-client",
  "tasks",
]);

const DEFAULT_VIEW = "events-list";

function getViewFromPath(): string {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const path = globalThis.location.pathname.replace(/^\//, "");
  return VALID_VIEWS.has(path) ? path : DEFAULT_VIEW;
}

export default function Home() {
  const { token, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState(DEFAULT_VIEW);

  // Sync URL → view on mount + back/forward
  useEffect(() => {
    setCurrentView(getViewFromPath());

    const onPop = () => setCurrentView(getViewFromPath());
    globalThis.addEventListener("popstate", onPop);
    return () => globalThis.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (view: string) => {
    if (view === currentView) return;
    setCurrentView(view);
    globalThis.history.pushState({ view }, "", `/${view}`);
  };

  const renderContent = () => {
    switch (currentView) {
      case "events-hub":
        return <EventsHub />;
      case "guest-list":
        return <GuestList />;
      case "events-list":
        return <EventList />;
      case "multi-client":
        return <MultiClientPage />;
      case "table-assignment":
        return <TableAssignmentPage />;
      case "schedule":
        return <DayOfEvent />;
      case "budget":
        return <BudgetDashboard />;
      case "budget-categories":
        return <BudgetCategoriesPage />;
      case "vendor-catalog":
        return <VendorCatalog />;
      case "tasks":
        return <EventTasksDashboard />;
      default:
        return <EventsHub />;
    }
  };

  if (isLoading) {
    return (
      <div className="fullscreen-center">
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


