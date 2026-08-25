import { defineConfig, devices } from "@playwright/test";

// e2e runs on its own ports so it never collides with a `bun dev` stack (.env).
const API_PORT = "3100";
const WEB_PORT = "5273";
const webUrl = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./apps/web/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: webUrl,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bash scripts/e2e-server.sh",
    url: webUrl,
    env: { API_PORT, WEB_PORT },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
