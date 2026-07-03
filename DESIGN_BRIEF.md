# Design Brief — Guestbook

## Problem & outcome
Visitors to a page want to leave a short public note and see what others have written.
Success: a visitor can post a name + message and immediately see it at the top of a
recent-messages list, and that message is still there for anyone who loads the page later.

## Target user & context
Anonymous web visitors on desktop or mobile, arriving at a single public URL. No accounts,
no onboarding — one screen, one action. (Eval context: an automated test is also a "user"
and must be able to drive the same flow over HTTP.)

## Core flows
1. **Read**: Visitor opens the page → sees the guestbook title, a submit form, and the
   most recent messages (newest first), each showing name, message, and a timestamp.
2. **Write**: Visitor types a name (≤ 80 chars) and a message (≤ 500 chars) → clicks
   "Sign the guestbook" → the form clears and the new entry appears at the top of the
   list without confusion about whether it worked (inline success/error feedback).
3. **Return**: Visitor reloads (or another visitor arrives) → previously submitted
   messages are still listed in the same order.

## Scope (v1)
- One page: form (name + message) + recent-messages list (latest ~50, newest first).
- Server-side persistence shared by all visitors.
- Basic input validation (both fields required, length limits) with a visible error.
- Timestamps displayed per entry.

## Non-goals
- No auth, moderation, editing/deleting, pagination, avatars, reactions, or rate limiting
  beyond trivial validation. No admin UI. No analytics.

## Visual direction
Warm, simple "classic guestbook" feel — think a well-typeset personal-site guestbook:
centered single column (~640px), cream/paper background, a serif display heading,
readable sans body, entries as soft cards with name in bold and a muted timestamp.
Mobile: the column just narrows; form inputs full-width. No frameworks needed —
hand-rolled CSS is fine. Density low; this is a friendly page, not a dashboard.

## Acceptance criteria (verified on the LIVE url)
1. GET the live URL → 200 and the page renders title, form, and message list area.
2. Submitting a name + message via the UI (or its backing HTTP endpoint) succeeds and
   returns/reflects the new entry.
3. After reload (fresh GET), the submitted message is present — persistence is server-side,
   not local to the browser.
4. The new message appears in the recent list, newest first.
5. An automated test script exercises submit → persist → list against the live site and
   exits green.

## Risks / unknowns
- Free-tier spin-down: first request after idle is slow — verification must retry through wake.
- Shared/free Postgres availability on Render — spec decides the persistence tier.
- No human gates expected: neutral visual style, no brand commitment.
