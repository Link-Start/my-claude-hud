# My Claude HUD

> **[中文说明](./README.md) | English**

Real-time statusline HUD for Claude Code - showing context usage, active tools, running agents, todo progress, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/Gateway-Link--Start-blue)](https://github.com/Link-Start)

---

## 🙏 Acknowledgments

This project is inspired by and reimplements functionality similar to **[claude-hud](https://github.com/jarrodwatts/claude-hud)** by **[Jarrod Watts](https://github.com/jarrodwatts)**.

> **Thank you, Jarrod Watts**, for creating the original claude-hud and sharing it with the community! Your work provided the foundation and inspiration for this enhanced version.

While the original project serves as the conceptual reference, **all code in this repository is written from scratch** to achieve equivalent functionality with additional enhancements:

- 🇨🇳 **Chinese language support** (default)
- 🧠 **Project memory system** (cross-session behavior tracking)
- 🔍 **Semantic tool statistics** (reading/editing/executing/inspecting/communicating)
- 📂 **Directory-level tool aggregation**
- 🎯 **Smart content display** (dynamic based on session state)
- 🐤 **Canary testing** (AI context state monitoring)
- 🎨 **5 color themes** (default, nord, dracula, monokai, solarized)
- 📊 **Session statistics and cost estimation**

Both projects are released under the **MIT License**.

---

## Features

### Core Features
- 📊 **Context Usage** - Real-time token usage display with color-coded progress bar
- 🔧 **Active Tools** - Shows currently running and completed tools
- 🤖 **Agent Tracking** - Monitor running agents and their status
- ✅ **Todo Progress** - Display todo completion status
- 🌿 **Git Status** - Branch, dirty state, ahead/behind, and file stats
- ⏱️ **Session Duration** - Track how long you've been working
- 📈 **API Usage** - 5-hour and 7-day usage windows with reset times
- 🎯 **Config Counts** - Display CLAUDE.md, rules, MCPs, and hooks counts
- ⚡ **Speed Tracking** - Output token speed (tokens/second)

### Enhanced Features
- 🧠 **Project Memory** - Cross-session project behavior tracking (hot files, active directories, session stats)
- 🔍 **Semantic Tool Stats** - Group tools by category (reading/editing/executing/inspecting/communicating)
- 📂 **Directory Aggregation** - View tool usage aggregated by directory
- 🎯 **Smart Display** - Content adjusts based on session state (normal/busy/warning/critical)
- 🐤 **Canary Testing** - Monitor AI context state with automatic detection
- 💰 **Cost Estimation** - Calculate API costs based on token usage
- ⏱️ **Tool Execution Time** - Display duration for each tool
- 🔔 **Alert System** - Warnings for context and API limits
- 📊 **Context Projection** - Predict remaining messages/time
- 🎨 **Color Themes** - 5 built-in themes
- 📁 **Project-Specific Config** - Override global settings per project
- 📈 **Session Statistics** - Track usage across sessions
- 🔧 **Quick Actions** - Command-line tools for common operations
- 🗂️ **Smart Tool Grouping** - Group similar tools for cleaner display
- 🌐 **Multi-Language Support** - Chinese/English display language (default: Chinese)
- 🌍 **Custom Translations** - Create your own translation file for any language

---

## Installation

Choose your preferred installation method:

### Method 1: Clone from GitHub (Recommended)

```bash
cd ~/.claude/plugins
git clone https://github.com/Link-Start/my-claude-hud.git
cd my-claude-hud
npm install
npm run build
```

### Method 2: Download Release

```bash
# Download and extract the latest release
cd ~/.claude/plugins
curl -LO https://github.com/Link-Start/my-claude-hud/releases/latest/download/my-claude-hud.tar.gz
tar -xzf my-claude-hud.tar.gz
rm my-claude-hud.tar.gz
cd my-claude-hud
npm install
```

### Method 3: Manual Download

1. Visit [Releases](https://github.com/Link-Start/my-claude-hud/releases)
2. Download the latest `my-claude-hud.tar.gz`
3. Extract to `~/.claude/plugins/my-claude-hud/`
4. Run `npm install` in the plugin directory

### Method 4: Install Script (macOS/Linux)

```bash
curl -sSL https://raw.githubusercontent.com/Link-Start/my-claude-hud/master/scripts/install.sh | bash
```

---

## Configuration

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
  }
}
```

### Configuration Options

Create `~/.claude/plugins/my-claude-hud/config.json`:

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

### Project-Specific Configuration

Create `.claude-hud.json` in your project root to override global settings:

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

### Custom Translations

You can create your own translation file to customize or translate the HUD to any language.

1. Copy the example translation file:
```bash
cp ~/.claude/plugins/my-claude-hud/examples/config.translations.example.json ~/.claude/plugins/my-claude-hud/config.translations.json
```

2. Edit the translation file with your custom translations:

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

3. Add the translation file path to your config:

```json
{
  "i18n": {
    "customTranslationFile": "./config.translations.json"
  }
}
```

---

## Color Themes

Available themes:
- `default` - Standard terminal colors
- `nord` - Arctic blue-gray theme
- `dracula` - High contrast dark theme
- `monokai` - Classic dark theme
- `solarized` - Solarized Dark

---

## Quick Actions

```bash
# Toggle layout mode
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=toggle-layout

# Show statistics
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=stats

# Clear all caches
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-cache

# Clear project memory
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=clear-memory

# Canary testing
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=canary-create
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=canary-check

# Show help
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=help
```

---

## Layout Modes

### Expanded (default)
Multi-line display with separate sections for session info, tools, agents, and todos.

### Compact
Single-line display with all information in one line.

---

## Development

```bash
npm install
npm run build
npm run dev  # Watch mode
npm test     # Run tests
```

---

## Documentation

- [Core Features](./docs/FEATURES.md) - List of implemented features
- [Enhancements](./docs/ENHANCEMENTS.md) - Detailed enhancement documentation
- [Implementation Plan](./docs/implementation-plan.md) - Development progress
- [Custom Translations](./docs/TRANSLATIONS.md) - How to create custom translation files
- [Canary Testing](./docs/CANARY_TEST.md) - AI context state monitoring guide

---

## Comparison with Original

| Feature | Original claude-hud | My Claude HUD |
|---------|-------------------|---------------|
| Context Usage | ✅ | ✅ |
| Active Tools | ✅ | ✅ |
| Agent Tracking | ✅ | ✅ |
| Todo Progress | ✅ | ✅ |
| Git Status | ✅ | ✅ |
| API Usage | ✅ | ✅ |
| Chinese Language | ❌ | ✅ (Default) |
| Project Memory | ❌ | ✅ |
| Semantic Tool Stats | ❌ | ✅ |
| Directory Aggregation | ❌ | ✅ |
| Smart Display | ❌ | ✅ |
| Canary Testing | ❌ | ✅ |
| Color Themes | ✅ | ✅ (5 themes) |
| Cost Estimation | ✅ | ✅ |
| Session Statistics | ✅ | ✅ |

---

## License

MIT License - Copyright (c) 2026 Link-Start

This project is inspired by and reimplements functionality similar to [claude-hud](https://github.com/jarrodwatts/claude-hud) by [Jarrod Watts](https://github.com/jarrodwatts) (MIT License). All code is written from scratch to achieve equivalent functionality with additional enhancements.

See [LICENSE](./LICENSE) for details.

---

## Links

- **GitHub**: [https://github.com/Link-Start/my-claude-hud](https://github.com/Link-Start/my-claude-hud)
- **Original Project**: [https://github.com/jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)
- **Author**: [Link-Start](https://github.com/Link-Start)
- **Original Author**: [Jarrod Watts](https://github.com/jarrodwatts)
