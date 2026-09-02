---
name: run-fleetly-admin
description: Use when asked to run, start, launch, or screenshot the fleetly-admin Next.js dev app, or to verify a change works in the real running app. Covers backend + local Supabase prerequisites and a dev-mode gotcha specific to this machine.
---

# Running fleetly-admin (and its backend)

This app is one of three sibling repos — `../fleetly` (NestJS API) and
`../fleetly-mobile` (Expo driver app) are the other two. This panel talks
only to the NestJS API, never the DB directly.

## Prerequisites (once per machine)

1. Docker Desktop must be running (`docker info` succeeds) — the backend's
   local dev DB is the Supabase CLI stack, which needs it.
2. `.env` (`../fleetly/.env`) and `.env.local` (this repo) must exist —
   they're gitignored, not part of a fresh clone. If missing, ask the user
   where their backup copy lives (this machine keeps one under
   `~/Downloads/fleetly-local-files/`, structure documented in its own
   `README.txt`).
3. `npm install` in both `../fleetly` and this repo if `node_modules` is
   missing.

## Start the backend first

```bash
cd ../fleetly
npx supabase start   # brings up local Postgres/Auth/Storage in Docker; slow on first pull
```

The local Postgres role passwords (`app_user`, `auth_service`) are wiped
on every `supabase db reset` and don't survive a fresh container volume —
if `.env`'s `APP_USER_LOCAL_PASSWORD`/`AUTH_SERVICE_LOCAL_PASSWORD` predate
this instance, reset them to match:

```bash
set -a; source .env; set +a
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres <<SQL
alter role app_user with password '${APP_USER_LOCAL_PASSWORD}';
alter role auth_service with password '${AUTH_SERVICE_LOCAL_PASSWORD}';
SQL
```

Then:

```bash
npm run start:dev &> /tmp/fleetly-backend.log &
```

Verify: `curl http://localhost:3001/health/ready` → `{"status":"ok"}`
(`/health/live` only proves the process is up, not the DB connection —
use `/health/ready`).

## Start the admin panel — dev mode hangs on this machine, use prod mode

**`next dev` (both Turbopack and `--webpack`) hangs indefinitely on every
request on this machine** — TCP connects, the process stays at 0% CPU,
and no response ever comes, regardless of Node version (confirmed on both
system Node 25 and Homebrew's `node@22`), regardless of whether
`src/proxy.ts` (the auth middleware) is present, and regardless of a
clean `.next` cache. A plain `node -e "http.createServer(...).listen(3000)"`
answers instantly, so port 3000 itself is not blocked — this is specific
to Next 16.3.3's dev-mode router-server/worker split. Not yet root-caused;
worth re-checking against a newer Next patch before assuming it's
permanent.

**Production mode works correctly** and is the reliable way to run this
app here:

```bash
npm run build            # next build — also typechecks
npx next start &> /tmp/fleetly-admin.log &
```

Verify: `curl -i http://localhost:3000/` → `307` redirect to
`/login?next=%2F` when signed out (this is correct middleware behavior,
not a failure). `curl http://localhost:3000/login` → `200` with a real
rendered page (check for `<title>Fleetly Admin</title>`).

Production mode has no hot reload — after editing source, re-run
`npm run build` and restart `next start` to see the change live. If you
only need to confirm code compiles/typechecks, `npm run build` alone is
enough and is faster than a full restart cycle.

## Driving it as a signed-in user

There's no seeded staff account. To create one locally (general_admin,
no subco scoping):

```bash
# Service role key and /auth/v1 URL are the fixed, publicly-documented
# local Supabase CLI defaults — see fleetly/src/auth/gotrue-admin-client.ts.
SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

# 1. Create the GoTrue user
curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"dev-admin@fleetly.local","password":"<pick one>","email_confirm":true}'
# -> note the returned "id"

# 2. Insert the matching staff_user + identity (against the fleetly DB)
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "insert into staff_user (id, subco_id, role, status, supabase_user_id)
   values (gen_random_uuid(), null, 'general_admin', 'active', '<gotrue user id>')
   returning id;"
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "insert into staff_user_identity (staff_user_id, first_name, last_name)
   values ('<staff_user id from above>', 'Dev', 'Admin');"

# 3. CRITICAL: the JWT guard only resolves a session if the access
#    token's user_metadata.staff_user_id is set — the admin API call
#    above does not set this by itself, unlike the real invite flow
#    (StaffInviteService). Set it explicitly:
curl -s -X PUT http://127.0.0.1:54321/auth/v1/admin/users/<gotrue user id> \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_metadata":{"staff_user_id":"<staff_user id>"}}'
```

Then either log in through the actual `/login` page (real browser), or
verify headlessly: sign in via GoTrue's password grant
(`POST /auth/v1/token?grant_type=password` with the anon key) to get an
`access_token`, and call the backend directly with
`Authorization: Bearer <access_token>` — `GET /api/v1/auth/me` confirms
the role resolved correctly. Driving the admin panel's own pages this
way needs `@supabase/ssr`'s cookie format, which is nontrivial to
hand-construct with curl — prefer a real browser/Playwright session for
that over reverse-engineering the cookie chunking.
