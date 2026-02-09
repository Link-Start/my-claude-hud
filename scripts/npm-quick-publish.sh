#!/bin/bash

# npm 快速发布脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}          My Claude HUD - npm 快速发布                   ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# 确认 registry
echo -e "${YELLOW}📋 当前配置：${NC}"
echo "  Registry: $(npm config get registry)"
echo "  包名: my-claude-hud"
echo "  版本: $(node -p "require('./package.json').version")"
echo ""

# 检查登录
echo -e "${YELLOW}🔐 检查登录状态...${NC}"
if ! npm whoami &> /dev/null; then
    echo -e "${RED}❌ 未登录 npm${NC}"
    echo ""
    echo "请在浏览器中完成登录："
    echo ""
    echo "运行以下命令，会打开浏览器："
    echo "  npm login"
    echo ""
    read -p "按回车键，会在新窗口打开 npm login..."

    # 在新终端窗口登录
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm login"' 2>/dev/null || \
    xterm -e "npm login" & 2>/dev/null || \
    gnome-terminal -- npm login & 2>/dev/null

    echo ""
    echo -e "${YELLOW}等待登录完成...${NC}"
    read -p "登录完成后按回车继续..."

    # 重新检查
    if ! npm whoami &> /dev/null; then
        echo -e "${RED}❌ 仍未登录，取消发布${NC}"
        exit 1
    fi
fi

USER=$(npm whoami)
echo -e "${GREEN}✅ 已登录: ${USER}${NC}"

# 清理缓存
echo ""
echo -e "${YELLOW}[1/3] 清理缓存...${NC}"
if command -v sudo &> /dev/null; then
    echo "  需要管理员权限..."
    sudo rm -rf ~/.npm/_cacache 2>/dev/null || true
fi
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}  ✅ 完成${NC}"

# 构建
echo ""
echo -e "${YELLOW}[2/3] 构建项目...${NC}"
npm install
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ 完成${NC}"

# 确认发布
echo ""
read -p "确认发布到 npm？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

# 发布
echo ""
echo -e "${YELLOW}[3/3] 发布到 npm...${NC}"
npm publish --access public
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 发布失败${NC}"
    echo ""
    echo "可能原因："
    echo "  1. 包名 'my-claude-hud' 已被占用"
    echo "  2. 需要验证邮箱"
    echo "  3. 权限问题"
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 发布成功！                            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}"

VERSION=$(node -p "require('./package.json').version")
echo "版本: ${VERSION}"
echo "包名: my-claude-hud"
echo "发布者: ${USER}"
echo ""
echo "📦 用户安装命令："
echo "  npm install -g my-claude-hud"
echo "  npm install -g my-claude-hud@${VERSION}"
echo ""
echo "🔗 查看包信息："
echo "  https://www.npmjs.com/package/my-claude-hud"
echo ""

# 创建 git tag
read -p "是否创建 git tag？(Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    git tag v${VERSION}
    git push origin v${VERSION}
    echo -e "${GREEN}✅ tag 已创建并推送${NC}"
fi

# 恢复镜像源（可选）
echo ""
read -p "是否恢复 npm 镜像源？(Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm config set registry https://registry.npmmirror.com
    echo -e "${GREEN}✅ 已恢复镜像源${NC}"
fi

echo ""
echo -e "${GREEN}✅ 全部完成！${NC}"
