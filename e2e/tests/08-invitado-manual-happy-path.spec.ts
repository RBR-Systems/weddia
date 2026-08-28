import { test, expect } from "@playwright/test";
import { expectAppShellLoaded } from "../fixtures/helpers";

/**
 * Happy path reverse-engineered from GuestList.tsx: adding a guest manually
 * calls the real create-guest service (createGuest → POST /api/guests),
 * unlike the CSV import path this exercise complements. Confirms the "Agregar
 * invitado" flow end-to-end and that the new guest survives a reload.
 */
test("agrega un invitado manualmente y persiste tras reload", async ({ page }) => {
  const uniqueName = `E2E Manual ${Date.now()}`;

  await page.goto("/guest-list");
  await expectAppShellLoaded(page);

  await page.getByRole("button", { name: /Agregar invitado/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const firstNameField = dialog.getByLabel(/nombre/i).first();
  await firstNameField.fill(uniqueName);

  const emailField = dialog.getByLabel(/correo|email/i).first();
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(`e2e.manual.${Date.now()}@example.com`);
  }

  const submit = dialog.getByRole("button", { name: /Guardar|Agregar|Crear/ }).last();
  await submit.click();

  await expect(dialog).toBeHidden({ timeout: 10_000 });
  await expect(page.getByRole("row", { name: new RegExp(uniqueName) })).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expectAppShellLoaded(page);
  await expect(page.getByRole("row", { name: new RegExp(uniqueName) })).toBeVisible({ timeout: 15_000 });
});
