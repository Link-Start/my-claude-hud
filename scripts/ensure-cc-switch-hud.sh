#!/bin/bash
# 确保 cc-switch 的所有 provider 配置都包含 statusLine

DB_FILE="$HOME/.cc-switch/cc-switch.db"
STATUS_LINE='"statusLine":{"type":"command","command":"node ~/.claude/plugins/my-claude-hud/dist/index.js"}'

if [ ! -f "$DB_FILE" ]; then
    echo "❌ cc-switch 数据库不存在: $DB_FILE"
    exit 1
fi

# 获取所有 provider IDs
PROVIDER_IDS=$(sqlite3 "$DB_FILE" "SELECT id FROM providers;")

UPDATED=0
for ID in $PROVIDER_IDS; do
    # 获取当前配置
    CURRENT_CONFIG=$(sqlite3 "$DB_FILE" "SELECT settings_config FROM providers WHERE id = '$ID';")

    # 检查是否已有 statusLine
    if echo "$CURRENT_CONFIG" | grep -q '"statusLine"'; then
        echo "✅ Provider $ID 已包含 statusLine"
        continue
    fi

    # 在语言设置后添加 statusLine（简体中文 替换为 简体中文,"statusLine":{...}）
    NEW_CONFIG=$(echo "$CURRENT_CONFIG" | sed 's/"language":"简体中文"/"language":"简体中文",'$STATUS_LINE'/')

    # 更新数据库
    sqlite3 "$DB_FILE" "UPDATE providers SET settings_config = '$NEW_CONFIG' WHERE id = '$ID';"

    if [ $? -eq 0 ]; then
        echo "✅ 已为 provider $ID 添加 statusLine"
        UPDATED=$((UPDATED + 1))
    else
        echo "❌ 更新 provider $ID 失败"
    fi
done

echo ""
echo "📊 共更新了 $UPDATED 个 provider 配置"

# 重新应用当前 provider 的配置
CURRENT_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM providers WHERE is_current = 1;")
echo "🔄 当前 provider ID: $CURRENT_ID"
echo "   请在 cc-switch 中重新切换一次配置以应用更改"
