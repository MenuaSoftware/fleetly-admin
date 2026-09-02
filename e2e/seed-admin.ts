import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";

/**
 * Fixed, publicly-documented local Supabase CLI defaults — same values
 * ../fleetly/src/auth/gotrue-admin-client.ts uses. Not secrets; only
 * work against a local `supabase start` stack.
 */
const LOCAL_URL = "http://127.0.0.1:54321";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@fleetly.local";
export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-local-only-password-1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `staff_user` has no grants for PostgREST's `service_role` — only
 * `app_user`/`auth_service`/`postgres` can touch it (see
 * ../fleetly/docs/architecture.md's roles/capabilities matrix), so the
 * supabase-js admin client can't reach it. Direct superuser connection
 * instead, same as ../fleetly's own test fixtures
 * (badge-login.service.spec.ts's superuserPool()) and the well-known,
 * publicly-documented local Supabase CLI default password — never used
 * this way against anything but a local `supabase start` stack.
 */
function runSql(sql: string): string {
  return execFileSync(
    "psql",
    ["-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-d", "postgres", "-tAc", sql],
    { env: { ...process.env, PGPASSWORD: "postgres" }, encoding: "utf8" },
  ).trim();
}

/**
 * Idempotent — safe to call at the start of every run. There's no
 * seeded staff account and no self-service signup (staff provisioning
 * is invite-only, see ../fleetly/src/staff/staff-invite.service.ts), so
 * e2e tests that need to be signed in create their own general_admin
 * account directly against the local stack the first time, then reuse
 * it on every later run.
 */
export async function ensureE2EGeneralAdmin(): Promise<void> {
  const url = process.env.SUPABASE_URL ?? LOCAL_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL_SERVICE_ROLE_KEY;
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Could not list Supabase Auth users: ${listError.message}`);
  }
  let userId = existingUsers.users.find((u) => u.email === E2E_ADMIN_EMAIL)?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Could not create the e2e admin user: ${error?.message}`);
    }
    userId = data.user.id;
  }

  if (!UUID_RE.test(userId)) {
    throw new Error(`Unexpected non-UUID Supabase user id: ${userId}`);
  }

  let staffUserId = runSql(
    `select id from staff_user where supabase_user_id = '${userId}'`,
  );
  if (!staffUserId) {
    // -t still appends an "INSERT 0 1" status line after a RETURNING
    // value, so the id is fetched with a separate, clean SELECT rather
    // than parsed out of the insert's own output.
    runSql(
      `insert into staff_user (id, subco_id, role, status, supabase_user_id)
       values (gen_random_uuid(), null, 'general_admin', 'active', '${userId}')`,
    );
    staffUserId = runSql(
      `select id from staff_user where supabase_user_id = '${userId}'`,
    );
    runSql(
      `insert into staff_user_identity (staff_user_id, first_name, last_name)
       values ('${staffUserId}', 'E2E', 'Admin')`,
    );
  }

  // The backend's JwtAuthGuard only resolves a session when the access
  // token's user_metadata.staff_user_id is set (see
  // ../fleetly/src/auth/jwt-auth.guard.ts's resolveStaff) — the plain
  // admin.createUser() call above doesn't set this itself, unlike the
  // real invite flow (StaffInviteService). Set unconditionally, cheap
  // and idempotent, so a stale value from a previous DB reset can't
  // linger.
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { staff_user_id: staffUserId },
  });
  if (updateError) {
    throw new Error(`Could not set staff_user_id on the e2e admin user: ${updateError.message}`);
  }
}

/** De Vries Transport, from ../fleetly/supabase/seed.sql. */
const SEED_SUBCO_ID = "10000000-0000-0000-0000-000000000001";

const E2E_PLATE = "E2E-QR-1";

/**
 * A vehicle the QR tests can rely on existing. Keyed on its plate,
 * which the schema already makes globally unique — so this is
 * idempotent without needing to remember an id between runs.
 */
export function ensureE2EVehicle(): string {
  const existing = runSql(`select id from vehicle where plate = '${E2E_PLATE}'`);
  if (existing) return existing;

  runSql(
    `insert into vehicle (id, subco_id, plate, body_type, status)
     values (gen_random_uuid(), '${SEED_SUBCO_ID}', '${E2E_PLATE}', 'van', 'active')`,
  );
  return runSql(`select id from vehicle where plate = '${E2E_PLATE}'`);
}

/**
 * A driver the badge-QR test can issue a badge against. `driver` has no
 * naturally unique column (names live in driver_identity and are not
 * unique — two real drivers may share one), so this keys on the
 * identity row's name pair, which is good enough for a fixture.
 */
export function ensureE2EDriver(): string {
  const existing = runSql(
    `select d.id from driver d
     join driver_identity i on i.driver_id = d.id
     where i.first_name = 'E2E' and i.last_name = 'Driver'
     limit 1`,
  );
  if (existing) return existing;

  runSql(
    `insert into driver (id, subco_id, status)
     values (gen_random_uuid(), '${SEED_SUBCO_ID}', 'active')`,
  );
  const driverId = runSql(
    `select d.id from driver d
     left join driver_identity i on i.driver_id = d.id
     where d.subco_id = '${SEED_SUBCO_ID}' and i.driver_id is null
     limit 1`,
  );
  runSql(
    `insert into driver_identity (driver_id, first_name, last_name)
     values ('${driverId}', 'E2E', 'Driver')`,
  );
  return driverId;
}
