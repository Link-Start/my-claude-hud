#!/bin/bash

# Claude HUD 配置修复脚本
# 双击此脚本即可自动检查并修复 statusLine 配置

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Claude HUD 配置修复脚本 ===${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.claude/settings.local.json"
STATUS_LINE_CMD="node $SCRIPT_DIR/dist/index.js"

echo "📁 检查配置文件: $CONFIG_FILE"
echo ""

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  配置文件不存在，创建新文件...${NC}"
    mkdir -p "$(dirname "$CONFIG_FILE")"
    cat > "$CONFIG_FILE" << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "COMMAND_PLACEHOLDER"
  }
}
EOF
    # 替换占位符为实际路径
    sed -i '' "s|COMMAND_PLACEHOLDER|$STATUS_LINE_CMD|" "$CONFIG_FILE"
    echo -e "${GREEN}✅ 已创建配置文件并添加 statusLine${NC}"
    echo ""
    echo "📋 配置内容："
    cat "$CONFIG_FILE"
    echo ""
    echo -e "${GREEN}🎉 配置修复完成！请重启 Claude Code${NC}"
    read -p "按回车键关闭窗口..."
    exit 0
fi

# 检查是否已有 statusLine 配置
if grep -q '"statusLine"' "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ statusLine 配置已存在${NC}"
    echo ""
    echo "📋 当前配置："
    grep -A 3 '"statusLine"' "$CONFIG_FILE"
    echo ""
    echo -e "${GREEN}🎉 无需修复，配置正常！${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 statusLine 配置，准备添加...${NC}"

    # 使用 Python 来正确处理 JSON（macOS 自带）
    python3 - <<PYTHON_SCRIPT
import json
import sys

config_file = "$CONFIG_FILE"
status_line_cmd = "$STATUS_LINE_CMD"

try:
    with open(config_file, 'r') as f:
        config = json.load(f)

    # 添加 statusLine 配置
    config['statusLine'] = {
        "type": "command",
        "command": status_line_cmd
    }

    # 写回文件（保持格式）
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print("✅ 已成功添加 statusLine 配置")
except json.JSONDecodeError as e:
    print(f"❌ JSON 解析错误: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ 错误: {e}")
    sys.exit(1)
PYTHON_SCRIPT

    if [ $? -eq 0 ]; then
        echo ""
        echo "📋 更新后的配置："
        grep -A 3 '"statusLine"' "$CONFIG_FILE"
        echo ""
        echo -e "${GREEN}🎉 配置修复完成！请重启 Claude Code${NC}"
    else
        echo -e "${RED}❌ 配置修复失败${NC}"
        echo "请手动编辑文件：$CONFIG_FILE"
        read -p "按回车键关闭窗口..."
        exit 1
    fi
fi

echo ""
read -p "按回车键关闭窗口..."
