import { test, expect } from "@playwright/test";
import { expectAppShellLoaded } from "../fixtures/helpers";

/**
 * mejoras/05-orden-menu-tareas
 * "Tareas" debe aparecer inmediatamente después de "Lista de eventos" en el
 * sidebar. Regresión directa contra el orden original reportado en
 * mejoras/05-orden-menu-tareas/requirements.md (Tareas estaba en la posición 8).
 */
test("el sidebar muestra Tareas justo después de Lista de Eventos", async ({ page }) => {
  await page.goto("/");
  await expectAppShellLoaded(page);

  const nav = page.getByRole("navigation", { name: /Main navigation|nav.primary/i });
  const items = nav.getByRole("listitem");

  const labels = await items.evaluateAll((nodes) =>
    nodes.map((n) => n.textContent?.trim() ?? "").filter(Boolean),
  );

  const eventsIdx = labels.findIndex((l) => /Lista de Eventos/.test(l));
  const tasksIdx = labels.findIndex((l) => /Tareas/.test(l));

  expect(eventsIdx, `"Lista de Eventos" no encontrado en: ${labels.join(", ")}`).toBeGreaterThanOrEqual(0);
  expect(tasksIdx, `"Tareas" no encontrado en: ${labels.join(", ")}`).toBeGreaterThanOrEqual(0);
  expect(tasksIdx, `Orden actual: ${labels.join(" → ")}`).toBe(eventsIdx + 1);
});
