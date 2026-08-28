import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

vi.mock("@/shared/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { firstName: "Jane", lastName: "Doe" },
    logout: vi.fn(),
    isPlatformAdmin: false,
    isOrgAdmin: false,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string"
        ? fallback
        : {
            "nav.eventsList": "Lista de eventos",
            "nav.tasks": "Tareas",
            "nav.guestList": "Invitados",
            "nav.schedule": "Cronograma",
            "nav.tableAssignment": "Mesas",
            "nav.budget": "Presupuesto",
            "nav.budgetCategories": "Categorías",
            "nav.vendorCatalog": "Proveedores",
            "nav.organizations": "Organizaciones",
            "nav.team": "Equipo",
            "nav.primary": "Main navigation",
          }[key] ?? key,
  }),
}));

describe("Sidebar navigation order", () => {
  it("renders 'Tareas' immediately after 'Lista de eventos' in the menu", () => {
    render(
      <Sidebar
        collapsed={false}
        currentView="events-list"
        onNavigate={() => {}}
        onToggle={() => {}}
      />,
    );

    const items = screen.getAllByRole("listitem");
    const labels = items.map((item) => item.textContent?.trim());

    const eventsIndex = labels.findIndex((l) => l?.includes("Lista de eventos"));
    const tasksIndex = labels.findIndex((l) => l?.includes("Tareas"));

    expect(eventsIndex).toBeGreaterThanOrEqual(0);
    expect(tasksIndex).toBe(eventsIndex + 1);
  });
});
