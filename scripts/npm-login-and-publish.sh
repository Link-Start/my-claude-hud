#!/bin/bash

# npm 登录和发布辅助脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          My Claude HUD - npm 登录与发布                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查是否已登录
echo -e "${YELLOW}🔐 检查 npm 登录状态...${NC}"
if npm whoami &> /dev/null; then
    USER=$(npm whoami)
    echo -e "${GREEN}✅ 已登录为: ${USER}${NC}"
    echo ""
    read -p "继续发布？(Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "已取消"
        exit 0
    fi
else
    echo -e "${RED}❌ 未登录 npm${NC}"
    echo ""
    echo "请按以下步骤登录："
    echo ""
    echo -e "${YELLOW}步骤 1:${NC} 如果没有 npm 账号，先注册"
    echo "  访问: https://www.npmjs.com/signup"
    echo ""
    echo -e "${YELLOW}步骤 2:${NC} 登录 npm"
    echo "  运行: npm login"
    echo "  输入:"
    echo "    - Username: 你的用户名"
    echo "    - Password: 你的密码"
    echo "    - Email: 你的邮箱（会收到验证码）"
    echo ""
    read -p "按回车键继续，会打开 npm login..."

    # 执行登录
    npm login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 登录失败${NC}"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✅ 登录成功！${NC}"
    USER=$(npm whoami)
    echo "  用户: ${USER}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📦 准备发布到 npm${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 显示发布信息
VERSION=$(node -p "require('./package.json').version")
echo "包名: my-claude-hud"
echo "版本: ${VERSION}"
echo "发布者: ${USER}"
echo ""

# 确认发布
read -p "确认发布？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}📋 发布步骤：${NC}"
echo "  1. 清理缓存"
echo "  2. 安装依赖"
echo "  3. 构建项目"
echo "  4. 发布到 npm"
echo ""

read -p "开始发布？(Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

# 清理缓存
echo ""
echo -e "${YELLOW}[1/4] 清理缓存...${NC}"
if command -v sudo &> /dev/null; then
    echo "  需要管理员权限清理缓存..."
    sudo rm -rf ~/.npm/_cacache 2>/dev/null || true
fi
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}  ✅ 完成${NC}"

# 安装依赖
echo ""
echo -e "${YELLOW}[2/4] 安装依赖...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 失败${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ 完成${NC}"

# 构建
echo ""
echo -e "${YELLOW}[3/4] 构建项目...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 失败${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ 完成${NC}"

# 发布
echo ""
echo -e "${YELLOW}[4/4] 发布到 npm...${NC}"
npm publish --access public
if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ 发布失败${NC}"
    echo ""
    echo "可能原因："
    echo "  1. 包名 'my-claude-hud' 已被占用"
    echo "  2. 网络问题"
    echo "  3. 权限问题"
    echo ""
    echo "解决方法："
    echo "  - 改名：编辑 package.json 的 name 字段"
    echo "  - 使用作用域包：@yourname/my-claude-hud"
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
echo "发布者: ${USER}"
echo ""
echo "📦 用户安装命令："
echo "  npm install -g my-claude-hud"
echo "  npm install -g my-claude-hud@${VERSION}"
echo ""
echo "🔗 查看包信息："
echo "  https://www.npmjs.com/package/my-claude-hud"
echo ""
echo "📋 查看包信息："
echo "  npm view my-claude-hud"
echo ""

# 创建 git tag
echo -e "${YELLOW}💡 建议：创建 git tag${NC}"
echo "  这会触发 GitHub 自动创建 Release"
echo ""
read -p "是否创建 git tag？(Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    git tag v${VERSION}
    git push origin v${VERSION}
    echo -e "${GREEN}  ✅ tag 已创建并推送${NC}"
fi

echo ""
echo -e "${GREEN}✅ 全部完成！${NC}"
