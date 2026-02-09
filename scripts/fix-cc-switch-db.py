#!/usr/bin/env python3
import sqlite3
import json

DB_FILE = "/Users/link/.cc-switch/cc-switch.db"
STATUS_LINE = {
    "statusLine": {
        "type": "command",
        "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
    }
}

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# 获取所有 provider
cursor.execute("SELECT id, name, settings_config FROM providers")
providers = cursor.fetchall()

updated = 0
for provider_id, name, config_json in providers:
    if not config_json or config_json.strip() == "":
        print(f"⚠️  Provider {name} ({provider_id}) 没有配置")
        continue

    try:
        config = json.loads(config_json)
        if not config:  # 检查解析后是否为空
            print(f"⚠️  Provider {name} ({provider_id}) 配置为空")
            continue

        # 检查是否已有 statusLine
        if "statusLine" in config:
            print(f"✅ {name} 已包含 statusLine")
            continue

        # 添加 statusLine
        config.update(STATUS_LINE)

        # 更新数据库
        cursor.execute(
            "UPDATE providers SET settings_config = ? WHERE id = ?",
            (json.dumps(config, ensure_ascii=False), provider_id)
        )
        updated += 1
        print(f"✅ 已为 {name} 添加 statusLine")

    except json.JSONDecodeError as e:
        print(f"❌ {name} 配置解析失败: {e}")

conn.commit()
conn.close()

print(f"\n📊 共更新了 {updated} 个 provider 配置")
