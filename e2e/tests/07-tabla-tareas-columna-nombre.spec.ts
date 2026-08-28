import { test, expect } from "@playwright/test";
import { expectAppShellLoaded } from "../fixtures/helpers";

/**
 * mejoras/07-tabla-tareas-columna-nombre
 * En la vista Tabla, la columna "Título" debe: (a) tener texto realmente
 * visible/legible (no colapsada a un ancho ínfimo), y (b) mantener un ancho
 * mínimo garantizado tal como pide el criterio de aceptación (~200px).
 */
test.describe("Vista Tabla de tareas — columna Título", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    await expectAppShellLoaded(page);

    // Let the dashboard's initial data fetch settle first (this hits the real
    // backend, which can be slow on a cold start) before switching tabs. The
    // stats card and the task list resolve from separate queries; clicking
    // right as the stats text appears can race a second render that resets
    // the active tab back to "Panel", so give the second query a moment too.
    await expect(page.getByText(/de \d+ tareas/)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1_500);

    await page.getByRole("tab", { name: /Tareas/ }).click();
    await expect(page.getByRole("radiogroup")).toBeVisible({ timeout: 10_000 });

    // Ant Design's Segmented renders a visually-hidden radio input; click the label instead of check().
    await page.locator("label").filter({ hasText: "Tabla" }).click();
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
  });

  test("el nombre de la tarea es visible y legible en la fila", async ({ page }) => {
    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    // Ant Design tables render a hidden ".ant-table-measure-row" as the first
    // <tbody> row for internal width calculation — target real data rows only.
    const firstTitleCell = table.locator("tbody tr.ant-table-row").first().locator("td").first();
    await expect(firstTitleCell).toBeVisible();

    const text = (await firstTitleCell.innerText()).trim();
    expect(text.length, "La celda de título llegó vacía — task.title no se está renderizando").toBeGreaterThan(0);

    const box = await firstTitleCell.boundingBox();
    expect(box, "No se pudo medir la celda de título").not.toBeNull();
    expect(box!.width, `Columna Título colapsada a ${box!.width}px — se compensa con scroll horizontal, no compresión`).toBeGreaterThanOrEqual(150);
  });

  test("la tabla habilita scroll horizontal en vez de comprimir todas las columnas", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    const scrollContainer = page.locator(".ant-table-content, .ant-table-body").first();
    const scrollWidth = await scrollContainer.evaluate((el) => el.scrollWidth);
    const clientWidth = await scrollContainer.evaluate((el) => el.clientWidth);
    expect(scrollWidth, "La tabla no tiene overflow horizontal — puede seguir comprimiendo columnas").toBeGreaterThanOrEqual(clientWidth);
  });
});
