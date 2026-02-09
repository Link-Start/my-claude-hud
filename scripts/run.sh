#!/bin/bash
# My Claude HUD wrapper
PLUGIN_DIR="$HOME/.claude/plugins/my-claude-hud"
INDEX_JS="$PLUGIN_DIR/dist/index.js"

if [ -f "$INDEX_JS" ]; then
    exec node "$INDEX_JS" "$@"
else
    echo "[my-claude-hud] Error: Plugin not built (missing dist/index.js)" >&2
    exit 1
fi
