# SPEC — Guestbook

## Requirements (each traces to DESIGN_BRIEF acceptance criteria)

| # | Requirement | Brief criterion |
|---|-------------|-----------------|
| R1 | `GET /` returns 200 with title, submit form, and message-list area | AC1 |
| R2 | `POST /api/entries` with `{name, message}` validates (both required, name ≤80, message ≤500) and inserts; returns the created entry (201) | AC2 |
| R3 | Entries are stored in Postgres — durable across restarts and shared by all visitors | AC3 |
| R4 | `GET /api/entries` returns the latest 50 entries, newest first; the page renders them | AC4 |
| R5 | `test/live_test.sh <base-url>` exercises submit→persist→list against the live URL and exits 0 | AC5 |
| R6 | `GET /healthz` → `{"ok":true}` (deploy health check) | — |

## Architecture

**One Render web service (Node/Express) + one free Render Postgres.**

- The single service serves the static page (vanilla HTML/CSS/JS) **and** the JSON API.
  Rationale vs the prior two-service run: same acceptance surface, half the free-tier
  wake-ups, no cross-service `API_URL` wiring, no Python-version pinning risk
  (prior run hit the psycopg2/Python-3.14 wheel failure).
- Postgres: **free plan** (constraint: free plans only; the account's one free-Postgres
  slot is open per preflight). Dedicated DB `guestbook-db` — an eval throwaway, torn
  down after. Region `oregon` for both; use `internalConnectionString`.
- Node runtime pinned via `package.json` `engines` (`node >=20 <23`) — no native deps
  (`pg` is pure JS), so no wheel-style hazards.

## render.yaml outline (documentation/validation; resources created imperatively)

```yaml
databases:
  - name: guestbook-db
    plan: free

services:
  - type: web
    runtime: node
    name: guestbook
    plan: free
    rootDir: app
    buildCommand: npm install
    startCommand: npm start        # runs migrations, then serves
    healthCheckPath: /healthz
    envVars:
      - key: DATABASE_URL
        fromDatabase: { name: guestbook-db, property: connectionString }
```

No `general_builder_keys` link: the app calls no model provider and needs no baseline
keys — `DATABASE_URL` is its only env var. No `ANTHROPIC_API_KEY`.

## API

- `GET  /api/entries` → `200 [{id, name, message, created_at}, …]` (≤50, newest first)
- `POST /api/entries` `{name, message}` → `201 {id, name, message, created_at}`;
  `400 {error}` on missing/oversize fields
- `GET  /healthz` → `200 {"ok":true}`

## Non-goals & constraints

- Non-goals: auth, moderation, edit/delete, pagination, rate limiting (per design brief).
- Constraints: free plans only; no secrets beyond `DATABASE_URL`; no custom domain;
  repo `nbdinsights/guestbook` created **public** (eval fixture, zero secrets) to avoid
  the one-time Render-GitHub-App grant on a brand-new private repo — same resolution the
  prior accepted run used.
