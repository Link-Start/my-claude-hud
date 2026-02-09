# My Claude HUD

> Claude Code 实时状态栏 HUD - 显示上下文使用量、活跃工具、运行中的 Agent、待办进度等。

[**English**](./README.en.md) | 中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.star-history.com/svg?repos=Link-Start/my-claude-hud&type=Date)](https://star-history.com/#Link-Start/my-claude-hud&Date)
[![Release](https://img.shields.io/github/v/release/Link-Start/my-claude-hud)](https://github.com/Link-Start/my-claude-hud/releases)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-blue)](https://github.com/anthropics/claude-code)

---

## 🙏 致谢

本项目灵感来源于 **[Jarrod Watts](https://github.com/jarrodwatts)** 的 **[claude-hud](https://github.com/jarrodwatts/claude-hud)** 项目。

> **感谢 Jarrod Watts** 创建了原始的 claude-hud 并与社区分享！你的工作为这个增强版本提供了基础和灵感。

虽然原始项目作为概念参考，但**本仓库的所有代码均从零编写**，以实现等效功能并添加以下增强：

- 🇨🇳 **中文语言支持**（默认）
- 🧠 **项目记忆系统**（跨会话行为追踪）
- 🔍 **语义化工具统计**（读取/编辑/执行/检查/通信）
- 📂 **目录级工具聚合**
- 🎯 **智能内容展示**（基于会话状态动态调整）
- 🐤 **金丝雀测试**（AI 上下文状态监控）
- 🎨 **5 种颜色主题**（default, nord, dracula, monokai, solarized）
- 📊 **会话统计和成本估算**

两个项目均采用 **MIT 许可证**发布。

---

## 功能特性

### 核心功能
- 📊 **上下文使用量** - 实时 Token 使用量显示，带颜色编码进度条
- 🔧 **活跃工具** - 显示当前运行和已完成的工具
- 🤖 **Agent 追踪** - 监控运行中的 Agent 及其状态
- ✅ **待办进度** - 显示待办事项完成状态
- 🌿 **Git 状态** - 分支、未提交状态、领先/落后、文件统计
- ⏱️ **会话时长** - 追踪已工作时长
- 📈 **API 使用量** - 5 小时和 7 天使用量窗口及重置时间
- 🎯 **配置统计** - 显示 CLAUDE.md、rules、MCPs 和 hooks 数量
- ⚡ **速度追踪** - 输出 Token 速度（tokens/秒）

### 增强功能
- 🧠 **项目记忆** - 跨会话项目行为追踪（热门文件、活跃目录、会话统计）
- 🔍 **语义化工具统计** - 按类别分组工具（读取/编辑/执行/检查/通信）
- 📂 **目录聚合** - 按目录聚合查看工具使用情况
- 🎯 **智能显示** - 内容根据会话状态调整（正常/忙碌/警告/严重）
- 🐤 **金丝雀测试** - 自动检测 AI 上下文状态
- 💰 **成本估算** - 根据 Token 使用量计算 API 成本
- ⏱️ **工具执行时间** - 显示每个工具的执行时长
- 🔔 **告警系统** - 上下文和 API 限制警告
- 📊 **上下文预测** - 预测剩余消息/时间
- 🎨 **颜色主题** - 5 种内置主题
- 📁 **项目特定配置** - 每个项目可覆盖全局设置
- 📈 **会话统计** - 跨会话使用量追踪
- 🔧 **快捷操作** - 常用操作的命令行工具
- 🗂️ **智能工具分组** - 相似工具分组显示更清晰
- 🌐 **多语言支持** - 中文/英文显示语言（默认：中文）
- 🌍 **自定义翻译** - 可创建任何语言的翻译文件

---

## 安装

选择你喜欢的安装方式：

### 方式 1: 从 GitHub 克隆（推荐）

```bash
cd ~/.claude/plugins
git clone https://github.com/Link-Start/my-claude-hud.git
cd my-claude-hud
npm install
npm run build
```

### 方式 2: 下载发布包

```bash
# 下载并解压最新发布版本
cd ~/.claude/plugins
curl -LO https://github.com/Link-Start/my-claude-hud/releases/latest/download/my-claude-hud.tar.gz
tar -xzf my-claude-hud.tar.gz
rm my-claude-hud.tar.gz
cd my-claude-hud
npm install
```

### 方式 3: 手动下载

1. 访问 [Releases](https://github.com/Link-Start/my-claude-hud/releases)
2. 下载最新的 `my-claude-hud.tar.gz`
3. 解压到 `~/.claude/plugins/my-claude-hud/`
4. 在插件目录运行 `npm install`

### 方式 4: 一键安装脚本（macOS/Linux）

```bash
curl -sSL https://raw.githubusercontent.com/Link-Start/my-claude-hud/master/scripts/install.sh | bash
```

---

## 配置

在 `~/.claude/settings.json` 中添加：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
  }
}
```

### 配置选项

创建 `~/.claude/plugins/my-claude-hud/config.json`：

```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "pathLevels": 1,
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showModel": true,
    "showContextBar": true,
    "contextValue": "percent",
    "showConfigCounts": true,
    "showDuration": true,
    "showSpeed": false,
    "showTokenBreakdown": true,
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showCost": false,
    "autocompactBuffer": "enabled",
    "usageThreshold": 0,
    "sevenDayThreshold": 80,
    "environmentThreshold": 0,
    "displayLanguage": "zh",
    "toolDetailLevel": "compact",
    "showMemoryInsights": true,
    "memoryInsightsPosition": "after",
    "smartDisplay": true
  },
  "alerts": {
    "enabled": true,
    "contextWarning": 80,
    "contextCritical": 95,
    "apiLimitWarning": 90
  },
  "theme": {
    "colorTheme": "default"
  },
  "memory": {
    "enabled": true,
    "maxProjects": 100,
    "maxFilesPerProject": 500,
    "trackingEnabled": true
  }
}
```

### 项目特定配置

在项目根目录创建 `.claude-hud.json` 以覆盖全局设置：

```json
{
  "lineLayout": "compact",
  "theme": {
    "colorTheme": "nord"
  },
  "alerts": {
    "contextWarning": 75
  }
}
```

### 自定义翻译

你可以创建自己的翻译文件来定制或翻译 HUD。

1. 复制示例翻译文件：
```bash
cp ~/.claude/plugins/my-claude-hud/examples/config.translations.example.json ~/.claude/plugins/my-claude-hud/config.translations.json
```

2. 编辑翻译文件：

```json
{
  "version": "1.0.0",
  "tools": {
    "Read": "读取",
    "Write": "写入",
    "Edit": "编辑"
  },
  "agentTypes": {
    "general-purpose": "通用助手"
  },
  "status": {
    "All todos complete": "所有任务已完成"
  },
  "toolGroups": {
    "File ops": "文件操作"
  }
}
```

3. 在配置中添加翻译文件路径：

```json
{
  "i18n": {
    "customTranslationFile": "./config.translations.json"
  }
}
```

---

## 颜色主题

可用主题：
- `default` - 标准终端颜色
- `nord` - 北极蓝灰主题
- `dracula` - 高对比度暗色主题
- `monokai` - 经典暗色主题
- `solarized` - Solarized Dark

---

## 快捷操作

```bash
# 切换布局模式
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=toggle-layout

# 显示统计信息
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=stats

# 清除所有缓存
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-cache

# 清除项目记忆
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-memory

# 金丝雀测试
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=canary-create
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=canary-check

# 显示帮助
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=help
```

---

## 布局模式

### Expanded（默认）
多行显示，会话信息、工具、Agent 和待办事项分开展示。

### Compact
单行显示，所有信息在一行中。

---

## 开发

```bash
npm install
npm run build
npm run dev  # 监听模式
npm test     # 运行测试
```

---

## 文档

- [核心功能](./docs/FEATURES.md) - 已实现功能列表
- [增强功能](./docs/ENHANCEMENTS.md) - 详细增强功能文档
- [实现计划](./docs/implementation-plan.md) - 开发进度
- [自定义翻译](./docs/TRANSLATIONS.md) - 如何创建自定义翻译文件
- [金丝雀测试](./docs/CANARY_TEST.md) - AI 上下文状态监控指南

---

## 与原版对比

| 功能 | 原 claude-hud | My Claude HUD |
|---------|-------------------|---------------|
| 上下文使用量 | ✅ | ✅ |
| 活跃工具 | ✅ | ✅ |
| Agent 追踪 | ✅ | ✅ |
| 待办进度 | ✅ | ✅ |
| Git 状态 | ✅ | ✅ |
| API 使用量 | ✅ | ✅ |
| 中文语言 | ❌ | ✅（默认） |
| 项目记忆 | ❌ | ✅ |
| 语义化工具统计 | ❌ | ✅ |
| 目录聚合 | ❌ | ✅ |
| 智能显示 | ❌ | ✅ |
| 金丝雀测试 | ❌ | ✅ |
| 颜色主题 | ✅ | ✅（5 种） |
| 成本估算 | ✅ | ✅ |
| 会话统计 | ✅ | ✅ |

---

## 许可证

MIT License - Copyright (c) 2026 Link-Start

本项目灵感来源于 [Jarrod Watts](https://github.com/jarrodwatts) 的 [claude-hud](https://github.com/jarrodwatts/claude-hud)（MIT License）。所有代码均从零编写，以实现等效功能并添加额外增强。

详见 [LICENSE](./LICENSE)。

---

## 链接

- **GitHub**: [https://github.com/Link-Start/my-claude-hud](https://github.com/Link-Start/my-claude-hud)
- **原始项目**: [https://github.com/jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)
- **作者**: [Link-Start](https://github.com/Link-Start)
- **原作者**: [Jarrod Watts](https://github.com/jarrodwatts)
