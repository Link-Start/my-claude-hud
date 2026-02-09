#!/bin/bash

# 完整的 npm 登录和发布流程

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          My Claude HUD - npm 发布流程                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 步骤 1：切换 registry
echo -e "${YELLOW}[步骤 1/5] 切换到官方 npm registry${NC}"
ORIGINAL_REGISTRY=$(npm config get registry)
npm config set registry https://registry.npmjs.org/
echo -e "${GREEN}  ✅ 已切换到: $(npm config get registry)${NC}"
echo ""

# 步骤 2：检查登录
echo -e "${YELLOW}[步骤 2/5] 检查 npm 登录状态${NC}"
if npm whoami &> /dev/null; then
    USER=$(npm whoami)
    echo -e "${GREEN}  ✅ 已登录: ${USER}${NC}"
else
    echo -e "${RED}  ❌ 未登录 npm${NC}"
    echo ""
    echo "请手动登录 npm："
    echo ""
    echo "  npm login"
    echo ""
    echo "会提示输入："
    echo "  1. Username: 你的 npm 用户名"
    echo "  2. Password: 你的密码"
    echo "  3. Email: 邮箱验证码"
    echo ""
    read -p "登录完成后按回车继续..."

    # 重新检查
    if ! npm whoami &> /dev/null; then
        echo -e "${RED}❌ 登录失败，请检查："
        echo "  1. npm 账号是否已注册"
        echo "  2. 用户名密码是否正确"
        echo "  3. 邮箱是否已验证"
        exit 1
    fi

    USER=$(npm whoami)
    echo -e "${GREEN}  ✅ 登录成功: ${USER}${NC}"
fi

echo ""

# 步骤 3：清理和安装
echo -e "${YELLOW}[步骤 3/5] 清理缓存和安装依赖${NC}"
echo "  清理 npm 缓存..."
if command -v sudo &> /dev/null; then
    sudo rm -rf ~/.npm/_cacache 2>/dev/null || true
fi
npm cache clean --force 2>/dev/null || true

echo "  安装依赖..."
npm install
echo -e "${GREEN}  ✅ 完成${NC}"
echo ""

# 步骤 4：构建
echo -e "${YELLOW}[步骤 4/5] 构建项目${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ 构建完成${NC}"
echo ""

# 步骤 5：发布
echo -e "${YELLOW}[步骤 5/5] 发布到 npm${NC}"
VERSION=$(node -p "require('./package.json').version")
echo ""
echo "  包名: my-claude-hud"
echo "  版本: ${VERSION}"
echo "  发布者: ${USER}"
echo ""

read -p "确认发布？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

echo ""
echo "  正在发布..."
npm publish --access public
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 发布失败${NC}"
    echo ""
    echo "可能原因："
    echo "  1. 包名 'my-claude-hud' 已被占用"
    echo "  2. 需要验证邮箱"
    echo "  3. 网络问题"
    echo ""
    echo "解决方法："
    echo "  - 检查: npm view my-claude-hud"
    echo "  - 改名: 修改 package.json 的 name 字段"
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   🎉 发布成功！                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo "📦 用户安装命令："
echo "  npm install -g my-claude-hud"
echo "  npm install -g my-claude-hud@${VERSION}"
echo ""
echo "🔗 查看包信息："
echo "  https://www.npmjs.com/package/my-claude-hud"
echo "  npm view my-claude-hud"
echo ""

# 创建 git tag
echo ""
read -p "是否创建 git tag？(Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    git tag v${VERSION}
    git push origin v${VERSION}
    echo -e "${GREEN}✅ tag 已创建并推送${NC}"
    echo "  这会触发 GitHub Release"
fi

# 恢复 registry
echo ""
if [ "$ORIGINAL_REGISTRY" != "https://registry.npmjs.org/" ]; then
    read -p "是否恢复原 registry ($ORIGINAL_REGISTRY)？(Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        npm config set registry $ORIGINAL_REGISTRY
        echo -e "${GREEN}✅ 已恢复 registry${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ 全部完成！${NC}"
