#!/bin/bash

# GitHub Packages 发布脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     My Claude HUD - 发布到 GitHub Packages               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📦 GitHub Packages 优势：${NC}"
echo "  ✅ 免费无限使用"
echo "  ✅ 使用 GitHub 账号即可（无需注册）"
echo "  ✅ 与 GitHub 仓库无缝集成"
echo "  ✅ 支持公开和私有包"
echo ""

# 检查 .npmrc 配置
echo -e "${YELLOW}🔐 配置 npm registry...${NC}"

if ! grep -q "registry.github.com" ~/.npmrc 2>/dev/null; then
    echo "配置 GitHub Packages registry..."
    echo "" >> ~/.npmrc
    echo "# GitHub Packages registry" >> ~/.npmrc
    echo "@link-start:registry=https://npm.pkg.github.com" >> ~/.npmrc
    echo -e "${GREEN}✅ 已配置 registry${NC}"
else
    echo -e "${GREEN}✅ registry 已配置${NC}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 发布信息${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

VERSION=$(node -p "require('./package.json').version")
echo "包名: @link-start/my-claude-hud"
echo "版本: ${VERSION}"
echo "Registry: GitHub Packages"
echo ""

# 检查是否登录 GitHub
echo -e "${YELLOW}🔐 检查 GitHub Packages 认证...${NC}"

# 尝试从 git config 获取 token
GITHUB_TOKEN=$(git config --local --get github.token 2>/dev/null || echo "")

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ 未找到 GitHub Token${NC}"
    echo ""
    echo "请按以下步骤创建 Personal Access Token："
    echo ""
    echo "1. 访问: https://github.com/settings/tokens"
    echo "2. 点击 'Generate new token' → 'Generate new token (classic)'"
    echo "3. 设置权限："
    echo "   ✅ write:packages"
    echo "   ✅ read:packages"
    echo "4. 生成并复制 token"
    echo ""
    echo "5. 然后执行："
    echo "   npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN"
    echo ""
    read -p "按回车继续（请先完成上述步骤）..."

    # 重新检查
    GITHUB_TOKEN=$(cat ~/.npmrc 2>/dev/null | grep "//npm.pkg.github.com/:_authToken" | cut -d'=' -f2)

    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${RED}❌ 仍未配置 Token，取消发布${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ GitHub Token 已配置${NC}"

# 确认发布
echo ""
read -p "确认发布？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

# 清理缓存
echo ""
echo -e "${YELLOW}[1/3] 清理缓存...${NC}"
if command -v sudo &> /dev/null; then
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

# 发布
echo ""
echo -e "${YELLOW}[3/3] 发布到 GitHub Packages...${NC}"
npm publish
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 发布失败${NC}"
    echo ""
    echo "可能原因："
    echo "  1. Token 权限不足"
    echo "  2. 包名已存在"
    echo "  3. 网络问题"
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              🎉 发布成功到 GitHub Packages！              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "版本: ${VERSION}"
echo "包名: @link-start/my-claude-hud"
echo ""
echo "📦 用户安装命令："
echo "  npm install -g @link-start/my-claude-hud"
echo ""
echo "⚙️  用户需要先配置 registry："
echo "  npm config set @link-start:registry=https://npm.pkg.github.com"
echo ""
echo "🔗 查看包信息："
echo "  https://github.com/Link-Start?tab=packages"
echo ""
echo -e "${GREEN}✅ 全部完成！${NC}"
