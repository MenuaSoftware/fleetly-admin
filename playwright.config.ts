import { defineConfig, devices } from "@playwright/test";

/**
 * `next dev` hangs indefinitely on this machine (see
 * .claude/skills/run-fleetly-admin/SKILL.md) — these tests run against
 * a production build (`npm run build && npx next start`), which is also
 * closer to what a real deploy behaves like. `webServer` builds and
 * starts it automatically; bump the timeout well past a cold build.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npx next start",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
