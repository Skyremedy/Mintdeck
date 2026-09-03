#!/usr/bin/env bash
# PreToolUse guard: refuse destructive database commands that are not clearly
# scoped to a local database.
#
# Written after `prisma migrate diff --shadow-database-url <production url>`
# dropped every table in production. Prisma treats the shadow database as
# scratch space, so pointing it at a real database destroys it. The same class
# of accident covers `migrate reset`, `db push`, DROP and TRUNCATE.
#
# A command is allowed through only if it names a local target (localhost,
# 127.0.0.1, or a sqlite file: path). Anything else is denied and has to be run
# by hand, deliberately.
set -uo pipefail

command_text=$(jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0
[[ -z $command_text ]] && exit 0

# Lower-cased before matching: SQL is conventionally written in capitals, and
# `DROP SCHEMA` slipped past a case-sensitive pattern in testing.
lowered=$(printf '%s' "$command_text" | tr '[:upper:]' '[:lower:]')

destructive='--shadow-database-url|migrate[[:space:]]+reset|--force-reset|--accept-data-loss|db[[:space:]]+push|drop[[:space:]]+(database|schema)|truncate[[:space:]]+table|db:reset|db:baseline'
local_target='localhost|127\.0\.0\.1|file:\.{1,2}/'

if [[ $lowered =~ $destructive ]] && [[ ! $lowered =~ $local_target ]]; then
  jq -n --arg reason "$(cat <<'MSG'
Blocked: this is a destructive database command and nothing in it limits the target to a local database.

Commands like `migrate reset`, `db push`, `--shadow-database-url`, DROP and TRUNCATE rewrite or erase whatever they are pointed at — and Prisma treats a shadow database as scratch space it may drop entirely. This guard exists because that exact command once wiped production.

Before running it:
  1. `npm run db:export` to take a snapshot
  2. To generate migration SQL, no database is needed at all:
     prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel <new> --script
  3. If it really must run against production, run it yourself so the decision is explicit.
MSG
)" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
  exit 0
fi
exit 0
