#!/usr/bin/env bash
set -u

section() {
  printf '\n=== %s ===\n' "$1"
}

run() {
  printf '\n$ %s\n' "$*"
  "$@" 2>&1 || true
}

probe() {
  local name="$1"
  local url="$2"
  printf '%-28s ' "$name"
  curl -ksS \
    --connect-timeout 5 \
    --max-time 12 \
    -o /dev/null \
    -w 'HTTP=%{http_code} type=%{content_type} remote=%{remote_ip} time=%{time_total}s\n' \
    "$url" 2>&1 || true
}

section "HOST"
run date --iso-8601=seconds
run hostnamectl
run uname -a
run node --version
run npm --version

section "LISTENERS"
if command -v ss >/dev/null 2>&1; then
  ss -ltnp 2>&1 | awk 'NR==1 || /:4005\b|:8090\b/' || true
fi

section "PM2"
if command -v pm2 >/dev/null 2>&1; then
  run pm2 status
  run pm2 describe alazab-mcp
else
  echo "pm2 not installed"
fi

section "PUBLIC ENDPOINTS"
probe "public /mcp" "https://api.alazab.com/mcp"
probe "public /agent-tools" "https://api.alazab.com/agent-tools"
probe "oauth resource metadata" "https://api.alazab.com/.well-known/oauth-protected-resource"

section "LOCAL ENDPOINTS"
probe "127.0.0.1:4005/mcp" "http://127.0.0.1:4005/mcp"
probe "127.0.0.1:8090" "http://127.0.0.1:8090/"
probe "127.0.0.1:8090/health" "http://127.0.0.1:8090/health"

section "NGINX ROUTING"
if command -v nginx >/dev/null 2>&1; then
  nginx -T 2>/dev/null | grep -nE 'api\.alazab\.com|location[[:space:]]+/mcp|location[[:space:]]+/agent-tools|127\.0\.0\.1:4005|127\.0\.0\.1:8090' || true
else
  echo "nginx not installed"
fi

section "LEGACY MCP SOURCE"
LEGACY="/var/www/core/alazab.com/server/mcp/server.js"
if [[ -f "$LEGACY" ]]; then
  echo "Found: $LEGACY"
  run stat "$LEGACY"
  echo
  sed -n '1,220p' "$LEGACY" 2>/dev/null || true
else
  echo "Not found: $LEGACY"
fi

section "RELATED SOURCE REFERENCES"
BASE="/var/www/core/alazab.com/server"
if [[ -d "$BASE" ]]; then
  grep -RniE --exclude='*.log' --exclude='.env' \
    'MCP_URL|MCP_PORT|agent-tools|x-alazab-signature|x-alazab-timestamp|x-alazab-nonce|/mcp' \
    "$BASE" 2>/dev/null | head -n 250 || true
else
  echo "Not found: $BASE"
fi

section "RESULT"
echo "Audit only. No nginx, PM2, source, environment, or firewall state was modified."
