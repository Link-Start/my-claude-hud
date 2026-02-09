# npm 包发布完整指南

本文档记录了发布 npm 包的完整流程，包括准备工作、遇到的问题和解决方案。

---

## 📋 目录

- [准备工作](#准备工作)
- [发布流程](#发布流程)
- [常见问题与解决方案](#常见问题与解决方案)
- [CI/CD 自动化](#ci-cd-自动化)
- [最佳实践](#最佳实践)

---

## 准备工作

### 1. 注册 npm 账号

1. 访问 https://www.npmjs.com
2. 点击 "Sign Up" 注册账号
3. 验证邮箱（重要！）
4. 启用两步验证（2FA）- **强烈推荐**

### 2. 准备 package.json

确保 `package.json` 配置正确：

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "包的描述",
  "main": "dist/index.js",
  "bin": {
    "your-command": "./dist/index.js"
  },
  "files": [
    "dist",
    "config.json",
    "LICENSE",
    "README.md",
    "scripts/postinstall.js"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "postinstall": "node scripts/postinstall.js"
  },
  "keywords": [
    "keyword1",
    "keyword2"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/username/repo.git"
  },
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. 重要的配置说明

#### `files` 字段
指定要发布到 npm 的文件/目录：
```json
"files": [
  "dist",           // 编译后的代码
  "config.json",    // 配置文件
  "LICENSE",        // 许可证
  "README.md",      // 说明文档
  "scripts"         // 脚本目录（如 postinstall.js）
]
```

#### `bin` 字段
如果是 CLI 工具，指定命令入口：
```json
"bin": {
  "my-command": "./dist/index.js"  // 注意路径前缀 ./
}
```

⚠️ **常见错误**：不要写成 `"my-command": "dist/index.js"`，应该加上 `./` 前缀。

#### `prepublishOnly` 脚本
发布前自动执行的构建：
```json
"prepublishOnly": "npm run build"
```

⚠️ **注意**：
- 不要包含 `&& npm test`（如果测试有问题会导致发布失败）
- 如果没有测试文件，只保留 `npm run build`

---

## 发布流程

### 方法 1：使用 Granular Access Token（推荐）

#### 步骤 1：创建 Granular Access Token

1. 访问：https://www.npmjs.com/settings/your-username/tokens/granular-access-tokens/new
2. 填写表单：
   - **Token name**: `your-package-publish`（便于识别）
   - **Expiration**: 选择 90 天或 1 年
3. 配置权限：
   - **Packages and scopes**:
     - 选择 "Selected packages"
     - 输入包名：`your-package-name`
     - **Permissions**: 选择 `Read & Write`
4. **关键步骤**：
   - 滚动到 **"Automation"** 部分
   - ✅ **勾选 "Bypass two-factor authentication for this token"**
5. 点击 "Generate Token"
6. **立即复制 Token**（只显示一次！）

#### 步骤 2：发布包

```bash
cd /path/to/your-project

# 构建
npm run build

# 使用 Token 发布
npm publish --access public --//registry.npmjs.org/:_authToken=YOUR_TOKEN_HERE
```

#### 步骤 3：验证发布

```bash
# 查看包信息
npm view your-package-name

# 访问 npm 页面
# https://www.npmjs.com/package/your-package-name
```

---

### 方法 2：使用 npm login（不推荐 CI/CD）

```bash
# 登录 npm
npm login

# 发布
npm publish --access public
```

⚠️ **注意**：
- CI/CD 环境无法使用此方法（需要交互式输入 OTP）
- 不推荐用于自动化流程

---

## 常见问题与解决方案

### ❌ 问题 1：403 Forbidden - Two-factor authentication required

**错误信息**：
```
npm error 403 403 Forbidden - Two-factor authentication or granular access token
with bypass 2fa enabled is required to publish packages.
```

**原因**：
- Token 没有启用 "Bypass two-factor authentication" 选项
- npm 从 2025 年 11 月开始强制所有写权限 Token 需要 2FA

**解决方案**：
1. 重新创建 Granular Access Token
2. 确保勾选 ✅ **"Bypass two-factor authentication for this token"**
3. 使用新 Token 发布

---

### ❌ 问题 2：403 Forbidden - Insufficient permissions

**错误信息**：
```
npm error 403 403 Forbidden - You may not perform that action with these credentials
```

**原因**：
- Token 权限设置为 "Read only" 而不是 "Read & Write"

**解决方案**：
1. 检查 Token 的 Permissions 设置
2. 确保选择 **"Read & Write"** 而不是 "Read only"
3. 重新创建 Token

---

### ❌ 问题 3：编译错误 - TypeScript test files

**错误信息**：
```
src/__tests__/config.test.ts:5:10 - error TS2459: Module '"../config"'
declares 'mergeConfig' locally, but it is not exported.
```

**原因**：
- 测试文件导入了不存在的导出
- 测试文件是占位符，没有实际实现

**解决方案**：
```bash
# 删除有问题的测试文件
rm -f src/__tests__/*.test.ts

# 或修复测试文件，确保导入正确的导出
```

---

### ❌ 问题 4：Jest no tests found

**错误信息**：
```
npm ERR! Test failed.  No tests found, exiting with code 1
```

**原因**：
- `prepublishOnly` 脚本包含 `&& npm test`
- 但项目中没有测试文件

**解决方案**：

修改 `package.json`：
```json
{
  "scripts": {
    "prepublishOnly": "npm run build"
  }
}
```

不要包含测试：
```json
// ❌ 错误
"prepublishOnly": "npm run build && npm test"

// ✅ 正确
"prepublishOnly": "npm run build"
```

---

### ❌ 问题 5：package.json bin 格式警告

**警告信息**：
```
npm warn publish "bin[my-command]" script name was cleaned
```

**原因**：
- bin 字段没有使用正确的路径格式

**解决方案**：

```json
{
  "bin": {
    // ❌ 错误：没有 ./
    "my-command": "dist/index.js",

    // ✅ 正确：有 ./
    "my-command": "./dist/index.js"
  }
}
```

---

### ❌ 问题 6：包名已被占用

**错误信息**：
```
npm error 403 403 Forbidden - you cannot overwrite the existing version
```

**原因**：
- 包名已被其他用户发布
- 尝试发布已存在的版本号

**解决方案**：

1. 检查包名是否已存在：
```bash
npm view your-package-name
```

2. 如果包名被占用，选择其他名称：
```json
{
  "name": "@username/your-package-name"  // 使用作用域包名
}
```

3. 或更新版本号：
```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

---

### ❌ 问题 7：npm 缓存权限错误

**错误信息**：
```
EACCES: permission denied, open '/Users/xxx/.npm/_cacache/index-v5/...'
```

**原因**：
- npm 缓存目录权限问题

**解决方案**：

```bash
# 清理缓存（需要管理员权限）
sudo rm -rf ~/.npm/_cacache
npm cache clean --force

# 或不使用 sudo（仅当前用户）
npm cache clean --force
```

---

## CI/CD 自动化

### GitHub Actions 自动发布

创建 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 配置 GitHub Secrets

1. 访问仓库设置：https://github.com/username/repo/settings/secrets/actions
2. 添加 Secret：
   - **Name**: `NPM_TOKEN`
   - **Value**: 你的 Granular Access Token（带 Bypass 2FA）

### 触发自动发布

```bash
# 创建 tag
git tag v1.0.0

# 推送 tag
git push origin v1.0.0
```

这会自动触发 GitHub Actions：
1. 运行测试
2. 构建项目
3. 发布到 npm
4. 创建 GitHub Release

---

## 最佳实践

### 1. 版本管理

使用语义化版本（Semantic Versioning）：
- **MAJOR**：不兼容的 API 变更（1.0.0 -> 2.0.0）
- **MINOR**：向后兼容的功能新增（1.0.0 -> 1.1.0）
- **PATCH**：向后兼容的问题修复（1.0.0 -> 1.0.1）

```bash
# 自动更新版本并创建 git tag
npm version patch  # 修复 bug
npm version minor  # 新功能
npm version major  # 破坏性变更
```

### 2. 发布前检查清单

- [ ] `package.json` 配置正确
- [ ] 所有必需文件在 `files` 字段中
- [ ] `bin` 字段使用 `./` 前缀
- [ ] 版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] README.md 包含安装说明
- [ ] 本地构建成功：`npm run build`
- [ ] 测试通过：`npm test`（如果有）
- [ ] Token 权限正确（Read & Write + Bypass 2FA）

### 3. 安全建议

- ✅ 使用 Granular Access Token 而非 Classic Token
- ✅ 为 Token 设置过期时间（推荐 90 天）
- ✅ 仅授予必要的权限（Read & Write）
- ✅ 启用 Bypass 2FA（用于 CI/CD）
- ✅ 不要将 Token 提交到 Git
- ✅ 使用环境变量存储 Token

### 4. 文档建议

- **README.md**：项目介绍、安装方法、使用示例
- **CHANGELOG.md**：版本更新记录
- **LICENSE**：开源许可证（推荐 MIT）
- **CONTRIBUTING.md**：贡献指南

### 5. 发布脚本示例

创建 `scripts/npm-publish.sh`：

```bash
#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📦 发布到 npm${NC}"

# 检查登录
if ! npm whoami &> /dev/null; then
    echo -e "${RED}❌ 未登录 npm${NC}"
    echo "请先创建 Token："
    echo "  https://www.npmjs.com/settings/your-username/tokens/granular-access-tokens/new"
    exit 1
fi

# 构建
echo -e "${YELLOW}[1/3] 构建...${NC}"
npm run build

# 确认
VERSION=$(node -p "require('./package.json').version")
echo ""
echo "  包名: $(node -p "require('./package.json').name")"
echo "  版本: ${VERSION}"
echo ""
read -p "确认发布？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

# 发布
echo -e "${YELLOW}[2/3] 发布...${NC}"
npm publish --access public

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[3/3] ✅ 发布成功！${NC}"
    echo ""
    echo "📦 安装命令："
    echo "  npm install -g $(node -p "require('./package.json').name")"

    # 创建 git tag
    read -p "是否创建 git tag？(Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        git tag v${VERSION}
        git push origin v${VERSION}
        echo -e "${GREEN}✅ tag 已创建${NC}"
    fi
else
    echo -e "${RED}❌ 发布失败${NC}"
    exit 1
fi
```

使用方法：
```bash
chmod +x scripts/npm-publish.sh
./scripts/npm-publish.sh
```

---

## 📚 相关资源

- [npm 官方文档](https://docs.npmjs.com/)
- [语义化版本](https://semver.org/)
- [package.json 规范](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [npm Granular Access Tokens](https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/)

---

## 🎯 快速参考

```bash
# 查看包信息
npm view package-name

# 查看已安装的包
npm list -g --depth=0

# 登录 npm
npm login

# 发布包
npm publish --access public

# 更新版本
npm version patch|minor|major

# 清理缓存
npm cache clean --force

# 检查 registry
npm config get registry

# 切换 registry
npm config set registry https://registry.npmjs.org/
```

---

**最后更新**: 2026-02-09
**适用版本**: npm 10.x, Node.js 18.x/20.x
