# Intake — Guestbook (eval fixture run, 2026-07-03)

**Goal (one sentence):** Ship the fixture Guestbook (name + message → persist → recent
list) live on Render, with the brief's acceptance criteria verified on the live URL.

- **Lane:** software
- **Canonical home:** `~/projects/guestbook/` (fresh greenfield — prior run archived to
  `~/projects/.archive/guestbook-prev-20260703-013621`; its GitHub repo and Render
  resources were already torn down). GitHub repo: `nbdinsights/guestbook`, recreate via `gh`.
- **Service shape (first guess):** web service + database (backend API + frontend +
  Postgres). Finalized in spec-and-plan.
- **Acceptance contract (done = live & verified):**
  1. Live page loads.
  2. Can submit a name + message.
  3. Message persists (survives reload / visible to other visitors).
  4. New message appears in the recent-messages list.
  5. An automated test exercises frontend→backend→storage→display against the live site.
- **Human gates likely:** none expected (free plans only, no secrets/domains/messaging).
  Possible one-time Render GitHub-App access grant for the recreated repo.
- **Open decisions for Neal:** none — defaults recorded here.
- **Execution mode:** headless (per brief) — the build runs as an isolated `claude -p`
  one-shot capturing its trajectory to `.ship/runs/<ts>/`; the goal session verifies.
- **Eval context:** this is a factory eval run; resource manifest must be written to
  `.ship/resources.json` for teardown afterward.
- **Next action:** launch the headless ship-it run (design-brief → spec-and-plan → build
  → push → render-deploy → verify live).
