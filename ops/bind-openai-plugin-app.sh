#!/usr/bin/env bash
set -euo pipefail

APP_ID="${1:-}"
if [[ -z "$APP_ID" ]]; then
  echo "Usage: $0 plugin_asdk_app_<id>" >&2
  exit 2
fi

case "$APP_ID" in
  plugin_asdk_app_*|asdk_app_*|connector_*) ;;
  *)
    echo "Refusing unexpected app id: $APP_ID" >&2
    echo "Expected plugin_asdk_app_*, asdk_app_*, or connector_*" >&2
    exit 2
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_ROOT="$ROOT/plugins/alazab-operations"
APP_JSON="$PLUGIN_ROOT/.app.json"
MANIFEST="$PLUGIN_ROOT/.codex-plugin/plugin.json"

python3 - "$APP_JSON" "$MANIFEST" "$APP_ID" <<'PY'
import json
import pathlib
import sys

app_path = pathlib.Path(sys.argv[1])
manifest_path = pathlib.Path(sys.argv[2])
app_id = sys.argv[3]

if not manifest_path.is_file():
    raise SystemExit(f"Missing manifest: {manifest_path}")

app = {
    "apps": {
        "alazab": {
            "id": app_id,
        }
    }
}
app_path.write_text(json.dumps(app, indent=2) + "\n", encoding="utf-8")

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["apps"] = "./.app.json"
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

print(f"Bound Alazab plugin to {app_id}")
print(f"Updated: {app_path}")
print(f"Updated: {manifest_path}")
PY

python3 -m json.tool "$APP_JSON" >/dev/null
python3 -m json.tool "$MANIFEST" >/dev/null

echo
echo "Review changes:"
git -C "$ROOT" diff -- "$APP_JSON" "$MANIFEST" || true
