# IMPLEMENTATION_PLAN — Guestbook

## Data / Persistence / Migration decision (explicit)

- **Persistence:** Render Postgres, plan `free`, name `guestbook-db`, region `oregon`,
  version 16. Dedicated to this product (slot confirmed open in preflight). Eval
  throwaway — recorded in `.ship/resources.json` for teardown.
- **Schema:**
  - `guestbook_entries(id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL CHECK (char_length(name) <= 80), message TEXT NOT NULL CHECK (char_length(message) <= 500), created_at TIMESTAMPTZ NOT NULL DEFAULT now())`
  - index `idx_guestbook_entries_created_at ON guestbook_entries (created_at DESC)`
- **Migration mechanism:** numbered SQL files (`app/migrations/0001_init.sql`, …) + a
  `schema_migrations(version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())`
  tracking table + a tiny Node runner (`app/migrate.js`) that applies unapplied files in
  filename order, each in a transaction. **Deviation from the factory default, written
  down:** Render's `--pre-deploy-command` is not available on the free instance type, so
  the runner is invoked from the start command (`npm start` = `node migrate.js && node
  server.js`). Same versioned/ordered/idempotent contract, different trigger point. This
  is NOT bare `CREATE TABLE IF NOT EXISTS`-on-boot; the runner + tracking table can
  evolve the schema.
- **Seed/backfill:** none. **Rollback posture:** forward-only migrations; rollback =
  redeploy previous commit (schema is additive-only in v1). No local DB files committed.
- **Verification:** after deploy, `schema_migrations` implicitly verified by the live
  submit→list path working.

## Bounded steps (each ends in a commit + a check)

1. **Scaffold repo** — git init at `~/projects/guestbook/`, `.gitignore` (node_modules,
   `.ship/`), `render.yaml`, README. Check: `render blueprints validate`.
2. **App** — `app/`: `package.json` (express, pg; engines node ≥20 <23), `server.js`
   (static + API + healthz), `migrate.js`, `migrations/0001_init.sql`,
   `public/index.html` + `public/style.css` + `public/app.js` per the design brief.
   Check: lints by eye; step 3 exercises it.
3. **Local preflight** — run Postgres-free? No: use a disposable local Postgres via
   Docker if available, else point at nothing and unit-test handlers? Keep simple:
   `docker run postgres` if docker present; otherwise skip straight to live-DB test
   after the Render DB exists (eval fixture; live verification is the contract).
   Check: `GET /`, `POST /api/entries`, `GET /api/entries`, `GET /healthz` locally.
4. **Live test script** — `test/live_test.sh <base-url>`: wake-tolerant curl
   (`--retry --retry-all-errors`), asserts page loads, posts a unique marker entry,
   re-fetches list from a fresh request, asserts marker present + newest-first, exits
   non-zero on any failure. Check: shellcheck-clean-ish, runs against local.
5. **Push to GitHub** — create `nbdinsights/guestbook` (public, eval fixture) via
   `gh repo create`, push main.
6. **Provision + deploy (render-deploy skill)** — create free Postgres `guestbook-db`
   (REST API), poll until `available`; create web service `guestbook` (`--plan free`,
   node, rootDir `app`, health `/healthz`, `DATABASE_URL` from connection-info,
   `--confirm`). Record ids/urls in `.ship/resources.json` immediately upon creation.
7. **Verify live** — confirm deployed commit == latest local SHA; run
   `test/live_test.sh https://<service-url>`; iterate via logs on failure.
8. **Report** — EVIDENCE.md + STATUS.md + `.ship/SUMMARY.txt` + `.ship/STATUS.txt`.

## Verification plan

| Criterion | Local preflight | Live |
|-----------|-----------------|------|
| Page loads | curl localhost/ | curl live / (retry through wake) → 200 + "Guestbook" |
| Submit works | curl POST | live_test.sh POSTs unique marker → 201 |
| Persists | reload list | fresh GET /api/entries contains marker |
| In recent list | list order | marker is in list, newest first |
| Automated test | run script locally | `test/live_test.sh <live-url>` exits 0 |
| Deployed commit | — | `render deploys` latest live == `git rev-parse HEAD` |

## Human-gate trigger checklist

- Non-free service plan / disk / autoscaling / paid region — **clear** (all free)
- Paid database / free DB past window — **clear** (free slot open; teardown after eval)
- `sync: false` secrets / env values — **clear** (only DATABASE_URL, set from API)
- Custom domain — **clear**
- External messaging / public launch — **clear**
- Destructive deletion — **clear** (nothing deleted)
- Strategy/positioning — **clear** (neutral fixture)
- Render GitHub App access to new **private** repo — **avoided**: repo created public
  (eval fixture, no secrets; matches prior accepted run). If policy requires private,
  this becomes the one-time grant gate.

No gate fires → plan auto-approved; proceed to build.
