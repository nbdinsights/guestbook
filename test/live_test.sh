#!/usr/bin/env bash
# Live acceptance test: frontend -> backend -> storage -> display.
# Usage: test/live_test.sh https://guestbook-xxxx.onrender.com
# Wake-tolerant: free Render services spin down; retries through the wake.
set -u

BASE="${1:?usage: live_test.sh <base-url>}"
BASE="${BASE%/}"
CURL=(curl -sS --max-time 60 --retry 8 --retry-delay 5 --retry-all-errors)
FAILURES=0

check() { # check <label> <ok:0|1>
  if [ "$2" -eq 0 ]; then
    echo "PASS: $1"
  else
    echo "FAIL: $1"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "== Guestbook live test against $BASE =="

# 1. Page loads with expected UI.
PAGE=$("${CURL[@]}" "$BASE/")
echo "$PAGE" | grep -q "<h1>Guestbook</h1>"; check "page loads and renders Guestbook heading" $?
echo "$PAGE" | grep -q 'id="entry-form"'; check "page contains the submit form" $?
echo "$PAGE" | grep -q 'id="entries"'; check "page contains the messages list" $?

# 2. Submit a unique marker entry.
MARKER="live-test-$(date +%s)-$RANDOM"
POST=$("${CURL[@]}" -X POST "$BASE/api/entries" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Live Test\",\"message\":\"$MARKER\"}")
echo "$POST" | grep -q "\"$MARKER\""; check "submit accepted and echoed the new entry" $?
echo "$POST" | grep -q '"id"'; check "created entry has an id" $?

# 3. Persistence: a FRESH request sees the entry (server-side storage, not client state).
sleep 1
LIST=$("${CURL[@]}" "$BASE/api/entries")
echo "$LIST" | grep -q "$MARKER"; check "marker present in recent list on fresh request" $?

# 4. Newest-first: the marker is the first message in the list.
FIRST_MSG=$(echo "$LIST" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d[0]["message"] if d else "")' 2>/dev/null)
[ "$FIRST_MSG" = "$MARKER" ]; check "marker is newest-first in the list" $?

# 5. Validation guard: empty submit rejected.
CODE=$("${CURL[@]}" -o /dev/null -w "%{http_code}" -X POST "$BASE/api/entries" \
  -H "Content-Type: application/json" -d '{"name":"","message":""}')
[ "$CODE" = "400" ]; check "empty submission rejected with 400" $?

echo "== $FAILURES failure(s) =="
exit "$FAILURES"
