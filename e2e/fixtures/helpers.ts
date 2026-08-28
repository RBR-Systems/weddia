import { Page, expect } from "@playwright/test";

/** Waits for the dashboard shell (sidebar) to be interactive after navigation/login. */
export async function expectAppShellLoaded(page: Page) {
  await expect(page.getByRole("navigation", { name: /Main navigation|nav.primary/i })).toBeVisible();
}

/** Navigates via the sidebar by visible label (Spanish labels, as served by default locale). */
export async function goToSection(page: Page, label: string | RegExp) {
  await page.getByRole("button", { name: label }).click();
}

/**
 * Switches the active event via the header event switcher, if an event with
 * that name is available. Falls back silently if the switcher/option isn't found,
 * since the app already auto-selects an event on load.
 */
export async function selectEvent(page: Page, eventName: string) {
  const switcher = page.getByRole("banner").getByRole("button", { name: new RegExp(eventName) });
  if (await switcher.isVisible().catch(() => false)) return; // already selected

  const anySwitcher = page.getByRole("banner").locator("button").first();
  await anySwitcher.click();
  const option = page.getByText(eventName, { exact: false }).first();
  if (await option.isVisible().catch(() => false)) {
    await option.click();
  } else {
    await page.keyboard.press("Escape");
  }
}
