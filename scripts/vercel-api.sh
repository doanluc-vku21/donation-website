#!/usr/bin/env bash
# Vercel REST API helper for the donation-website project.
#
# Auth: project-scoped access token read from .local/vercel-token (never echoed).
# Scope of that token: this project only. User-level (/v2/user), team-level
# (/v2/teams) and integration endpoints answer 403/404 by design.
#
# Usage: scripts/vercel-api.sh <command> [args]
#
#   projects                 list projects visible to the token
#   project                  current project summary
#   deployments [limit]      recent deployments (uid/state/target/url/created)
#   deploy [uid|latest]      one deployment summary
#   events [uid|latest] [n]  build-log events (newest first)
#   logs [seconds] [limit]   stream runtime logs for a deployment
#   env                      env var KEYS only (values are never printed)
#   domains                  project domains
#   members                  project members
#   raw <path>               raw GET, e.g. raw "/v9/projects/\$ID"
#
# Env overrides: VERCEL_PROJECT_ID, VERCEL_TIMEOUT (default 30s)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOKEN_FILE="$ROOT/.local/vercel-token"
PROJECT_FILE="$ROOT/.local/vercel-project"
DEFAULT_PROJECT_ID="prj_Rf04c904XCMzz2JHgfapVx5Qnt8k"
API="https://api.vercel.com"

die() { printf 'error: %s\n' "$1" >&2; exit 1; }

command -v jq >/dev/null || die "jq is required"
[ -r "$TOKEN_FILE" ] || die "missing .local/vercel-token (create a project-scoped token at https://vercel.com/account/tokens)"
TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
[ -n "$TOKEN" ] || die ".local/vercel-token is empty"

if [ -n "${VERCEL_PROJECT_ID:-}" ]; then
  PROJECT_ID="$VERCEL_PROJECT_ID"
elif [ -r "$PROJECT_FILE" ]; then
  PROJECT_ID="$(tr -d '\r\n' < "$PROJECT_FILE")"
else
  PROJECT_ID="$DEFAULT_PROJECT_ID"
fi

api() { # api <path> [extra curl args...]
  local path="$1"; shift
  curl -sS --fail-with-body --max-time "${VERCEL_TIMEOUT:-30}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/json" \
    "$@" "$API$path"
}

latest_uid() {
  api "/v6/deployments?projectId=$PROJECT_ID&limit=1" | jq -r '.deployments[0].uid // empty'
}

resolve_uid() {
  local ref="${1:-latest}"
  if [ "$ref" = "latest" ] || [ -z "$ref" ]; then
    local uid; uid="$(latest_uid)"
    [ -n "$uid" ] || die "no deployments found for project $PROJECT_ID"
    printf '%s' "$uid"
  else
    printf '%s' "$ref"
  fi
}

cmd="${1:-help}"; shift || true

case "$cmd" in
  projects)
    api "/v10/projects?limit=${1:-20}" \
      | jq -r '(.projects // [])[] | "\(.name)\t\(.id)\t\(.framework // "-")"'
    ;;

  project)
    api "/v9/projects/$PROJECT_ID" | jq '{
      name, id, framework, nodeVersion,
      createdAt: (.createdAt / 1000 | floor | strftime("%Y-%m-%d %H:%M:%SZ")),
      productionAlias: ([.alias[]? | select(.deployment)] | first),
      latestDeployments: ([.latestDeployments[]?.url] | .[0:3])
    }'
    ;;

  deployments)
    api "/v6/deployments?projectId=$PROJECT_ID&limit=${1:-10}" \
      | jq -r '.deployments[] | "\(.uid)\t\(.state)\t\(.target // "preview")\t\(.createdAt / 1000 | floor | strftime("%Y-%m-%d %H:%M:%SZ"))\t\(.url)"'
    ;;

  deploy)
    api "/v13/deployments/$(resolve_uid "${1:-latest}")" | jq '{
      uid: .id, name, url, state: (.readyState // .state), target,
      createdAt: (.createdAt / 1000 | floor | strftime("%Y-%m-%d %H:%M:%SZ")),
      ready: (.ready / 1000 | floor | strftime("%Y-%m-%d %H:%M:%SZ")),
      commit: .meta.githubCommitRef, commitMessage: .meta.githubCommitMessage,
      errorMessage, errorStep, aliasError
    }'
    ;;

  events)
    uid="$(resolve_uid "${1:-latest}")"; limit="${2:-40}"
    api "/v3/deployments/$uid/events?limit=$limit&direction=backward" \
      | jq -r '.[] | "[\(.created // 0)] \(.type) \(.payload.text // .payload.deploymentId // .payload.statusCode // "")"'
    ;;

  logs)
    seconds="${1:-20}"; limit="${2:-200}"
    uid="$(resolve_uid latest)"
    buf="$(mktemp)"
    printf '# runtime logs %s, window %ss\n' "$uid" "$seconds" >&2
    curl -sS -N --max-time "$seconds" \
      -H "Authorization: Bearer $TOKEN" \
      "$API/v1/projects/$PROJECT_ID/deployments/$uid/runtime-logs?limit=$limit" \
      >"$buf" 2>/dev/null || true
    if [ -s "$buf" ]; then
      jq -c 'select(.message != null or .requestPath != null) |
        {t: (.timestampInMs / 1000 | floor | strftime("%H:%M:%S")), level, route: .requestPath,
         status: .statusCode, msg: (.message // "")[0:160]}' "$buf"
    else
      printf '# 0 lines: no traffic reached this deployment in the window\n' >&2
    fi
    rm -f "$buf"
    ;;

  env)
    api "/v9/projects/$PROJECT_ID/env" | jq -r '
      "keys: \(.envs | length)  (values intentionally not printed)\n" +
      ([.envs[] | "\(.key)\t\(.type)\t\(.target | join(","))"] | sort | join("\n"))'
    ;;

  domains)
    api "/v9/projects/$PROJECT_ID/domains?limit=50" \
      | jq -r '(.domains // [])[] | "\(.name)\t\(.verified)\t\(.redirect // "-")"'
    ;;

  members)
    api "/v2/projects/$PROJECT_ID/members?limit=50" \
      | jq -r '(.members // [])[] | "\(.username)\t\(.role)\t\(.email // "-")"'
    ;;

  raw)
    [ -n "${1:-}" ] || die "usage: raw <path>"
    api "$1"
    ;;

  help|*)
    sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
esac
