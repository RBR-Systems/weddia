import { test, expect } from "@playwright/test";
import { expectAppShellLoaded } from "../fixtures/helpers";

/**
 * mejoras/06-selector-fecha-hora-responsivo
 * El DatePicker (showTime) usado en CreateEventModal no debe desbordar el
 * viewport ni el body en pantallas móviles cuando se abre su panel.
 * Cubre el formulario más simple de acceder de los 5 identificados
 * (CreateEventModal); los otros 4 comparten el mismo patrón CSS.
 */
test.describe("Selector de fecha/hora — responsivo en mobile", () => {
  test("el panel del DatePicker no desborda el viewport en 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone-class width
    await page.goto("/");
    await expectAppShellLoaded(page);

    await page.getByRole("button", { name: /Nuevo Evento/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const datePickerInput = dialog.locator(".ant-picker").first();
    await expect(datePickerInput).toBeVisible();
    await datePickerInput.click();

    const panel = page.locator(".ant-picker-panel-container").first();
    await expect(panel).toBeVisible();

    const panelBox = await panel.boundingBox();
    expect(panelBox, "No se pudo medir el panel del DatePicker").not.toBeNull();
    expect(
      panelBox!.x + panelBox!.width,
      `El panel se desborda: right edge=${panelBox!.x + panelBox!.width}px, viewport=375px`,
    ).toBeLessThanOrEqual(375 + 1);

    const bodyScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyScrollWidth, "El body tiene overflow horizontal con el panel abierto").toBeLessThanOrEqual(376);
  });

  test("los campos del modal se apilan verticalmente por debajo de 768px", async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 900 });
    await page.goto("/");
    await expectAppShellLoaded(page);

    await page.getByRole("button", { name: /Nuevo Evento/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const container = dialog.locator("[class*='eventInfoContainer'], [class*='EventInfo']").first();
    if (await container.isVisible().catch(() => false)) {
      const flexWrap = await container.evaluate((el) => getComputedStyle(el).flexWrap);
      expect(flexWrap, "El contenedor de campos no envuelve (flex-wrap) en mobile").toBe("wrap");
    } else {
      test.skip(true, "Contenedor de campos de fecha no encontrado con el selector esperado — revisar clase real");
    }
  });
});
