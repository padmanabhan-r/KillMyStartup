#!/usr/bin/env bash
#
# Sets the agent's max conversation duration.
#
# This lives in the repo because the cap is otherwise invisible infrastructure:
# it is stored on the ElevenLabs agent, not in this codebase, so without a
# script here there is no record of what it is or how it got that way.
#
#   ./scripts/set-session-cap.sh        # 60 minutes
#   ./scripts/set-session-cap.sh 30     # 30 minutes
#
# Reads ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID from the environment,
# falling back to .env.local.

set -euo pipefail

MINUTES="${1:-60}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$ROOT/.env.local" ]]; then
  # Only pull the two keys we need; .env.local may hold unrelated values.
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^(ELEVENLABS_API_KEY|ELEVENLABS_AGENT_ID)=' "$ROOT/.env.local" || true)
  set +a
fi

: "${ELEVENLABS_API_KEY:?ELEVENLABS_API_KEY is not set (env or .env.local)}"
: "${ELEVENLABS_AGENT_ID:?ELEVENLABS_AGENT_ID is not set (env or .env.local)}"

if ! [[ "$MINUTES" =~ ^[0-9]+$ ]]; then
  echo "Minutes must be a whole number, got: $MINUTES" >&2
  exit 1
fi

SECONDS_CAP=$(( MINUTES * 60 ))

# ElevenLabs accepts 60..7200 seconds. Catching it here gives a clear message
# instead of an opaque 422 from the API.
if (( SECONDS_CAP < 60 || SECONDS_CAP > 7200 )); then
  echo "Cap must be between 1 and 120 minutes, got: ${MINUTES}m (${SECONDS_CAP}s)" >&2
  exit 1
fi

API="https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}"

echo "Setting max conversation duration to ${MINUTES}m (${SECONDS_CAP}s)..."

curl -fsS -X PATCH "$API" \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_config\":{\"conversation\":{\"max_duration_seconds\":${SECONDS_CAP}}}}" \
  -o /dev/null

# Read it back rather than trusting the PATCH — a silently ignored field would
# otherwise look like success right up until a tester's session cuts out.
CONFIRMED="$(
  curl -fsS "$API" -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
    | grep -o '"max_duration_seconds":[0-9]*' \
    | head -1 \
    | cut -d: -f2
)"

if [[ "$CONFIRMED" != "$SECONDS_CAP" ]]; then
  echo "Verification failed: agent reports ${CONFIRMED:-unknown}s, expected ${SECONDS_CAP}s" >&2
  exit 1
fi

echo "Confirmed: max_duration_seconds = ${CONFIRMED} ($(( CONFIRMED / 60 ))m)"
