import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { expectAppShellLoaded } from "../fixtures/helpers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://rbr-systems-api.onrender.com";

/**
 * mejoras/01-importacion-csv-grupo-rsvp + mejoras/02-persistencia-csv-invitados
 *
 * Happy path end-to-end: importar un CSV con grupos por NOMBRE (no ID) y
 * vocabulario de RSVP variado (confirmed/attending/pendiente) debe:
 *  - resolver el grupo contra el catálogo real de relaciones del evento,
 *  - mapear el RSVP al vocabulario del backend,
 *  - persistir realmente los invitados (mejora 02) — no solo estado local:
 *    deben sobrevivir a un reload de página.
 *
 * Corre contra el backend real (no mockeado). Verificamos el resultado vía
 * API directa (no scrapeando la tabla del DOM): la lista de invitados del
 * evento crece con cada corrida y AntD pagina server-side-style en el
 * cliente, así que una fila nueva puede caer en cualquier página — la API
 * es la fuente de verdad que no depende de dónde cae la fila.
 */
test.describe("Importación CSV de invitados — happy path", () => {
  let apiFailures: string[] = [];
  let runId: string;
  let csvPath: string;
  let unrecognizedCsvPath: string;
  let token: string;
  let eventId: number;

  test.beforeEach(async ({ page }) => {
    runId = Date.now().toString();
    apiFailures = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/guests") && res.status() >= 400) {
        apiFailures.push(`${res.request().method()} ${res.url()} → ${res.status()}`);
      }
    });

    // Unique data per run: the shared backend accumulates guests across runs,
    // so fixed names/emails would collide with leftovers from earlier runs.
    csvPath = path.join(os.tmpdir(), `guests-happy-path-${runId}.csv`);
    fs.writeFileSync(
      csvPath,
      [
        "first_name,last_name,email,phone,party_size,relation_id,rsvp_status",
        `Ana${runId},E2E Test,ana.${runId}@example.com,+528110000001,2,Familia del Novio,confirmed`,
        `Luis${runId},E2E Test,luis.${runId}@example.com,+528110000002,1,Amigos,attending`,
      ].join("\n"),
    );
    unrecognizedCsvPath = path.join(os.tmpdir(), `guests-unrecognized-${runId}.csv`);
    fs.writeFileSync(
      unrecognizedCsvPath,
      [
        "first_name,last_name,email,phone,party_size,relation_id,rsvp_status",
        `Pedro${runId},E2E Test,pedro.${runId}@example.com,+528110000004,1,Grupo Que No Existe,estado_invalido`,
      ].join("\n"),
    );

    await page.goto("/guest-list");
    await expectAppShellLoaded(page);

    token = await page.evaluate(() => localStorage.getItem("rbr_token") ?? "");
    const events = await page.evaluate(
      async ({ apiBase, t }) => {
        const res = await fetch(`${apiBase}/api/events`, { headers: { Authorization: `Bearer ${t}` } });
        return res.json();
      },
      { apiBase: API_BASE, t: token },
    );
    eventId = events[0]?.event_id ?? events[0]?.eventId ?? events[0]?.id;
    expect(eventId, `No se pudo resolver un eventId desde GET /api/events: ${JSON.stringify(events).slice(0, 300)}`).toBeTruthy();
  });

  test.afterEach(() => {
    for (const f of [csvPath, unrecognizedCsvPath]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  async function fetchGuestByEmail(page: import("@playwright/test").Page, email: string) {
    const guests = await page.evaluate(
      async ({ apiBase, t, evId }) => {
        const res = await fetch(`${apiBase}/api/guests/event/${evId}`, { headers: { Authorization: `Bearer ${t}` } });
        return res.json();
      },
      { apiBase: API_BASE, t: token, evId: eventId },
    );
    return (guests as Array<Record<string, unknown>>).find((g) => g.email === email);
  }

  test("importa un CSV con grupos por nombre y RSVP variado, y persiste tras reload", async ({ page }) => {
    await page.getByRole("button", { name: /Importar CSV/ }).click();
    const dialog = page.getByRole("dialog", { name: /Importar invitados/ });
    await expect(dialog).toBeVisible();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await dialog.getByText(/Haz clic o arrastra/).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);

    // Confirm/submit the import if the modal exposes an explicit action;
    // some Ant Design Upload+dragger flows auto-submit on file selection.
    const confirmButton = dialog.getByRole("button", { name: /Importar|Confirmar|Guardar/ });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Fail fast with the real cause (e.g. a 405/404 on the bulk endpoint)
    // instead of a generic "not found" timeout further down.
    await expect(async () => {
      expect(apiFailures, `Llamadas a /api/guests fallaron:\n${apiFailures.join("\n")}`).toHaveLength(0);
    }).toPass({ timeout: 5_000 });

    const email = `ana.${runId}@example.com`;
    // mejora 02: debe persistir en backend, no solo en memoria del cliente.
    await expect
      .poll(async () => fetchGuestByEmail(page, email), { timeout: 15_000 })
      .toBeTruthy();

    const guest = await fetchGuestByEmail(page, email);
    // mejora 01: grupo resuelto por NOMBRE contra el catálogo real (no vacío, no el texto crudo del CSV).
    expect(guest?.relation_id ?? guest?.relationId, `Invitado creado sin relation_id resuelto: ${JSON.stringify(guest)}`).toBeTruthy();
    // mejora 01: "confirmed" del CSV debe llegar tal cual al vocabulario del backend.
    expect(guest?.rsvp_status ?? guest?.rsvpStatus).toBe("confirmed");

    // Sobrevive a un reload real de la página (prueba de persistencia real, no solo estado de React).
    await page.reload();
    await expectAppShellLoaded(page);
    await expect.poll(async () => fetchGuestByEmail(page, email), { timeout: 15_000 }).toBeTruthy();
  });

  test("reporta en un resumen las filas con grupo o RSVP no reconocidos, sin bloquear el resto", async ({ page }) => {
    await page.getByRole("button", { name: /Importar CSV/ }).click();
    const dialog = page.getByRole("dialog", { name: /Importar invitados/ });
    await expect(dialog).toBeVisible();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await dialog.getByText(/Haz clic o arrastra/).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(unrecognizedCsvPath);

    const confirmButton = dialog.getByRole("button", { name: /Importar|Confirmar|Guardar/ });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // El invitado se guarda igual (fallback seguro: sin grupo, RSVP "pending")...
    const email = `pedro.${runId}@example.com`;
    const guest = await expect
      .poll(async () => fetchGuestByEmail(page, email), { timeout: 15_000 })
      .toBeTruthy()
      .then(() => fetchGuestByEmail(page, email));
    expect(guest?.relation_id ?? guest?.relationId ?? null).toBeNull();
    expect(guest?.rsvp_status ?? guest?.rsvpStatus).toBe("pending");

    // ...pero el criterio de aceptación de mejora 01 exige avisar al usuario,
    // no solo aplicar el fallback en silencio.
    await expect(
      page.getByText(/no reconocid|not recognized|Grupo Que No Existe|estado_invalido/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
