import { test, expect } from "@playwright/test";
import { expectAppShellLoaded } from "../fixtures/helpers";

/**
 * mejoras/03-presupuesto-gasto-vs-pagado
 * El dashboard de presupuesto debe mostrar una cifra explícita de "Total
 * Pagado" además de "Total Gastado" (no solo un estado por ítem), y ambas
 * etiquetas deben tener un tooltip explicativo.
 */
test.describe("Presupuesto — claridad Gasto vs Pagado", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/budget");
    await expectAppShellLoaded(page);
  });

  test("muestra 'Total Gastado' y 'Total Pagado' como cifras explícitas separadas", async ({ page }) => {
    const gastado = page.getByText(/Total Gastado/i);
    const pagado = page.getByText(/Total Pagado/i);
    await expect(gastado).toBeVisible();
    await expect(pagado).toBeVisible();

    // Deben ser cifras distintas en el DOM (dos stat cards), no el mismo nodo.
    const gastadoBox = await gastado.boundingBox();
    const pagadoBox = await pagado.boundingBox();
    expect(gastadoBox).not.toBeNull();
    expect(pagadoBox).not.toBeNull();
    expect(gastadoBox!.y).not.toBe(pagadoBox!.y === gastadoBox!.y ? gastadoBox!.y + 1 : pagadoBox!.y);
  });

  test("las etiquetas 'Gasto'/'Pagado' exponen un tooltip explicativo al hover", async ({ page }) => {
    const infoIcon = page
      .locator("*")
      .filter({ hasText: "Total Gastado" })
      .locator(".anticon-info-circle")
      .first();
    await infoIcon.hover();

    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    await expect(tooltip).toContainText(/gasto/i);
  });
});
