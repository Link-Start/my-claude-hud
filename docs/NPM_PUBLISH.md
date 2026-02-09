# npm 发布指南

本文档说明如何将 my-claude-hud 发布到 npm。

---

## 🚀 快速发布（推荐）

使用自动发布脚本：

```bash
./scripts/npm-publish.sh
```

脚本会自动完成：
1. ✅ 清理 npm 缓存
2. ✅ 检查登录状态
3. ✅ 安装依赖
4. ✅ 构建项目
5. ✅ 运行测试
6. ✅ 发布到 npm
7. ✅ 创建 git tag（可选）

---

## 📋 手动发布步骤

### 1. 注册 npm 账号

如果没有账号，访问 https://www.npmjs.com/signup 注册

### 2. 登录 npm

```bash
npm login
```

输入：
- 用户名
- 密码
- 邮箱（验证码）

### 3. 清理缓存（可选但推荐）

```bash
# macOS（需要 sudo）
sudo rm -rf ~/.npm/_cacache
npm cache clean --force
```

### 4. 安装依赖和构建

```bash
npm install
npm run build
```

### 5. 运行测试（如果配置了）

```bash
npm test
```

### 6. 发布

```bash
npm publish --access public
```

`--access public` 表示发布为公开包（免费）

---

## 🎯 发布后验证

### 检查包是否发布成功

```bash
# 查看包信息
npm view my-claude-hud

# 或访问网页
open https://www.npmjs.com/package/my-claude-hud
```

### 测试安装

```bash
# 全局安装
npm install -g my-claude-hud

# 测试运行
my-claude-hud --action=help
```

---

## 🏷️ 创建 Git Tag（推荐）

发布后创建 git tag，触发自动 Release：

```bash
# 创建 tag
git tag v1.0.0

# 推送 tag
git push origin v1.0.0
```

这会触发 `.github/workflows/release.yml` 工作流：
- ✅ 自动创建 GitHub Release
- ✅ 同步版本号到 npm

---

## 🔄 版本更新

### 修改版本号

编辑 `package.json`:

```json
{
  "version": "1.0.1"
}
```

或使用 npm 命令：

```bash
# 补丁版本（bug 修复）
npm version patch

# 小版本（新功能）
npm version minor

# 大版本（破坏性变更）
npm version major
```

### 重新发布

```bash
npm run build
npm publish
git tag v1.0.1
git push origin v1.0.1
```

---

## ⚠️ 常见问题

### 1. 包名已被占用

**错误信息：**
```
403 Forbidden - my-claude-hud is already taken
```

**解决方法：**
- 修改 `package.json` 中的 `name` 字段
- 例如：`@link/my-claude-hud` 或 `my-claude-hud-cli`

### 2. 权限错误

**错误信息：**
```
EACCES: permission denied
```

**解决方法：**
```bash
# 清理缓存（macOS）
sudo rm -rf ~/.npm/_cacache

# 或使用
npm cache clean --force
```

### 3. 未登录

**错误信息：**
```
npm ERR! code ENEEDAUTH
```

**解决方法：**
```bash
npm login
```

### 4. 2FA 双重认证

如果启用了 2FA，发布时需要输入 OTP：

```bash
npm publish --otp=123456
```

---

## 📦 发布清单

发布前检查：

- [ ] `package.json` 版本号正确
- [ ] 已更新 CHANGELOG.md
- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 已登录 npm
- [ ] 包名可用（首次发布）

发布后：

- [ ] 在 npm 验证包
- [ ] 测试安装
- [ ] 创建 git tag
- [ ] 更新 GitHub Release
- [ ] 通知用户（Discussions/README）

---

## 🔐 配置 GitHub Secrets（自动发布）

如果使用 GitHub Actions 自动发布：

### 1. 创建 npm Access Token

1. 访问 https://www.npmjs.com/settings/tokens
2. 点击 "New Token"
3. 选择 "Automation"
4. 复制 token

### 2. 添加到 GitHub Secrets

1. 访问仓库设置
2. Secrets → Actions → New repository secret
3. Name: `NPM_TOKEN`
4. Value: 粘贴刚才的 token

### 3. 测试自动发布

```bash
# 创建 tag 触发
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动：
- ✅ 运行测试
- ✅ 发布到 npm
- ✅ 创建 Release

---

## 📚 相关文档

- [npm 发布官方文档](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [.github/workflows/release.yml](../.github/workflows/release.yml)

---

**准备好发布了吗？运行 `./scripts/npm-publish.sh` 开始！** 🚀
