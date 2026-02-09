# 常见问题 (FAQ)

本文档收集了用户常见问题和解决方案。

---

## 🔧 安装与配置

### Q: 为什么 HUD 不显示？

**A:** 检查以下几点：

1. **确认 statusLine 配置**
   ```bash
   cat ~/.claude/settings.json | grep -A 3 "statusLine"
   ```

   应该看到：
   ```json
   "statusLine": {
     "type": "command",
     "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
   }
   ```

2. **确认文件存在**
   ```bash
   ls -la ~/.claude/plugins/my-claude-hud/dist/index.js
   ```

3. **确认 Node.js 可用**
   ```bash
   node --version
   ```

4. **手动测试 HUD**
   ```bash
   echo '{}' | node ~/.claude/plugins/my-claude-hud/dist/index.js
   ```

5. **重启 Claude Code**

如果以上都正常，查看[错误日志](#如何查看详细日志)。

---

### Q: 如何自动配置（配置总是丢失）？

**A:** 使用自动修复脚本：

**macOS 用户：**
```bash
cd /path/to/my-claude-hud
./fix-hud-config.command
```

**Linux 用户：**
```bash
cd /path/to/my-claude-hud
chmod +x scripts/ensure-hud-config.sh
./scripts/ensure-hud-config.sh
```

---

### Q: 与 cc-switch 配合使用时 HUD 消失？

**A:** cc-switch 切换配置时会覆盖 settings.json。使用专用脚本：

```bash
cd /path/to/my-claude-hud
./scripts/ensure-cc-switch-hud.sh
```

或 Python 版本：
```bash
python3 scripts/fix-cc-switch-db.py
```

---

## 🎨 自定义与主题

### Q: 如何切换颜色主题？

**A:** 编辑配置文件：

**全局配置：** `~/.claude/plugins/my-claude-hud/config.json`
**项目配置：** `.claude-hud.json`

```json
{
  "display": {
    "theme": "nord"
  }
}
```

可用主题：
- `default` - 默认彩色
- `nord` - Nord 风格
- `dracula` - Dracula 主题
- `monokai` - Monokai 主题
- `solarized` - Solarized 主题

---

### Q: 如何自定义颜色？

**A:** 创建自定义主题（在配置文件中）：

```json
{
  "display": {
    "theme": "custom",
    "customTheme": {
      "success": "#2ecc71",
      "warning": "#f39c12",
      "error": "#e74c3c",
      "info": "#3498db",
      "muted": "#95a5a6"
    }
  }
}
```

---

### Q: 如何切换紧凑/扩展布局？

**A:** 方法 1 - 使用命令：
```bash
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=toggle-layout
```

方法 2 - 修改配置：
```json
{
  "display": {
    "lineLayout": "expanded"
  }
}
```

---

## 📊 功能与支持

### Q: 支持哪些 Claude 模型？

**A:** 所有 Anthropic Claude 模型：

- ✅ Claude Opus 4.6
- ✅ Claude Sonnet 4.5
- ✅ Claude Haiku
- ✅ 所有未来模型

HUD 自动从 Claude Code 获取模型信息，无需手动配置。

---

### Q: API 使用量如何统计？

**A:** HUD 通过以下方式统计：

1. **OAuth 用户**（推荐）
   - 自动读取 Token
   - 实时查询官方 API
   - 显示 Max/Pro/Team 计划

2. **API Key 用户**
   - 需要配置 `ANTHROPIC_API_KEY`
   - 调用 `/v1/messages` 端点统计

3. **无法连接时**
   - 基于 token 数量估算成本
   - 显示 "上下文已丢失" 警告

---

### Q: 如何查看统计信息？

**A:** 使用 stats 命令：
```bash
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=stats
```

显示：
- 总会话次数
- 平均会话时长
- 总 token 使用量
- 估算成本

---

## 🐛 故障排除

### Q: 如何查看详细日志？

**A:** 启用调试模式：
```bash
DEBUG=my-claude-hud:* node ~/.claude/plugins/my-claude-hud/dist/index.js
```

或设置环境变量（永久）：
```bash
export DEBUG=my-claude-hud:*
```

---

### Q: 显示 "Canary: ⚠️ 丢失"？

**A:** Canary 数据丢失，不影响主要功能。

**解决方法：**
```bash
# 清除缓存
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-cache

# 重启 Claude Code
```

---

### Q: Git 状态不更新？

**A:** Git 缓存默认 5 秒 TTL。

**立即刷新：**
```bash
# 删除 Git 缓存
rm ~/.claude/plugins/my-claude-hud/.git-cache.json

# 或清除所有缓存
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-cache
```

---

### Q: 权限错误 (EACCES)？

**A:** macOS Keychain 权限问题。

**解决方法：**

1. **重置 Keychain 权限**
   ```bash
   security unlock-keychain ~/Library/Keychains/login.keychain-db
   ```

2. **或使用 API Key（绕过 Keychain）**
   ```bash
   export ANTHROPIC_API_KEY="your-api-key"
   ```

3. **清除缓存后重试**
   ```bash
   node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-cache
   ```

---

### Q: HUD 导致卡顿？

**A:** 调整缓存或减少功能。

**优化配置：**
```json
{
  "display": {
    "showCost": false,
    "showSpeed": false,
    "showAgent": false
  },
  "gitStatus": {
    "enabled": false
  }
}
```

---

## 📈 性能与优化

### Q: 缓存如何工作？

**A:** 多层缓存机制：

| 类型 | TTL | 位置 | 用途 |
|------|-----|------|------|
| API 使用量 | 60s (成功) / 15s (失败) | `.usage-cache.json` | 减少 API 调用 |
| Git 状态 | 5s | `.git-cache.json` | 避免频繁 git 命令 |
| 速度计算 | 持久 | 内存 | 跨渲染统计 |

**清除所有缓存：**
```bash
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-cache
```

---

### Q: 如何减少资源占用？

**A:**

1. **关闭不需要的功能**
   ```json
   {
     "gitStatus": { "enabled": false },
     "display": { "showCost": false }
   }
   ```

2. **增加缓存时间**（高级）
   - 编辑源码中的 TTL 常量

3. **使用紧凑布局**
   ```json
   {
     "display": { "lineLayout": "compact" }
   }
   ```

---

## 🌍 国际化

### Q: 如何切换语言？

**A:** 编辑 `~/.claude/settings.json`：

```json
{
  "language": "English"
}
```

或 `简体中文`。

---

## 🆘 获取帮助

### Q: 这些 FAQ 没有解决我的问题？

**A:** 其他求助方式：

1. **查看文档**
   - [README](README.md)
   - [CHANGELOG](CHANGELOG.md)
   - [CLAUDE.md](CLAUDE.md)

2. **搜索 Discussions**
   - [GitHub Discussions](https://github.com/Link-Start/my-claude-hud/discussions)

3. **提问**
   - 创建 [Discussion](https://github.com/Link-Start/my-claude-hud/discussions/new)
   - 或提交 [Issue](https://github.com/Link-Start/my-claude-hud/issues/new/choose)

4. **查看源码**
   - 调试模式运行查看日志

---

## 🔄 更新与维护

### Q: 如何更新到最新版本？

**A:**

**从 GitHub 安装：**
```bash
cd ~/.claude/plugins/my-claude-hud
git pull origin master
npm install
npm run build
```

**从 npm 安装（如果已发布）：**
```bash
npm update -g my-claude-hud
```

---

### Q: 如何卸载？

**A:**

1. **删除配置**
   ```bash
   # 编辑 ~/.claude/settings.json
   # 删除 "statusLine" 部分
   ```

2. **删除插件**
   ```bash
   rm -rf ~/.claude/plugins/my-claude-hud
   ```

3. **清除缓存**
   ```bash
   rm ~/.claude/plugins/my-claude-hud.*-cache.json
   ```

---

**还有问题？** [提交 Issue](https://github.com/Link-Start/my-claude-hud/issues/new/choose) 或在 [Discussions](https://github.com/Link-Start/my-claude-hud/discussions) 中提问！
