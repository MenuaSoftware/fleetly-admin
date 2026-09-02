import { test, expect } from "@playwright/test";
import { ensureE2EGeneralAdmin, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./seed-admin";

/**
 * Real end-to-end coverage of the login → session → RLS-scoped-data
 * chain: a real Supabase Auth sign-in, a real JWT sent to the real
 * NestJS API, resolved against a real staff_user row. Requires the
 * backend and the local Supabase stack to be running — see
 * .claude/skills/run-fleetly-admin/SKILL.md.
 */
test.beforeAll(async () => {
  await ensureE2EGeneralAdmin();
});

async function signIn(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
}

test("an unauthenticated visitor is redirected to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2F/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a general admin can sign in and reaches the dashboard with admin nav visible", async ({
  page,
}) => {
  await signIn(page);
  // The "Administration" nav section only renders for general_admin —
  // proves the role resolved correctly end-to-end (Supabase session ->
  // backend JWT verification -> staff_user.role lookup), not just "some
  // authenticated user got past the redirect".
  await expect(page.getByText("Administration")).toBeVisible();
});

test("a signed-in general admin sees real subcontractor data from the API", async ({ page }) => {
  await signIn(page);
  await page.goto("/subcontractors");
  // These two rows come from fleetly/supabase/seed.sql — real data
  // fetched from the real backend, not a fixture local to this test.
  await expect(page.getByText("De Vries Transport")).toBeVisible();
  await expect(page.getByText("Antwerp Logistics NV")).toBeVisible();
});

test("signing out returns to the login screen and blocks the dashboard again", async ({
  page,
}) => {
  await signIn(page);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  // The guard, not just the click: going back to a protected route
  // after signing out must bounce to /login again, same as a visitor
  // who never had a session.
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2F/);
});
