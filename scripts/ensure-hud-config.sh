#!/bin/bash
# 确保 Claude HUD 配置持久化

SETTINGS_FILE="$HOME/.claude/settings.json"
STATUS_LINE_CONFIG='  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
  }'

# 检查 statusLine 是否存在
if ! grep -q '"statusLine"' "$SETTINGS_FILE" 2>/dev/null; then
    # 备份原文件
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak"

    # 在最后一个 } 之前插入 statusLine 配置
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/}/,$STATUS_LINE_CONFIG\n}/" "$SETTINGS_FILE"
    else
        # Linux
        sed -i "s/}/,$STATUS_LINE_CONFIG\n}/" "$SETTINGS_FILE"
    fi

    echo "✅ statusLine 配置已添加"
else
    echo "✅ statusLine 配置已存在"
fi
