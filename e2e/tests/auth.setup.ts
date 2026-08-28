import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const AUTH_FILE = path.join(__dirname, "../../playwright/.auth/user.json");

const EMAIL = process.env.EMAIL_TEST;
const PASSWORD = process.env.PASSWORD_TEST;

setup("authenticate", async ({ page }) => {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "EMAIL_TEST / PASSWORD_TEST no están definidos. Agrégalos a rbr-system/.env.local para correr los tests E2E.",
    );
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Inicia sesión para continuar" })).toBeVisible();

  await page.getByRole("textbox", { name: "Correo electrónico" }).fill(EMAIL);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  // Post-login: sidebar nav is the reliable signal (URL stays "/" on success).
  await expect(page.getByRole("button", { name: /Lista de Eventos/ })).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
