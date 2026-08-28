import { test, expect } from "@playwright/test";
import { expectAppShellLoaded, goToSection } from "../fixtures/helpers";

/**
 * Reverse-engineered happy path: an authenticated user can reach every primary
 * module from the sidebar without console errors or crashed views. This is the
 * baseline regression net for the whole app shell (routing, providers, i18n).
 */
test.describe("Navegación principal (happy path)", () => {
  test("carga el dashboard de eventos tras iniciar sesión", async ({ page }) => {
    await page.goto("/");
    await expectAppShellLoaded(page);
    await expect(page).toHaveURL(/\/(events-list)?$/);
    await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
  });

  const sections: Array<{ label: RegExp; url: RegExp; heading?: RegExp }> = [
    { label: /Tareas/, url: /\/tasks$/, heading: /Gestión de Tareas/ },
    { label: /Lista de invitados/, url: /\/guest-list$/, heading: /Lista de invitados/ },
    { label: /Cronograma/, url: /\/schedule$/ },
    { label: /Asignación de Mesas/, url: /\/table-assignment$/ },
    { label: /^dollar Presupuesto$/, url: /\/budget$/ },
    { label: /Categorías de Presupuesto/, url: /\/budget-categories$/ },
    { label: /Catálogo de Proveedores/, url: /\/vendor-catalog$/ },
  ];

  for (const section of sections) {
    test(`navega a "${section.label}" sin errores`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto("/");
      await expectAppShellLoaded(page);
      await goToSection(page, section.label);
      await expect(page).toHaveURL(section.url);
      if (section.heading) {
        await expect(page.getByRole("heading", { name: section.heading })).toBeVisible();
      }

      const unexpected = consoleErrors.filter(
        (e) => !e.includes("favicon.ico") && !e.includes("destroyOnClose"),
      );
      expect(unexpected, `Errores de consola inesperados: ${unexpected.join("\n")}`).toHaveLength(0);
    });
  }

  test("deep-link directo a una vista via URL carga esa vista (no el default)", async ({ page }) => {
    await page.goto("/tasks");
    await expectAppShellLoaded(page);
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: /Gestión de Tareas/ })).toBeVisible();
  });
});
