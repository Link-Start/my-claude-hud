# GitHub Packages 发布指南

由于 npm 不允许公开注册，我们改用 **GitHub Packages** 发布。

---

## ✅ GitHub Packages 优势

- ✅ **免费无限使用**
- ✅ **使用现有 GitHub 账号**（无需注册）
- ✅ **与 GitHub 仓库无缝集成**
- ✅ **支持公开和私有包**
- ✅ **自动 CI/CD 集成**

---

## 🚀 快速发布

### 方法 1：使用自动脚本（推荐）

```bash
cd /Users/link/Desktop/my-claude-hud
./scripts/github-publish.sh
```

### 方法 2：手动发布

#### 步骤 1：创建 GitHub Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
3. 设置名称（如：`my-claude-hud-publish`）
4. 勾选权限：
   - ✅ `write:packages`
   - ✅ `read:packages`
5. 点击 **"Generate token"**
6. **复制 token**（只显示一次！）

#### 步骤 2：配置 npm registry

```bash
# 配置 GitHub Packages registry
npm config set @link-start:registry=https://npm.pkg.github.com

# 添加认证 token
npm config set //npm.pkg.github.com/:_authToken YOUR_TOKEN_HERE

# 替换 YOUR_TOKEN_HERE 为刚才复制的 token
```

#### 步骤 3：发布

```bash
cd /Users/link/Desktop/my-claude-hud

# 构建
npm run build

# 发布
npm publish
```

---

## 📦 用户如何安装

由于 GitHub Packages 需要认证，用户需要先配置：

### 用户安装步骤

```bash
# 1. 配置 registry
npm config set @link-start:registry=https://npm.pkg.github.com

# 2. 添加自己的 GitHub Token（或设置为公开包）
npm config set //npm.pkg.github.com/:_authToken THEIR_GITHUB_TOKEN

# 3. 安装
npm install -g @link-start/my-claude-hud
```

### 或使用 .npmrc 文件

在项目根目录创建 `.npmrc`：

```
@link-start:registry=https://npm.pkg.github.com
```

---

## 🎯 设置为公开包（推荐）

让所有用户都能直接安装，无需 Token：

### 方式 1：在 GitHub 上设置

1. 访问：https://github.com/Link-Start?tab=packages
2. 找到 `@link-start/my-claude-hud` 包
3. 点击 **"Package settings"**
4. 滚动到底部 **"Danger Zone"**
5. 点击 **"Make public"**

### 方式 2：使用 GitHub CLI

```bash
# 安装 GitHub CLI（如果没有）
brew install gh

# 登录
gh auth login

# 设置包为公开
gh repo view --json packages
```

---

## 📝 package.json 配置说明

```json
{
  "name": "@link-start/my-claude-hud",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

- `name`: 使用作用域包名 `@username/package-name`
- `publishConfig.registry`: 指向 GitHub Packages registry

---

## 🔍 验证发布

### 查看包信息

```bash
npm view @link-start/my-claude-hud
```

### 在 GitHub 上查看

访问：https://github.com/Link-Start?tab=packages

---

## ⚠️ 常见问题

### 1. 401 Unauthorized

**原因：** Token 无效或未配置

**解决：**
```bash
# 重新设置 token
npm config set //npm.pkg.github.com/:_authToken YOUR_NEW_TOKEN
```

### 2. 404 Package not found

**原因：** 包名不存在或未发布

**解决：**
- 检查包名是否正确：`@link-start/my-claude-hud`
- 重新发布：`npm publish`

### 3. E403 Forbidden

**原因：** Token 权限不足

**解决：**
- 确保 Token 有 `write:packages` 权限
- 在 GitHub 设置中重新生成 Token

---

## 🔄 自动发布（CI/CD）

GitHub Actions 工作流已配置，会自动发布：

### 触发自动发布

```bash
# 创建 tag
git tag v1.0.0

# 推送 tag
git push origin v1.0.0
```

这会触发 `.github/workflows/release.yml`：
- ✅ 自动构建和测试
- ✅ 发布到 GitHub Packages
- ✅ 创建 GitHub Release

---

## 📚 相关文档

- [GitHub Packages 官方文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [创建 Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [配置 npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)

---

**准备好发布了吗？运行 `./scripts/github-publish.sh` 开始！** 🚀
