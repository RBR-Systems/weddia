import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env.local") });

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const AUTH_FILE = path.join(__dirname, "playwright/.auth/user.json");

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // i18next-browser-languagedetector reads navigator.language; the app's
    // default UI language in this session's flows is Spanish, so pin it.
    locale: "es-MX",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
