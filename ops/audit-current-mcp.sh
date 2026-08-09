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
  printf '%-34s ' "$name"
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
  ss -ltnp 2>&1 | awk 'NR==1 || /:4005\b|:4015\b|:8090\b/' || true
fi

section "PM2"
if command -v pm2 >/dev/null 2>&1; then
  run pm2 status
  run pm2 describe alazab-mcp
  run pm2 describe alazab-openai-mcp
else
  echo "pm2 not installed"
fi

section "PUBLIC ENDPOINTS"
probe "public /mcp" "https://api.alazab.com/mcp"
probe "public /agent-tools" "https://api.alazab.com/agent-tools"
probe "oauth resource metadata" "https://api.alazab.com/.well-known/oauth-protected-resource"

section "LOCAL ENDPOINTS"
probe "legacy :4005 /health" "http://127.0.0.1:4005/health"
probe "legacy :4005 /mcp" "http://127.0.0.1:4005/mcp"
probe "OpenAI :4015 /health" "http://127.0.0.1:4015/health"
probe "OpenAI :4015 /mcp GET" "http://127.0.0.1:4015/mcp"
probe "OpenAI :4015 metadata" "http://127.0.0.1:4015/.well-known/oauth-protected-resource"
probe "tools :8090 /" "http://127.0.0.1:8090/"
probe "tools :8090 /health" "http://127.0.0.1:8090/health"

section "OPENAI MCP INITIALIZE"
if command -v curl >/dev/null 2>&1; then
  curl -ksS \
    --connect-timeout 5 \
    --max-time 12 \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"alazab-audit","version":"1.0.0"}}}' \
    http://127.0.0.1:4015/mcp 2>&1 || true
  echo
fi

section "NGINX ROUTING"
if command -v nginx >/dev/null 2>&1; then
  nginx -T 2>/dev/null | grep -nE \
    'api\.alazab\.com|location[[:space:]]+=?[[:space:]]*/mcp|oauth-protected-resource|location[[:space:]]+/agent-tools|127\.0\.0\.1:4005|127\.0\.0\.1:4015|127\.0\.0\.1:8090' \
    || true
else
  echo "nginx not installed"
fi

section "MCP SOURCES"
for SOURCE in \
  "/var/www/core/alazab.com/server/mcp/server.js" \
  "/var/www/core/alazab.com/server/mcp/openai/server.js" \
  "/var/www/core/alazab.com/server/mcp/openai/CONFIGURATION.md" \
  "/var/www/core/alazab.com/server/deploy/nginx/api-alazab-openai-mcp.locations.conf"
do
  if [[ -f "$SOURCE" ]]; then
    echo "Found: $SOURCE"
    stat "$SOURCE" 2>/dev/null || true
  else
    echo "Not found: $SOURCE"
  fi
done

section "RELATED SOURCE REFERENCES"
BASE="/var/www/core/alazab.com/server"
if [[ -d "$BASE" ]]; then
  grep -RniE --exclude='*.log' --exclude='.env' \
    'OPENAI_MCP_|ALAZAB_AUTH_SUPABASE_|MCP_INTERNAL_KEY|MCP_URL|MCP_PORT|agent-tools|oauth-protected-resource|/mcp' \
    "$BASE" 2>/dev/null | head -n 350 || true
else
  echo "Not found: $BASE"
fi

section "RESULT"
echo "Audit only. No nginx, PM2, source, environment, Supabase, or firewall state was modified."
