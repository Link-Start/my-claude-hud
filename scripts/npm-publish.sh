#!/bin/bash

# My Claude HUD - npm 发布脚本
# 此脚本会自动完成所有发布步骤

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          My Claude HUD - npm 发布脚本                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. 清理 npm 缓存
echo -e "${YELLOW}📦 清理 npm 缓存...${NC}"
if command -v sudo &> /dev/null; then
    sudo rm -rf ~/.npm/_cacache 2>/dev/null || echo "  ⚠️  需要 sudo 权限清理缓存"
else
    rm -rf ~/.npm/_cacache 2>/dev/null || echo "  ⚠️  缓存清理失败，继续..."
fi
npm cache clean --force
echo -e "${GREEN}✅ 缓存已清理${NC}"

# 2. 检查 npm 登录状态
echo ""
echo -e "${YELLOW}🔐 检查 npm 登录状态...${NC}"
if ! npm whoami &> /dev/null; then
    echo -e "${RED}❌ 未登录 npm${NC}"
    echo ""
    echo "请先登录 npm："
    echo "  1. 访问 https://www.npmjs.com/signup 注册账号（如果还没有）"
    echo "  2. 执行: npm login"
    echo "  3. 输入用户名、密码和邮箱"
    echo ""
    read -p "按回车键打开 npm login..."
    npm login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 登录失败，取消发布${NC}"
        exit 1
    fi
fi

USER=$(npm whoami)
echo -e "${GREEN}✅ 已登录为: ${USER}${NC}"

# 3. 确认发布信息
echo ""
echo -e "${YELLOW}📋 发布信息确认：${NC}"
VERSION=$(node -p "require('./package.json').version")
echo "  包名: my-claude-hud"
echo "  版本: ${VERSION}"
echo "  用户: ${USER}"
echo ""

read -p "确认发布？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 发布已取消${NC}"
    exit 0
fi

# 4. 安装依赖
echo ""
echo -e "${YELLOW}📦 安装依赖...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 5. 构建
echo ""
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 构建完成${NC}"

# 6. 运行测试（如果配置了）
if grep -q '"test"' package.json; then
    echo ""
    echo -e "${YELLOW}🧪 运行测试...${NC}"
    npm test
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 测试失败${NC}"
        read -p "是否继续发布？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ 测试通过${NC}"
fi

# 7. 发布
echo ""
echo -e "${YELLOW}🚀 发布到 npm...${NC}"
npm publish --access public
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 发布失败${NC}"
    echo ""
    echo "可能的原因："
    echo "  1. 包名已被占用（需要改名）"
    echo "  2. 网络问题"
    echo "  3. npm 配置问题"
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   🎉 发布成功！                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "版本: ${VERSION}"
echo "包名: my-claude-hud"
echo "作者: ${USER}"
echo ""
echo "📦 安装命令："
echo "  npm install -g my-claude-hud"
echo "  npm install -g my-claude-hud@${VERSION}"
echo ""
echo "🔗 查看包信息："
echo "  https://www.npmjs.com/package/my-claude-hud"
echo ""

# 8. 提示创建 git tag
echo -e "${YELLOW}💡 建议：创建 git tag${NC}"
echo "  git tag v${VERSION}"
echo "  git push origin v${VERSION}"
echo ""
echo "这会触发 GitHub Release 工作流自动创建 Release。"
echo ""
read -p "是否现在创建 tag？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag v${VERSION}
    git push origin v${VERSION}
    echo -e "${GREEN}✅ tag 已创建并推送${NC}"
fi

echo ""
echo -e "${GREEN}✅ 全部完成！${NC}"
