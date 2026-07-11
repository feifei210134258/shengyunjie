#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/shengyunjie}"
APP_NAME="${APP_NAME:-shengyunjie}"
PORT="${PORT:-3001}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-deploy/pm}"
BASE_URL="${BASE_URL:-https://pm.imfly.site}"
NODE_BIN="${NODE_BIN:-node}"
NPM_BIN="${NPM_BIN:-npm}"
PM2_BIN="${PM2_BIN:-pm2}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

sha_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
    return
  fi
  shasum -a 256 "$1" | awk '{print $1}'
}

run_training_probe() {
  local script_path="${APP_DIR}/scripts/verify-production-training.sh"
  if [ -x "$script_path" ]; then
    BASE_URL="$BASE_URL" bash "$script_path"
  else
    log "Verification script not found or not executable: $script_path"
  fi
}

purge_nginx_cache_if_configured() {
  local nginx_bin
  nginx_bin="$(command -v nginx || true)"
  if [ -z "$nginx_bin" ] && [ -x /www/server/nginx/sbin/nginx ]; then
    nginx_bin="/www/server/nginx/sbin/nginx"
  fi

  if [ -z "$nginx_bin" ]; then
    log "Nginx binary not found; skip proxy cache inspection"
    return
  fi

  local cache_paths
  cache_paths="$("$nginx_bin" -T 2>/dev/null | awk '
    $1 == "proxy_cache_path" || $1 == "fastcgi_cache_path" {
      path=$2
      sub(/;$/, "", path)
      print path
    }
  ' | sort -u)"

  if [ -z "$cache_paths" ]; then
    log "No nginx proxy/fastcgi cache_path found"
    return
  fi

  log "Detected nginx cache paths; purging site cache candidates"
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    if [ -d "$path" ]; then
      find "$path" -type f -delete
      printf 'Purged: %s\n' "$path"
    fi
  done <<< "$cache_paths"

  "$nginx_bin" -t
  "$nginx_bin" -s reload
}

require_cmd git
require_cmd "$NODE_BIN"
require_cmd "$NPM_BIN"
require_cmd "$PM2_BIN"
require_cmd curl

cd "$APP_DIR"

if [ ! -f ".env.local" ]; then
  echo "Missing .env.local in $APP_DIR; refusing to deploy" >&2
  exit 1
fi

if [ ! -d ".git" ]; then
  echo "$APP_DIR is not a git checkout; set up git-based deploy first" >&2
  exit 1
fi

log "Fetching ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
git fetch --prune "$DEPLOY_REMOTE" "+refs/heads/${DEPLOY_BRANCH}:refs/remotes/${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"

log "Resetting worktree to ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
git reset --hard "${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
git clean -fd \
  -e .env.local \
  -e node_modules \
  -e .deploy \
  -e .next \
  -e tmp

log "Checking dependency state"
mkdir -p .deploy
current_lock_hash="$(sha_file package-lock.json)"
previous_lock_hash="$(cat .deploy/package-lock.sha256 2>/dev/null || true)"
if [ ! -d node_modules ] || [ "$current_lock_hash" != "$previous_lock_hash" ]; then
  log "Installing dependencies with npm ci"
  "$NPM_BIN" ci
  printf '%s\n' "$current_lock_hash" > .deploy/package-lock.sha256
else
  log "package-lock unchanged; skipping npm ci"
fi

log "Removing previous Next build output"
rm -rf .next

log "Building production app"
"$NPM_BIN" run build

log "Restarting PM2 process: $APP_NAME"
"$PM2_BIN" delete "$APP_NAME" >/dev/null 2>&1 || true
NODE_ENV=production PORT="$PORT" "$PM2_BIN" start node_modules/next/dist/bin/next --name "$APP_NAME" -- start -p "$PORT"
"$PM2_BIN" save || true

log "Checking local app health"
curl -fsS -I "http://127.0.0.1:${PORT}/training" | sed -n '1,12p'
curl -fsS -I "http://127.0.0.1:${PORT}/training/session" | sed -n '1,12p'

purge_nginx_cache_if_configured
run_training_probe

log "DEPLOY_OK ${DEPLOY_BRANCH} $(git rev-parse --short HEAD)"
