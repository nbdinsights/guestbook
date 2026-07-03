# Guestbook

A simple live guestbook: visitors leave a name + short message and see the most
recent messages. Node/Express + Postgres, deployed on Render (free plans).

## Layout

- `app/` — the web service (serves the page and the JSON API)
  - `migrations/` — numbered SQL migrations, applied by `migrate.js` at start
    (tracked in `schema_migrations`; free tier has no pre-deploy command)
- `test/live_test.sh <base-url>` — acceptance test against the live site
- `render.yaml` — documents/validates the infra shape (resources created via CLI/API)

## Run locally

```
cd app
npm install
DATABASE_URL=postgres://... npm start   # runs migrations, then serves on :3000
```

## API

- `GET /api/entries` — latest 50 entries, newest first
- `POST /api/entries` — `{"name": "...", "message": "..."}` → 201
- `GET /healthz` — `{"ok":true}`
